/* ==========================================================================
   paint-reveal.js — "Paint-It-Yourself" before/after reveal
   --------------------------------------------------------------------------
   Each .paint-reveal[data-before][data-after] becomes a canvas stage where the
   BEFORE photo is painted away with a roller to uncover the AFTER photo beneath
   (globalCompositeOperation 'destination-out'). The original drag slider stays
   in the DOM as a fully working fallback: if anything here fails (no canvas,
   reduced motion, image load error), the slider is what the visitor sees.

   Reusable across pages — it upgrades every matching node (home + gallery).
   ========================================================================== */
(function () {
    'use strict';

    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function supportsCanvas() {
        var c = document.createElement('canvas');
        return !!(c.getContext && c.getContext('2d'));
    }

    function coverRect(imgW, imgH, boxW, boxH) {
        // object-fit: cover geometry
        var scale = Math.max(boxW / imgW, boxH / imgH);
        var w = imgW * scale;
        var h = imgH * scale;
        return { x: (boxW - w) / 2, y: (boxH - h) / 2, w: w, h: h };
    }

    function PaintReveal(wrapper) {
        this.wrapper = wrapper;
        this.stage = wrapper.querySelector('.pr-stage');
        this.canvas = wrapper.querySelector('.pr-canvas');
        this.cursor = wrapper.querySelector('.pr-cursor');
        this.hint = wrapper.querySelector('.pr-hint');
        this.labelBefore = wrapper.querySelector('.pr-label-before');
        this.labelAfter = wrapper.querySelector('.pr-label-after');

        // Toolbar is the wrapper's following sibling.
        var sib = wrapper.nextElementSibling;
        while (sib && !sib.classList.contains('pr-toolbar')) sib = sib.nextElementSibling;
        this.toolbar = sib;
        if (this.toolbar) {
            this.percentEl = this.toolbar.querySelector('.pr-progress span');
            this.statusEl = this.toolbar.querySelector('.pr-sr-status');
            this.btnReset = this.toolbar.querySelector('.btn-outline');
            this.btnFinish = this.toolbar.querySelector('.btn-primary');
        }

        this.beforeSrc = wrapper.getAttribute('data-before');
        this.afterSrc = wrapper.getAttribute('data-after');

        this.ctx = null;
        this.cover = document.createElement('canvas');
        this.coverCtx = this.cover.getContext('2d', { willReadFrequently: true });

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.strokes = [];          // [{ r, pts:[{x,y}...] }] normalized 0..1
        this.current = null;        // active stroke
        this.mode = 'paint';        // 'paint' | 'wipe'
        this.wipePct = 0;
        this.percent = 0;
        this.painting = false;
        this.pendingTouch = false;
        this.downX = 0;
        this.downY = 0;
        this.lastCursorX = 0;
        this.lastSample = 0;
        this.demoTween = null;
        this.beforeImg = null;
        this.milestonesSeen = {};

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onKey = this.onKey.bind(this);
    }

    PaintReveal.prototype.init = function () {
        if (REDUCED || !this.stage || !this.canvas || !this.beforeSrc || !this.afterSrc) return;

        var self = this;
        // Defer the heavy image work until the section is near the viewport.
        // Observe the wrapper (visible) — the stage itself starts hidden, and a
        // display:none element never reports as intersecting.
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries, obs) {
                if (entries.some(function (e) { return e.isIntersecting; })) {
                    obs.disconnect();
                    self.load();
                }
            }, { rootMargin: '800px 0px' });
            io.observe(this.wrapper);
        } else {
            this.load();
        }
    };

    PaintReveal.prototype.load = function () {
        var self = this;
        var before = new Image();
        var after = new Image();
        before.src = this.beforeSrc;
        after.src = this.afterSrc;

        Promise.all([this.decode(before), this.decode(after)])
            .then(function () {
                self.beforeImg = before;
                self.upgrade();
            })
            .catch(function () {
                // Loading failed — leave the slider fallback untouched.
            });
    };

    PaintReveal.prototype.decode = function (img) {
        if (img.decode) {
            return img.decode().catch(function () {
                return new Promise(function (res, rej) {
                    img.onload = res; img.onerror = rej;
                    if (img.complete && img.naturalWidth) res();
                });
            });
        }
        return new Promise(function (res, rej) {
            if (img.complete && img.naturalWidth) { res(); return; }
            img.onload = res; img.onerror = rej;
        });
    };

    PaintReveal.prototype.upgrade = function () {
        this.ctx = this.canvas.getContext('2d');
        this.wrapper.classList.add('is-upgraded');
        this.stage.hidden = false;
        if (this.toolbar) this.toolbar.hidden = false;

        this.resize();
        this.stage.classList.add('is-ready');

        this.bind();
        this.observeResize();
        this.setupAutoDemo();
    };

    PaintReveal.prototype.cssSize = function () {
        var rect = this.stage.getBoundingClientRect();
        return { w: rect.width, h: rect.height };
    };

    PaintReveal.prototype.rollerRadius = function (cssW) {
        return Math.max(36, cssW * 0.07);
    };

    PaintReveal.prototype.resize = function () {
        var size = this.cssSize();
        if (size.w === 0) return;
        this.dpr = Math.min(window.devicePixelRatio || 1, 'ontouchstart' in window ? 1.5 : 2);

        this.canvas.width = Math.round(size.w * this.dpr);
        this.canvas.height = Math.round(size.h * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        // Coverage canvas (cheap to sample), proportional to the stage.
        this.cover.width = 96;
        this.cover.height = Math.max(1, Math.round(96 * size.h / size.w));

        this.replay();
    };

    PaintReveal.prototype.drawBefore = function () {
        var size = this.cssSize();
        var img = this.beforeImg;
        var r = coverRect(img.naturalWidth, img.naturalHeight, size.w, size.h);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.clearRect(0, 0, size.w, size.h);
        this.ctx.drawImage(img, r.x, r.y, r.w, r.h);

        // Coverage starts fully opaque (nothing revealed yet).
        this.coverCtx.globalCompositeOperation = 'source-over';
        this.coverCtx.fillStyle = '#000';
        this.coverCtx.clearRect(0, 0, this.cover.width, this.cover.height);
        this.coverCtx.fillRect(0, 0, this.cover.width, this.cover.height);
    };

    PaintReveal.prototype.replay = function () {
        if (!this.beforeImg) return;
        this.drawBefore();
        if (this.mode === 'wipe') {
            this.renderWipe(this.wipePct);
            return;
        }
        var size = this.cssSize();
        for (var i = 0; i < this.strokes.length; i++) {
            this.renderStroke(this.strokes[i], size);
        }
        this.sample(true);
    };

    PaintReveal.prototype.renderStroke = function (stroke, size) {
        var pts = stroke.pts;
        if (!pts.length) return;
        var rPx = stroke.r * size.w;
        this.eraseLine(this.ctx, pts, rPx, size.w, size.h, 1);
        var cs = this.cover.width / size.w;
        this.eraseLine(this.coverCtx, pts, rPx * cs, size.w, size.h, cs);
    };

    PaintReveal.prototype.eraseLine = function (ctx, pts, rPx, w, h, scale) {
        if (!pts || !pts.length) return;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = rPx * 2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x * w * scale, pts[0].y * h * scale);
        if (pts.length === 1) {
            // a dot
            ctx.lineTo(pts[0].x * w * scale + 0.01, pts[0].y * h * scale);
        } else {
            for (var i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x * w * scale, pts[i].y * h * scale);
            }
        }
        ctx.stroke();
    };

    // --- painting ---
    PaintReveal.prototype.stagePos = function (e) {
        var rect = this.stage.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
            px: e.clientX - rect.left,
            py: e.clientY - rect.top
        };
    };

    PaintReveal.prototype.startStroke = function (pos) {
        this.mode = 'paint';
        var size = this.cssSize();
        this.current = { r: this.rollerRadius(size.w) / size.w, pts: [{ x: pos.x, y: pos.y }] };
        this.strokes.push(this.current);
        this.stage.classList.add('is-touched', 'is-painting');
        this.renderStroke(this.current, size);
    };

    PaintReveal.prototype.extendStroke = function (pos) {
        if (!this.current) return;
        this.current.pts.push({ x: pos.x, y: pos.y });
        var size = this.cssSize();
        // Re-stroke just the latest two points for efficiency.
        var last2 = { r: this.current.r, pts: this.current.pts.slice(-2) };
        this.renderStroke(last2, size);
        this.throttledSample();
    };

    PaintReveal.prototype.endStroke = function () {
        this.current = null;
        this.painting = false;
        this.pendingTouch = false;
        this.stage.classList.remove('is-painting');
        this.sample(true);
    };

    // --- coverage sampling ---
    PaintReveal.prototype.throttledSample = function () {
        var now = performance.now();
        if (now - this.lastSample < 200) return;
        this.lastSample = now;
        this.sample(false);
    };

    PaintReveal.prototype.sample = function (force) {
        var data;
        try {
            data = this.coverCtx.getImageData(0, 0, this.cover.width, this.cover.height).data;
        } catch (err) { return; }
        var revealed = 0;
        var total = data.length / 4;
        for (var i = 3; i < data.length; i += 4) {
            if (data[i] < 128) revealed++;
        }
        var pct = Math.round((revealed / total) * 100);
        this.setPercent(pct);
    };

    PaintReveal.prototype.setPercent = function (pct) {
        pct = Math.max(0, Math.min(100, pct));
        this.percent = pct;
        if (this.percentEl) this.percentEl.textContent = pct;
        this.stage.setAttribute('aria-valuenow', pct);

        // Labels cross-fade as the wall gets repainted.
        if (this.labelBefore) this.labelBefore.style.opacity = String(Math.max(0, 1 - pct / 55));
        if (this.labelAfter) this.labelAfter.style.opacity = String(Math.min(1, Math.max(0, (pct - 35) / 40)));

        this.announce(pct);
        if (pct >= 99) this.showComplete(); else this.hideComplete();
    };

    PaintReveal.prototype.announce = function (pct) {
        if (!this.statusEl) return;
        var marks = [25, 50, 75, 100];
        for (var i = 0; i < marks.length; i++) {
            if (pct >= marks[i] && !this.milestonesSeen[marks[i]]) {
                this.milestonesSeen[marks[i]] = true;
                this.statusEl.textContent = marks[i] === 100
                    ? 'Wall fully repainted. The finished result is revealed.'
                    : marks[i] + ' percent repainted.';
            }
        }
        if (pct < 25) this.milestonesSeen = {};
    };

    PaintReveal.prototype.showComplete = function () {
        if (this._flag) { this._flag.classList.add('is-visible'); return; }
        var flag = document.createElement('div');
        flag.className = 'pr-complete-flag is-visible';
        flag.innerHTML = 'Love this finish? <a href="#get-started">Get your free estimate</a>';
        this.stage.appendChild(flag);
        this._flag = flag;
    };

    PaintReveal.prototype.hideComplete = function () {
        if (this._flag) this._flag.classList.remove('is-visible');
    };

    // --- input ---
    PaintReveal.prototype.bind = function () {
        this.stage.addEventListener('pointerdown', this.onPointerDown);
        this.stage.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        window.addEventListener('pointercancel', this.onPointerUp);
        this.stage.addEventListener('keydown', this.onKey);

        var self = this;
        if (this.btnReset) this.btnReset.addEventListener('click', function () { self.reset(); });
        if (this.btnFinish) this.btnFinish.addEventListener('click', function () { self.revealAll(); });
    };

    PaintReveal.prototype.cancelDemo = function () {
        if (this.demoTween) { cancelAnimationFrame(this.demoTween); this.demoTween = null; }
    };

    PaintReveal.prototype.onPointerDown = function (e) {
        this.cancelDemo();
        var pos = this.stagePos(e);
        this.moveCursor(pos, 0);
        if (e.pointerType === 'touch') {
            // Wait to learn the gesture intent before hijacking the scroll.
            this.pendingTouch = true;
            this.downX = e.clientX;
            this.downY = e.clientY;
        } else {
            this.painting = true;
            // Capture so the stroke keeps painting when the pointer drags
            // beyond the stage edge.
            try { this.stage.setPointerCapture(e.pointerId); } catch (err) {}
            this.startStroke(pos);
        }
    };

    PaintReveal.prototype.onPointerMove = function (e) {
        var pos = this.stagePos(e);
        var dx = pos.px - this.lastCursorX;
        this.moveCursor(pos, dx);
        this.lastCursorX = pos.px;

        if (this.painting) {
            this.extendStroke(pos);
            return;
        }
        if (this.pendingTouch) {
            var ddx = e.clientX - this.downX;
            var ddy = e.clientY - this.downY;
            if (Math.hypot(ddx, ddy) > 8) {
                if (Math.abs(ddx) > Math.abs(ddy)) {
                    // Horizontal intent → paint.
                    this.pendingTouch = false;
                    this.painting = true;
                    try { this.stage.setPointerCapture(e.pointerId); } catch (err) {}
                    var rect = this.stage.getBoundingClientRect();
                    this.startStroke({ x: (this.downX - rect.left) / rect.width, y: (this.downY - rect.top) / rect.height });
                    this.extendStroke(pos);
                } else {
                    // Vertical intent → let the page scroll.
                    this.pendingTouch = false;
                }
            }
        }
    };

    PaintReveal.prototype.onPointerUp = function () {
        if (this.painting || this.current) this.endStroke();
        this.pendingTouch = false;
    };

    PaintReveal.prototype.moveCursor = function (pos, dx) {
        if (!this.cursor) return;
        var tilt = Math.max(-18, Math.min(18, dx * 1.1));
        var scale = this.painting ? 1.08 : 1;
        this.cursor.style.transform = 'translate(' + pos.px + 'px,' + pos.py + 'px) rotate(' + tilt + 'deg) scale(' + scale + ')';
    };

    PaintReveal.prototype.onKey = function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            this.mode = 'wipe';
            this.wipePct += (e.key === 'ArrowRight' ? 5 : -5);
            this.wipePct = Math.max(0, Math.min(100, this.wipePct));
            this.drawBefore();
            this.renderWipe(this.wipePct);
            this.stage.classList.add('is-touched');
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (this.percent >= 99) this.reset(); else this.revealAll();
        }
    };

    PaintReveal.prototype.renderWipe = function (pct) {
        var size = this.cssSize();
        // main canvas
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillRect(0, 0, size.w * pct / 100, size.h);
        // coverage
        this.coverCtx.globalCompositeOperation = 'destination-out';
        this.coverCtx.fillRect(0, 0, this.cover.width * pct / 100, this.cover.height);
        this.setPercent(pct);
    };

    // --- actions ---
    PaintReveal.prototype.reset = function () {
        this.cancelDemo();
        this.strokes = [];
        this.current = null;
        this.mode = 'paint';
        this.wipePct = 0;
        this.milestonesSeen = {};
        // Bring the hint back for the fresh wall.
        this.stage.classList.remove('is-touched');
        this.drawBefore();
        this.setPercent(0);
    };

    PaintReveal.prototype.revealAll = function () {
        this.cancelDemo();
        this.mode = 'wipe';
        // Old strokes no longer matter once the full wipe takes over; clearing
        // them keeps a later replay() from resurrecting them.
        this.strokes = [];
        this.stage.classList.add('is-touched');
        var self = this;
        var start = performance.now();
        var dur = 700;
        var from = this.wipePct;
        function step(now) {
            var t = Math.max(0, Math.min(1, (now - start) / dur));
            var pct = from + (100 - from) * t;
            self.wipePct = pct; // keep state in sync so resize/replay match the UI
            self.drawBefore();
            self.renderWipe(pct);
            if (t < 1) self.demoTween = requestAnimationFrame(step);
            else { self.demoTween = null; }
        }
        this.demoTween = requestAnimationFrame(step);
    };

    // --- auto demo ---
    PaintReveal.prototype.setupAutoDemo = function () {
        if (REDUCED) return;
        var self = this;
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (e) {
                if (e.isIntersecting && e.intersectionRatio >= 0.5) {
                    obs.disconnect();
                    if (!self.stage.classList.contains('is-touched')) self.runDemo();
                }
            });
        }, { threshold: 0.5 });
        io.observe(this.stage);
    };

    PaintReveal.prototype.runDemo = function () {
        var self = this;
        var size = this.cssSize();
        // Two diagonal S-strokes covering ~30% of the wall.
        var path = [
            { x: 0.15, y: 0.30 }, { x: 0.45, y: 0.38 }, { x: 0.70, y: 0.30 }, { x: 0.85, y: 0.40 },
            { x: 0.80, y: 0.62 }, { x: 0.50, y: 0.58 }, { x: 0.22, y: 0.66 }, { x: 0.40, y: 0.74 }
        ];
        var stroke = { r: this.rollerRadius(size.w) / size.w, pts: [{ x: path[0].x, y: path[0].y }] };
        this.strokes.push(stroke);
        this.mode = 'paint';
        this.stage.classList.add('is-touched');
        var start = performance.now();
        var dur = 1600;
        function step(now) {
            var t = Math.max(0, Math.min(1, (now - start) / dur));
            var fidx = t * (path.length - 1);
            var i = Math.floor(fidx);
            var frac = fidx - i;
            var a = path[i];
            var b = path[Math.min(path.length - 1, i + 1)];
            var pt = { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
            stroke.pts.push(pt);
            self.renderStroke({ r: stroke.r, pts: stroke.pts.slice(-2) }, size);
            self.moveCursor({ px: pt.x * size.w, py: pt.y * size.h }, (b.x - a.x) * 40);
            if (self.cursor) self.cursor.style.opacity = '1';
            self.throttledSample();
            if (t < 1) { self.demoTween = requestAnimationFrame(step); }
            else {
                self.demoTween = null;
                self.sample(true);
                if (self.cursor) self.cursor.style.opacity = '';
            }
        }
        this.demoTween = requestAnimationFrame(step);
    };

    // --- resize ---
    PaintReveal.prototype.observeResize = function () {
        if (!('ResizeObserver' in window)) return;
        var self = this;
        var t;
        var ro = new ResizeObserver(function () {
            clearTimeout(t);
            t = setTimeout(function () { self.resize(); }, 150);
        });
        ro.observe(this.stage);
    };

    function boot() {
        if (!supportsCanvas()) return;
        var nodes = document.querySelectorAll('.paint-reveal[data-before][data-after]');
        Array.prototype.forEach.call(nodes, function (node) {
            new PaintReveal(node).init();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
