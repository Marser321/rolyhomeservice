/* ==========================================================================
   ROLY HOME SERVICES — 3D HOUSE COLOR LAB (presentational layer)

   Upgrades every [data-house-3d] container from the inline 2D SVG house to a
   draggable, low-poly 3D Craftsman built with three.js primitives. The CSS
   custom properties --color-house-* remain the single source of truth: app.js
   sets them and dispatches 'roly:housecolor'; this module only listens.

   Degradation contract (same as motion.js): if the visitor prefers reduced
   motion, WebGL is unavailable, or the three.js import fails, nothing here
   runs and the 2D SVG keeps working untouched. three.js (~170KB gzip) is only
   downloaded once the customizer approaches the viewport.
   ========================================================================== */
(function () {
    'use strict';

    const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (REDUCED) return;

    const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
    const ZONES = ['siding', 'trim', 'door', 'roof', 'shutters', 'garage'];

    const DAY = {
        sky: 0xeaf1f6,
        sun: { color: 0xffffff, intensity: 1.5 },
        hemi: 0.9,
        porch: 0
    };
    const DUSK = {
        sky: 0x243049,
        sun: { color: 0x9db4d4, intensity: 0.28 },
        hemi: 0.32,
        porch: 2.4
    };

    /* ----------------------------------------------------------------------
       Procedural textures — all drawn in GRAYSCALE (white base, translucent
       black shading) so the per-zone material.color keeps tinting them; the
       recolor tweens never need to regenerate a texture.
       ---------------------------------------------------------------------- */
    const makeTexture = (THREE, size, draw) => {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        draw(c.getContext('2d'), size);
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 4;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    };

    const makeShingleTexture = (THREE) => makeTexture(THREE, 512, (ctx, s) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, s, s);
        const rowH = 64, tileW = 128;
        for (let row = 0; row < s / rowH; row++) {
            const y = row * rowH;
            const offset = (row % 2) * (tileW / 2);
            for (let x = -tileW; x < s + tileW; x += tileW) {
                ctx.fillStyle = 'rgba(0,0,0,' + (0.05 + Math.random() * 0.13).toFixed(3) + ')';
                ctx.fillRect(x + offset, y, tileW - 3, rowH - 2);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.fillRect(0, y + rowH - 2, s, 2);
        }
    });

    const makeClapboardTexture = (THREE) => makeTexture(THREE, 512, (ctx, s) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, s, s);
        const boardH = 42;
        for (let y = 0; y < s; y += boardH) {
            const g = ctx.createLinearGradient(0, y, 0, y + boardH);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,0.10)');
            ctx.fillStyle = g;
            ctx.fillRect(0, y, s, boardH);
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(0, y + boardH - 2, s, 2);
        }
    });

    const makeGrassTexture = (THREE) => makeTexture(THREE, 256, (ctx, s) => {
        ctx.fillStyle = '#f1f1f1';
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 1500; i++) {
            ctx.fillStyle = 'rgba(0,0,0,' + (0.04 + Math.random() * 0.08).toFixed(3) + ')';
            ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random(), 1 + Math.random() * 1.5);
        }
    });

    const makeGarageDoorTexture = (THREE) => makeTexture(THREE, 256, (ctx, s) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, s, s);
        const panelH = s / 4;
        for (let i = 0; i < 4; i++) {
            const y = i * panelH;
            const g = ctx.createLinearGradient(0, y, 0, y + panelH);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,0.07)');
            ctx.fillStyle = g;
            ctx.fillRect(0, y, s, panelH);
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(0, y + 1, s, 2);
            ctx.fillStyle = 'rgba(0,0,0,0.30)';
            ctx.fillRect(0, y + panelH - 3, s, 3);
        }
    });

    // 2px-wide vertical gradient for the sky dome (white top -> gray horizon);
    // tinted by the dome material's color, tweened day <-> dusk.
    const makeSkyTexture = (THREE) => {
        const c = document.createElement('canvas');
        c.width = 2;
        c.height = 256;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(1, '#bfbfbf');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 2, 256);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    };

    const webglAvailable = () => {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl2') || canvas.getContext('webgl')));
        } catch (e) {
            return false;
        }
    };

    const readZoneColors = () => {
        const styles = getComputedStyle(document.documentElement);
        const colors = {};
        ZONES.forEach(zone => {
            colors[zone] = styles.getPropertyValue('--color-house-' + zone).trim() || '#888888';
        });
        return colors;
    };

    /* ----------------------------------------------------------------------
       One 3D stage per container
       ---------------------------------------------------------------------- */
    function HouseStage(THREE, container) {
        this.THREE = THREE;
        this.container = container;
        this.visible = true;
        this.dragging = false;
        this.autoRotate = true;
        this.spinVelocity = 0;
        this.colorTweens = {};   // zone -> { from, to, t }
        this.lightTween = null;  // { t, from, to }
        this.dusk = false;
        this.rafId = null;
        this.build();
    }

    HouseStage.prototype.build = function () {
        const THREE = this.THREE;
        const w = this.container.clientWidth || 600;
        const h = this.container.clientHeight || 420;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(DAY.sky);

        this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
        this.camera.position.set(5.4, 3.3, 7.8);
        this.camera.lookAt(0, 1.05, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(w, h, false);
        this.renderer.domElement.className = 'house-3d-canvas';
        this.container.appendChild(this.renderer.domElement);

        // Soft shadows — desktop only; touch devices skip the shadow pass.
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

        // Lights (sun + sky bounce + warm porch light for dusk mode)
        this.sun = new THREE.DirectionalLight(DAY.sun.color, DAY.sun.intensity);
        this.sun.position.set(5, 9, 5);
        this.sun.castShadow = !coarse;
        this.sun.shadow.mapSize.set(1024, 1024);
        this.sun.shadow.camera.left = -8;
        this.sun.shadow.camera.right = 8;
        this.sun.shadow.camera.top = 10;
        this.sun.shadow.camera.bottom = -4;
        this.sun.shadow.camera.near = 1;
        this.sun.shadow.camera.far = 30;
        this.sun.shadow.bias = -0.0005;
        this.scene.add(this.sun);

        this.hemi = new THREE.HemisphereLight(0xffffff, 0x8fa380, DAY.hemi);
        this.scene.add(this.hemi);

        this.porchLight = new THREE.PointLight(0xffb35c, DAY.porch, 7, 2);
        this.porchLight.position.set(-1.5, 1.7, 1.9);

        // Zone materials — recolored live, never recreated
        this.materials = {};
        const startColors = readZoneColors();
        ZONES.forEach(zone => {
            this.materials[zone] = new THREE.MeshStandardMaterial({
                color: new THREE.Color(startColors[zone]),
                roughness: 0.85,
                metalness: 0.02
            });
        });

        // Grayscale tint maps, generated once per stage. Trim/door/shutters
        // stay untextured on purpose (smooth painted surfaces read better).
        this.textures = {
            shingle: makeShingleTexture(THREE),
            clapboard: makeClapboardTexture(THREE),
            grass: makeGrassTexture(THREE),
            garageDoor: makeGarageDoorTexture(THREE)
        };
        this.textures.shingle.repeat.set(2.5, 1.5);
        this.textures.clapboard.repeat.set(2, 1.5);
        this.textures.grass.repeat.set(6, 6);
        this.materials.roof.map = this.textures.shingle;
        this.materials.roof.needsUpdate = true;
        this.materials.siding.map = this.textures.clapboard;
        this.materials.siding.needsUpdate = true;
        this.materials.garage.map = this.textures.garageDoor;
        this.materials.garage.needsUpdate = true;

        // Sky dome (inverted sphere, gradient tint map) + matching fog
        this.skyMat = new THREE.MeshBasicMaterial({
            map: makeSkyTexture(THREE),
            side: THREE.BackSide,
            fog: false,
            color: new THREE.Color(DAY.sky)
        });
        this.sky = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 12), this.skyMat);
        this.scene.add(this.sky);
        this.scene.fog = new THREE.Fog(DAY.sky, 18, 45);

        // Clouds — 3 clusters of flattened spheres, slow drift while rendering
        this.clouds = [];
        const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
        const cloudSpots = [[-14, 9.5, -8], [6, 10.5, -15], [13, 8.5, 6]];
        cloudSpots.forEach((spot, ci) => {
            const cloud = new THREE.Group();
            const puffs = 3 + (ci % 2);
            for (let i = 0; i < puffs; i++) {
                const puff = new THREE.Mesh(new THREE.SphereGeometry(1.1 + (i % 3) * 0.4, 10, 8), cloudMat);
                puff.position.set(i * 1.3 - puffs * 0.6, (i % 2) * 0.35, (i % 3) * 0.4);
                puff.scale.y = 0.5;
                cloud.add(puff);
            }
            cloud.position.set(spot[0], spot[1], spot[2]);
            this.scene.add(cloud);
            this.clouds.push(cloud);
        });

        // Stars — fade in at dusk only
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(200 * 3);
        for (let i = 0; i < 200; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.39; // upper cone, above the horizon haze
            const r = 36;
            starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPos[i * 3 + 1] = r * Math.cos(phi);
            starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        this.starsMat = new THREE.PointsMaterial({
            color: 0xffffff, size: 0.12, transparent: true, opacity: 0, fog: false
        });
        this.scene.add(new THREE.Points(starGeo, this.starsMat));

        this.buildHouse();
        this.bindPointer();
        this.observeResize();
        this.renderFrame();
    };

    HouseStage.prototype.buildHouse = function () {
        const THREE = this.THREE;
        const M = this.materials;
        const group = new THREE.Group();
        this.group = group;
        group.add(this.porchLight);

        const fixed = {
            lawn: new THREE.MeshStandardMaterial({ color: 0x8fae7e, roughness: 1 }),
            path: new THREE.MeshStandardMaterial({ color: 0xc9c4ba, roughness: 1 }),
            concrete: new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.95 }),
            chimney: new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.95 }),
            glassDay: new THREE.MeshStandardMaterial({ color: 0xcfe6ee, roughness: 0.15, metalness: 0.1 }),
            bush: new THREE.MeshStandardMaterial({ color: 0x5d7a4f, roughness: 1 }),
            knob: new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.6 }),
            trunk: new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: 1 }),
            leaves: new THREE.MeshStandardMaterial({ color: 0x44603e, roughness: 1 }),
            iron: new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.7, metalness: 0.3 })
        };
        fixed.lawn.map = this.textures.grass;
        fixed.lawn.needsUpdate = true;
        this.glassMat = fixed.glassDay;
        // Lantern bulbs share one material so the dusk tween lights them all
        this.lanternMat = new THREE.MeshStandardMaterial({
            color: 0xffe7c4, emissive: 0xffb35c, emissiveIntensity: 0, roughness: 0.4
        });

        const box = (mat, sx, sy, sz, x, y, z, ry) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
            mesh.position.set(x, y, z);
            if (ry) mesh.rotation.y = ry;
            group.add(mesh);
            return mesh;
        };

        // Lawn island
        const lawn = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.6, 0.3, 40), fixed.lawn);
        lawn.position.y = -0.15;
        lawn.receiveShadow = true;
        group.add(lawn);

        // Main body + foundation
        box(fixed.concrete, 3.7, 0.25, 2.7, -0.8, 0.125, 0);
        const body = box(M.siding, 3.6, 2.2, 2.6, -0.8, 1.35, 0);
        body.castShadow = true;
        const bodyTop = 2.45; // y of the main body's top face

        // Gable roof: two slanted slabs + siding gable walls + trim fascia
        const half = 2.1, rise = 1.35;
        const slopeLen = Math.sqrt(half * half + rise * rise) + 0.32;
        const pitch = Math.atan2(rise, half);
        const roofL = box(M.roof, slopeLen, 0.14, 3.1, -0.8 - half / 2, bodyTop + rise / 2, 0);
        roofL.rotation.z = pitch;
        roofL.castShadow = true;
        const roofR = box(M.roof, slopeLen, 0.14, 3.1, -0.8 + half / 2, bodyTop + rise / 2, 0);
        roofR.rotation.z = -pitch;
        roofR.castShadow = true;
        // Trim fascia boards just under the roof edges
        const fasciaL = box(M.trim, slopeLen, 0.1, 3.0, -0.8 - half / 2, bodyTop + rise / 2 - 0.11, 0);
        fasciaL.rotation.z = pitch;
        const fasciaR = box(M.trim, slopeLen, 0.1, 3.0, -0.8 + half / 2, bodyTop + rise / 2 - 0.11, 0);
        fasciaR.rotation.z = -pitch;

        // Gable triangle walls (siding) front + back
        const tri = new THREE.Shape();
        tri.moveTo(-1.8, 0); tri.lineTo(1.8, 0); tri.lineTo(0, rise); tri.lineTo(-1.8, 0);
        const triGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.06, bevelEnabled: false });
        const gableF = new THREE.Mesh(triGeo, M.siding);
        gableF.position.set(-0.8, bodyTop, 1.24);
        group.add(gableF);
        const gableB = new THREE.Mesh(triGeo, M.siding);
        gableB.position.set(-0.8, bodyTop, -1.3);
        group.add(gableB);

        // Gable vent (trim disc)
        const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 20), M.trim);
        vent.rotation.x = Math.PI / 2;
        vent.position.set(-0.8, bodyTop + 0.55, 1.33);
        group.add(vent);

        // Porch: deck, columns, canopy (front-left, around the door)
        box(fixed.concrete, 2.0, 0.18, 1.2, -1.5, 0.09, 1.9);
        const colGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.7, 12);
        [[-2.3, 2.35], [-0.7, 2.35]].forEach(p => {
            const col = new THREE.Mesh(colGeo, M.trim);
            col.position.set(p[0], 1.03, p[1]);
            col.castShadow = true;
            group.add(col);
        });
        const canopy = box(M.roof, 2.2, 0.1, 1.5, -1.5, 1.98, 1.85);
        canopy.rotation.x = 0.18;
        canopy.castShadow = true;
        box(M.trim, 2.2, 0.08, 0.1, -1.5, 1.86, 2.55);

        // Front door (accent zone) + frame + knob + steps
        box(M.trim, 0.72, 1.32, 0.05, -1.5, 0.84, 1.315);
        box(M.door, 0.56, 1.18, 0.07, -1.5, 0.77, 1.33);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), fixed.knob);
        knob.position.set(-1.31, 0.78, 1.38);
        group.add(knob);
        box(fixed.concrete, 1.0, 0.1, 0.5, -1.5, 0.05, 2.75);
        const walkway = box(fixed.path, 0.9, 0.04, 2.0, -1.5, 0.02, 3.9);
        walkway.receiveShadow = true;

        // Wall lanterns flanking the door — bulbs glow at dusk via lanternMat
        [[-1.98, 1.34], [-1.02, 1.34]].forEach(p => {
            box(M.trim, 0.07, 0.2, 0.07, p[0], 1.3, p[1]);
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), this.lanternMat);
            bulb.position.set(p[0], 1.28, p[1] + 0.03);
            group.add(bulb);
        });

        // House-number plate beside the door (tiny canvas texture, fixed look)
        const plateCanvas = document.createElement('canvas');
        plateCanvas.width = 64;
        plateCanvas.height = 32;
        const plateCtx = plateCanvas.getContext('2d');
        plateCtx.fillStyle = '#f5f2ea';
        plateCtx.fillRect(0, 0, 64, 32);
        plateCtx.fillStyle = '#2c3442';
        plateCtx.font = '700 22px Arial, sans-serif';
        plateCtx.textAlign = 'center';
        plateCtx.textBaseline = 'middle';
        plateCtx.fillText('248', 32, 17);
        const plateTex = new THREE.CanvasTexture(plateCanvas);
        plateTex.colorSpace = THREE.SRGBColorSpace;
        const plate = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.11, 0.02),
            new THREE.MeshBasicMaterial({ map: plateTex })
        );
        plate.position.set(-2.1, 1.05, 1.315);
        group.add(plate);

        // Windows with shutters — front pair (right of door) and right-side wall
        const addWindow = (x, y, z, ry) => {
            const win = new THREE.Group();
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.06), M.trim);
            const glass = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.82, 0.04), fixed.glassDay);
            glass.position.z = 0.02;
            const mull1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.86, 0.05), M.trim);
            mull1.position.z = 0.03;
            const mull2 = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.05, 0.05), M.trim);
            mull2.position.z = 0.03;
            const shL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.05), M.shutters);
            shL.position.x = -0.68;
            const shR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.05), M.shutters);
            shR.position.x = 0.68;
            win.add(frame, glass, mull1, mull2, shL, shR);
            win.position.set(x, y, z);
            if (ry) win.rotation.y = ry;
            group.add(win);
        };
        addWindow(0.25, 1.45, 1.33, 0);                    // front, beside the door
        addWindow(1.02, 1.45, 0.45, Math.PI / 2);          // right side wall
        addWindow(-2.62, 1.45, -0.45, -Math.PI / 2);       // left side wall

        // Chimney through the right roof slope
        const chimney = box(fixed.chimney, 0.42, 1.5, 0.42, 0.55, bodyTop + 0.55, -0.55);
        chimney.castShadow = true;
        box(fixed.concrete, 0.52, 0.1, 0.52, 0.55, bodyTop + 1.33, -0.55);

        // Gutters along both eaves + downspouts at the body corners
        box(M.trim, 0.09, 0.09, 3.12, -2.92, bodyTop + 0.04, 0);
        box(M.trim, 0.09, 0.09, 3.12, 1.32, bodyTop + 0.04, 0);
        box(M.trim, 0.07, 2.4, 0.07, -2.66, 1.25, 1.22);
        box(M.trim, 0.07, 2.4, 0.07, 1.06, 1.25, -1.22);

        // Garage wing (right of the main body)
        box(fixed.concrete, 1.9, 0.2, 2.15, 1.95, 0.1, 0);
        const garageBody = box(M.siding, 1.8, 1.5, 2.05, 1.95, 0.95, 0);
        garageBody.castShadow = true;
        const gRoof = box(M.roof, 2.1, 0.12, 2.4, 1.95, 1.83, 0);
        gRoof.rotation.z = -0.1;
        gRoof.castShadow = true;
        box(M.trim, 1.9, 0.1, 2.1, 1.95, 1.68, 0);
        // Garage door — panel relief comes from the procedural texture map
        box(M.garage, 1.3, 1.1, 0.07, 1.95, 0.62, 1.06);
        const driveway = box(fixed.path, 1.3, 0.04, 2.2, 1.95, 0.02, 2.3);
        driveway.receiveShadow = true;

        // Mailbox at the end of the front walkway
        box(fixed.iron, 0.06, 0.9, 0.06, -2.05, 0.45, 4.55);
        box(fixed.iron, 0.24, 0.17, 0.38, -2.05, 0.97, 4.55);

        // Two low-poly trees behind the house (rotate with the lawn island)
        [[-3.4, -2.7, 1.0], [2.9, -2.4, 0.85]].forEach(t => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 10), fixed.trunk);
            trunk.position.set(t[0], 0.6 * t[2], t[1]);
            trunk.scale.setScalar(t[2]);
            trunk.castShadow = true;
            group.add(trunk);
            const lower = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.2, 9), fixed.leaves);
            lower.position.set(t[0], 1.5 * t[2], t[1]);
            lower.scale.setScalar(t[2]);
            lower.castShadow = true;
            group.add(lower);
            const upper = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 9), fixed.leaves);
            upper.position.set(t[0], 2.25 * t[2], t[1]);
            upper.scale.setScalar(t[2]);
            upper.castShadow = true;
            group.add(upper);
        });

        // Bushes along the front
        const bushGeo = new THREE.SphereGeometry(0.3, 12, 10);
        [[-2.95, 1.6], [0.3, 2.15], [1.0, 1.9], [-0.45, 2.15]].forEach((p, i) => {
            const bush = new THREE.Mesh(bushGeo, fixed.bush);
            const s = 0.8 + (i % 3) * 0.18;
            bush.scale.set(s, s * 0.8, s);
            bush.position.set(p[0], 0.18, p[1]);
            group.add(bush);
        });

        this.group.rotation.y = -0.35;
        this.scene.add(this.group);
    };

    /* ------------------------------- Pointer -------------------------------- */
    HouseStage.prototype.bindPointer = function () {
        const el = this.renderer.domElement;
        let lastX = 0, lastY = 0, intent = false, pointerId = null;
        const self = this;

        el.addEventListener('pointerdown', (e) => {
            pointerId = e.pointerId;
            lastX = e.clientX; lastY = e.clientY;
            intent = e.pointerType !== 'touch'; // mouse/pen rotate immediately
            self.dragging = intent;
            self.autoRotate = false;
            self.spinVelocity = 0;
            self.container.classList.add('is-touched');
            if (intent) el.setPointerCapture(pointerId);
            self.wake();
        });

        el.addEventListener('pointermove', (e) => {
            if (e.pointerId !== pointerId) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;

            // Touch: only claim the gesture once it is clearly horizontal, so
            // vertical page scrolling stays untouched (touch-action: pan-y).
            if (!self.dragging) {
                if (e.pointerType === 'touch' && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
                    self.dragging = true;
                    el.setPointerCapture(pointerId);
                } else {
                    return;
                }
            }

            lastX = e.clientX; lastY = e.clientY;
            self.group.rotation.y += dx * 0.008;
            self.spinVelocity = dx * 0.008;
            self.wake();
        });

        const release = (e) => {
            if (e.pointerId !== pointerId) return;
            pointerId = null;
            self.dragging = false;
            self.wake(); // let inertia decay in the render loop
        };
        el.addEventListener('pointerup', release);
        el.addEventListener('pointercancel', release);
    };

    HouseStage.prototype.observeResize = function () {
        if (!('ResizeObserver' in window)) return;
        const self = this;
        this.resizeObserver = new ResizeObserver(() => {
            const w = self.container.clientWidth, h = self.container.clientHeight;
            if (!w || !h) return;
            self.camera.aspect = w / h;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize(w, h, false);
            self.wake();
        });
        this.resizeObserver.observe(this.container);
    };

    /* ----------------------------- Color & light ---------------------------- */
    HouseStage.prototype.setColor = function (zone, hex) {
        if (!this.materials[zone]) return;
        const THREE = this.THREE;
        this.colorTweens[zone] = {
            from: this.materials[zone].color.clone(),
            to: new THREE.Color(hex),
            t: 0
        };
        this.wake();
    };

    HouseStage.prototype.setDusk = function (dusk) {
        this.dusk = dusk;
        this.lightTween = { t: 0, to: dusk ? DUSK : DAY };
        this.wake();
    };

    /* ------------------------------ Render loop ----------------------------- */
    HouseStage.prototype.isAnimating = function () {
        return this.autoRotate || this.dragging || Math.abs(this.spinVelocity) > 0.0004 ||
            this.lightTween !== null || Object.keys(this.colorTweens).length > 0;
    };

    HouseStage.prototype.wake = function () {
        if (this.rafId === null && this.visible) this.renderFrame();
    };

    HouseStage.prototype.renderFrame = function () {
        const self = this;
        this.rafId = null;
        if (!this.visible) return;

        const THREE = this.THREE;

        if (this.autoRotate) this.group.rotation.y += 0.0028;

        if (!this.dragging && Math.abs(this.spinVelocity) > 0.0004) {
            this.group.rotation.y += this.spinVelocity;
            this.spinVelocity *= 0.94;
        }

        // Clouds drift only on frames that render anyway (no extra wake-ups)
        this.clouds.forEach(cloud => {
            cloud.position.x += 0.002;
            if (cloud.position.x > 24) cloud.position.x = -24;
        });

        Object.keys(this.colorTweens).forEach(zone => {
            const tw = self.colorTweens[zone];
            tw.t = Math.min(1, tw.t + 0.07);
            self.materials[zone].color.lerpColors(tw.from, tw.to, tw.t);
            if (tw.t >= 1) delete self.colorTweens[zone];
        });

        if (this.lightTween) {
            const tw = this.lightTween;
            tw.t = Math.min(1, tw.t + 0.05);
            const k = tw.t * tw.t * (3 - 2 * tw.t); // smoothstep
            const target = tw.to;
            this.sun.intensity += (target.sun.intensity - this.sun.intensity) * k;
            this.sun.color.lerp(new THREE.Color(target.sun.color), k);
            this.hemi.intensity += (target.hemi - this.hemi.intensity) * k;
            this.porchLight.intensity += (target.porch - this.porchLight.intensity) * k;
            this.scene.background.lerp(new THREE.Color(target.sky), k);
            this.skyMat.color.lerp(new THREE.Color(target.sky), k);
            this.scene.fog.color.lerp(new THREE.Color(target.sky), k);
            this.starsMat.opacity += ((this.dusk ? 0.9 : 0) - this.starsMat.opacity) * k;
            this.lanternMat.emissiveIntensity += ((this.dusk ? 1.2 : 0) - this.lanternMat.emissiveIntensity) * k;
            this.glassMat.emissive = this.glassMat.emissive || new THREE.Color(0x000000);
            this.glassMat.emissive.lerp(new THREE.Color(this.dusk ? 0x6b4a14 : 0x000000), k);
            if (tw.t >= 1) this.lightTween = null;
        }

        this.renderer.render(this.scene, this.camera);

        if (this.isAnimating()) {
            this.rafId = requestAnimationFrame(() => self.renderFrame());
        }
    };

    HouseStage.prototype.setVisible = function (visible) {
        this.visible = visible;
        if (visible) this.wake();
    };

    /* ----------------------------------------------------------------------
       Bootstrap: lazy-load three.js when a customizer approaches the viewport
       ---------------------------------------------------------------------- */
    const setup = () => {
        const containers = Array.prototype.slice.call(document.querySelectorAll('[data-house-3d]'));
        if (!containers.length || !webglAvailable()) return;

        const instances = [];
        let importPromise = null;

        const upgrade = (container) => {
            importPromise = importPromise || import(THREE_URL);
            importPromise.then((THREE) => {
                if (container.__houseStage) return;
                const stage = new HouseStage(THREE, container);
                container.__houseStage = stage;
                instances.push(stage);

                // The 2D SVG becomes the no-WebGL fallback only
                const svg = container.querySelector('svg');
                if (svg) svg.style.display = 'none';

                // The palette-card download needs a 3D frame to exist
                document.querySelectorAll('[data-palette-download]').forEach(btn => {
                    btn.hidden = false;
                });

                // Drag hint + Day/Dusk toggle (3D-only chrome)
                const hint = document.createElement('p');
                hint.className = 'house-3d-hint';
                hint.textContent = 'Drag to spin the house';
                container.appendChild(hint);

                const toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'house-mode-toggle';
                toggle.setAttribute('aria-pressed', 'false');
                toggle.textContent = 'View at Dusk';
                toggle.addEventListener('click', () => {
                    const dusk = !stage.dusk;
                    stage.setDusk(dusk);
                    toggle.classList.toggle('is-dusk', dusk);
                    toggle.setAttribute('aria-pressed', dusk ? 'true' : 'false');
                    toggle.textContent = dusk ? 'View in Daylight' : 'View at Dusk';
                });
                container.appendChild(toggle);

                // Pause rendering entirely while off-screen
                if ('IntersectionObserver' in window) {
                    new IntersectionObserver((entries) => {
                        entries.forEach(entry => stage.setVisible(entry.isIntersecting));
                    }, { threshold: 0 }).observe(container);
                }
            }).catch(() => { /* import failed — SVG fallback stays in charge */ });
        };

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        obs.unobserve(entry.target);
                        upgrade(entry.target);
                    }
                });
            }, { rootMargin: '600px 0px' });
            containers.forEach(c => io.observe(c));
        } else {
            containers.forEach(upgrade);
        }

        // Color sync from app.js (single source of truth: CSS vars + this event)
        document.addEventListener('roly:housecolor', (e) => {
            const d = e.detail || {};
            instances.forEach(stage => stage.setColor(d.type, d.color));
        });

        // Debug / verification API (snapshot also powers the palette-card download)
        window.RolyHouse3D = {
            instances,
            setColor: (zone, hex) => instances.forEach(s => s.setColor(zone, hex)),
            setDusk: (dusk) => instances.forEach(s => s.setDusk(dusk)),
            snapshot: () => {
                const stage = instances[0];
                if (!stage) return null;
                // Render and read back in the same tick — no preserveDrawingBuffer needed.
                stage.renderer.render(stage.scene, stage.camera);
                return stage.renderer.domElement.toDataURL('image/png');
            }
        };
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
