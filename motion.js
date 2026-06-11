/* ==========================================================================
   motion.js — Premium motion layer for Roly Home Services
   --------------------------------------------------------------------------
   Presentational layer built on GSAP + Lenis (loaded via CDN with defer).
   The site must remain fully functional without this file or its CDN
   dependencies: every effect here is an enhancement over a working CSS/JS
   fallback in style.css / app.js. Removing the motion.js script tag (or a
   CDN outage) simply returns the site to its baseline behavior.
   ========================================================================== */
(function () {
    'use strict';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HAS_GSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Public handle consumed by app.js hooks and flagship sections.
    window.RolyMotion = {
        reduced: REDUCED,
        lenis: null,
        animateFormStep: null
    };

    // Single global gate: with reduced motion or no GSAP, the CSS fallbacks
    // (scroll-behavior smooth, .reveal-on-scroll, form slide classes) take over.
    if (REDUCED || !HAS_GSAP) {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    if (typeof SplitText !== 'undefined') {
        gsap.registerPlugin(SplitText);
    }
    if (typeof Flip !== 'undefined') {
        gsap.registerPlugin(Flip);
    }

    function boot() {
        initLenis();
        initTitleReveals();
        initTrustBarStagger();
        initCardSpotlight();
        initHeroParallax();
        initFooterReveal();
        initFormMotion();
        initProcessStory();
        initGalleryFilter();
        // A late refresh catches layout shifts from font swapping.
        window.addEventListener('load', () => ScrollTrigger.refresh());
    }

    /* ======================================================================
       SMOOTH SCROLL CORE (Lenis + ScrollTrigger sync)
       ====================================================================== */
    function initLenis() {
        if (typeof Lenis === 'undefined') return;

        const lenis = new Lenis({ autoRaf: false });

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        // Same-page anchor links: Lenis's built-in `anchors` option does not
        // preventDefault, so the native hash jump still fires and the smooth
        // offset correction lands as a visible pop. Intercept clicks ourselves
        // and keep the target clear of the sticky header (70px + breathing room).
        const HEADER_OFFSET = -84;
        const scrollToAnchor = (target, isCorrection) => {
            lenis.scrollTo(target, {
                offset: HEADER_OFFSET,
                duration: isCorrection ? 0.25 : undefined,
                onComplete: () => {
                    // Layout can shrink mid-flight (header shrink, font swap,
                    // lazy images), leaving the target short of the offset.
                    // One corrective pass guarantees the landing position.
                    const top = target.getBoundingClientRect().top;
                    if (!isCorrection && Math.abs(top - Math.abs(HEADER_OFFSET)) > 4) {
                        scrollToAnchor(target, true);
                    }
                }
            });
        };
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href^="#"]');
            if (!link) return;
            const hash = link.getAttribute('href');
            if (!hash || hash.length < 2) return;
            const target = document.querySelector(hash);
            if (!target) return;
            event.preventDefault();
            scrollToAnchor(target, false);
            history.pushState(null, '', hash);
        });

        window.RolyMotion.lenis = lenis;
    }

    /* ======================================================================
       SECTION TITLE REVEALS (SplitText, words rising behind a line mask)
       ====================================================================== */
    function initTitleReveals() {
        const titles = document.querySelectorAll('.section-title');
        if (!titles.length || typeof SplitText === 'undefined') return;

        // Wait for the heading font so line breaks are measured correctly.
        document.fonts.ready.then(() => {
            titles.forEach((title) => {
                // Avoid a double translate: let the title carry the motion and
                // strip the directional shift from any parent reveal block.
                const block = title.closest('.reveal-on-scroll');
                if (block) block.classList.add('reveal-fade-only');

                const split = new SplitText(title, { type: 'lines,words', mask: 'lines' });
                gsap.from(split.words, {
                    yPercent: 110,
                    duration: 0.7,
                    stagger: 0.045,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: title, start: 'top 85%', once: true },
                    onComplete: () => split.revert()
                });
            });
        });
    }

    /* ======================================================================
       TRUST BAR — staggered entrance
       ====================================================================== */
    function initTrustBarStagger() {
        const items = gsap.utils.toArray('.trust-bar-item');
        if (!items.length) return;
        gsap.from(items, {
            y: 18,
            autoAlpha: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.trust-bar', start: 'top 90%', once: true }
        });
    }

    /* ======================================================================
       CARD SPOTLIGHT — orange glow that follows the pointer (fine pointers only)
       ====================================================================== */
    function initCardSpotlight() {
        if (!FINE_POINTER) return;
        const cards = document.querySelectorAll('.painting-card-main, .service-card-secondary, .avatar-card');
        cards.forEach((card) => {
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--spot-x', (e.clientX - r.left) + 'px');
                card.style.setProperty('--spot-y', (e.clientY - r.top) + 'px');
            });
        });
    }

    /* ======================================================================
       HERO — subtle parallax drift on the hero image (desktop only)
       ====================================================================== */
    function initHeroParallax() {
        if (window.innerWidth <= 992) return;
        const heroImg = document.querySelector('.hero-image-pane img');
        if (!heroImg) return;
        gsap.set(heroImg, { scale: 1.12 });
        gsap.to(heroImg, {
            yPercent: 9,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
    }

    /* ======================================================================
       FOOTER — staggered reveal of the top columns
       ====================================================================== */
    function initFooterReveal() {
        const items = gsap.utils.toArray('.site-footer .footer-top > *');
        if (!items.length) return;
        gsap.from(items, {
            autoAlpha: 0,
            y: 24,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.site-footer', start: 'top 92%', once: true }
        });
    }

    /* ======================================================================
       FORM STEP MOTION — exposes a hook consumed by app.js goToStep().
       Slide + fade + soft blur between steps; falls back to CSS classes if
       this hook is absent.
       ====================================================================== */
    function initFormMotion() {
        window.RolyMotion.animateFormStep = (fromEl, toEl, dir, done) => {
            if (!fromEl || fromEl === toEl) { done(); return; }
            gsap.killTweensOf([fromEl, toEl]);
            gsap.timeline({
                onComplete: () => {
                    done();
                    gsap.set([fromEl, toEl], { clearProps: 'opacity,visibility,transform,filter,display' });
                }
            })
            .to(fromEl, { autoAlpha: 0, xPercent: -6 * dir, filter: 'blur(4px)', duration: 0.2, ease: 'power2.in' })
            .set(fromEl, { display: 'none' })
            .set(toEl, { display: 'block' })
            .fromTo(toEl,
                { autoAlpha: 0, xPercent: 6 * dir, filter: 'blur(4px)' },
                { autoAlpha: 1, xPercent: 0, filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' });
        };
    }

    /* ======================================================================
       GALLERY FILTER — animated reflow with GSAP Flip (gallery.html only)
       ====================================================================== */
    function initGalleryFilter() {
        var grid = document.getElementById('galleryGrid');
        var filters = document.getElementById('galleryFilters');
        if (!grid || !filters) return;

        var cards = gsap.utils.toArray(grid.querySelectorAll('.gallery-card'));
        var btns = gsap.utils.toArray(filters.querySelectorAll('.gallery-filter'));
        var hasFlip = typeof Flip !== 'undefined';
        var isFlipping = false;

        btns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (isFlipping) return; // ignore clicks while a reflow animates
                btns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
                var cat = btn.getAttribute('data-filter');
                var state = hasFlip ? Flip.getState(cards) : null;

                cards.forEach(function (card) {
                    var show = cat === 'all' || card.getAttribute('data-category') === cat;
                    card.classList.toggle('is-hidden', !show);
                });

                if (hasFlip) {
                    isFlipping = true;
                    Flip.from(state, {
                        duration: 0.5,
                        ease: 'power2.inOut',
                        stagger: 0.04,
                        absolute: true,
                        onComplete: function () { isFlipping = false; },
                        onEnter: function (els) {
                            return gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4 });
                        },
                        onLeave: function (els) {
                            return gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 });
                        }
                    });
                }
            });
        });
    }

    /* ======================================================================
       CINEMATIC PROCESS STORY — pinned, scrubbed timeline with diagonal
       paint-wipe transitions, progress rail, oversized counter, wet-edge bar
       and a before -> after finale. Desktop only; mobile gets a snap carousel.
       ====================================================================== */

    // Diagonal clip-path polygons. closed = collapsed (nothing visible),
    // open = full cover. Same 4-point shape so GSAP can interpolate.
    const CLIP = {
        ltr: {
            closed: 'polygon(0% 0%, 0% 0%, -25% 100%, -25% 100%)',
            open: 'polygon(0% 0%, 125% 0%, 100% 100%, -25% 100%)'
        },
        rtl: {
            closed: 'polygon(100% 0%, 125% 0%, 125% 100%, 100% 100%)',
            open: 'polygon(-25% 0%, 125% 0%, 125% 100%, 0% 100%)'
        }
    };

    function initProcessStory() {
        const story = document.getElementById('scrollytelling-section');
        if (!story) return;

        const mm = gsap.matchMedia();

        // ---- Desktop: pinned cinematic timeline ----
        mm.add('(min-width: 993px) and (prefers-reduced-motion: no-preference)', () => {
            const layers = gsap.utils.toArray(story.querySelectorAll('.visual-layer'));
            const imgs = layers.map((l) => l.querySelector('.layer-img'));
            const steps = gsap.utils.toArray(story.querySelectorAll('.story-step'));
            const nodes = gsap.utils.toArray(story.querySelectorAll('.story-rail-node'));
            const fill = story.querySelector('#storyRailFill');
            const wipeBar = story.querySelector('#storyWipeBar');
            const counter = story.querySelector('#storyCounter');
            const finale = story.querySelector('#storyFinaleCta');
            if (layers.length < 4 || steps.length < 4) return;

            story.setAttribute('data-gsap', '');

            // Initial states
            gsap.set(layers, { autoAlpha: 0, zIndex: 1, clipPath: CLIP.ltr.open });
            gsap.set(layers[0], { autoAlpha: 1, zIndex: 2 });
            gsap.set(imgs, { scale: 1.06, y: 24 });
            gsap.set(imgs[0], { scale: 1, y: 0 });
            gsap.set(steps, { autoAlpha: 0, y: 24 });
            gsap.set(steps[0], { autoAlpha: 1, y: 0 });

            const setActiveNode = (i) => {
                nodes.forEach((n, idx) => n.classList.toggle('is-active', idx === i));
            };

            // Crisp (non-scrubbed) counter roll on step change. A fast scrub can
            // kill the previous roll mid-flight, so re-zero before rolling again.
            const rollCounter = (i) => {
                if (!counter) return;
                gsap.killTweensOf(counter);
                gsap.set(counter, { yPercent: 0 });
                gsap.timeline()
                    .to(counter, { yPercent: -100, duration: 0.12, ease: 'power1.in' })
                    .add(() => { counter.textContent = '0' + (i + 1); })
                    .fromTo(counter, { yPercent: 100 }, { yPercent: 0, duration: 0.2, ease: 'power2.out' });
            };

            // Derive the active step from scroll progress (robust in both
            // directions and immune to scrub callback ordering).
            const STEP_BANDS = [0, 0.18, 0.40, 0.62];
            let lastStep = 0;
            const updateStep = (i) => {
                if (i === lastStep) return;
                lastStep = i;
                setActiveNode(i);
                rollCounter(i);
            };
            const stepFromProgress = (p) => {
                let s = 0;
                for (let i = 0; i < STEP_BANDS.length; i++) {
                    if (p >= STEP_BANDS[i]) s = i;
                }
                return s;
            };

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: story,
                    start: 'top top',
                    end: '+=320%',
                    scrub: true,
                    pin: true,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        if (fill) fill.style.transform = 'scaleY(' + self.progress + ')';
                        updateStep(stepFromProgress(self.progress));
                    }
                }
            });

            // Brief dwell so step 1 reads before the first wipe. The label marks
            // the resting point each rail node seeks to.
            tl.addLabel('step0', 0.3);
            tl.to({}, { duration: 0.8 });

            const addWipe = (from, to, dir) => {
                const clip = CLIP[dir];
                const barFrom = dir === 'ltr' ? '-150%' : '750%';
                const barTo = dir === 'ltr' ? '750%' : '-150%';
                tl.set(layers[to], { zIndex: 3, autoAlpha: 1, clipPath: clip.closed })
                  .to(layers[to], { clipPath: clip.open, duration: 1, ease: 'power2.inOut' }, '<')
                  .to(imgs[to], { scale: 1, y: 0, duration: 1, ease: 'power2.out' }, '<')
                  .to(imgs[from], { scale: 1.04, duration: 1, ease: 'none' }, '<')
                  .fromTo(wipeBar, { opacity: 0.85, x: barFrom }, { x: barTo, opacity: 0, duration: 1, ease: 'power2.inOut' }, '<')
                  .to(steps[from], { autoAlpha: 0, y: -24, duration: 0.4 }, '<')
                  .to(steps[to], { autoAlpha: 1, y: 0, duration: 0.4 }, '<+=0.35')
                  .set(layers[from], { autoAlpha: 0, zIndex: 1 })
                  .set(layers[to], { zIndex: 2 })
                  .addLabel('step' + to) // resting point: wipe done, text settled
                  .to({}, { duration: 0.4 }); // breathing room between steps
            };

            addWipe(0, 1, 'ltr');
            addWipe(1, 2, 'rtl');
            addWipe(2, 3, 'ltr');

            // Finale: recap before -> after at full bleed, then reveal the CTA.
            tl.to(steps[3], { autoAlpha: 0, y: -24, duration: 0.3 })
              .add(() => { setActiveNode(3); })
              .set(layers[0], { zIndex: 4, autoAlpha: 1, clipPath: CLIP.ltr.open })
              .set(imgs[0], { scale: 1, y: 0 })
              .set(layers[3], { zIndex: 5, autoAlpha: 1, clipPath: CLIP.ltr.closed })
              .fromTo(wipeBar, { opacity: 0.85, x: '-150%' }, { x: '750%', opacity: 0, duration: 1, ease: 'power2.inOut' }, '<')
              .to(layers[3], { clipPath: CLIP.ltr.open, duration: 1, ease: 'power2.inOut' }, '<')
              .to(finale, { autoAlpha: 1, duration: 0.4 }, '>-0.1')
              .to({}, { duration: 0.3 });

            // Rail nodes seek to each step's resting label (not a naive i/4
            // fraction, which would land mid-wipe).
            nodes.forEach((node, i) => {
                node.addEventListener('click', () => {
                    const st = tl.scrollTrigger;
                    const labelTime = tl.labels['step' + i];
                    if (labelTime === undefined) return;
                    const target = st.start + (labelTime / tl.duration()) * (st.end - st.start);
                    if (window.RolyMotion.lenis) window.RolyMotion.lenis.scrollTo(target);
                    else window.scrollTo(0, target);
                });
            });

            return () => {
                story.removeAttribute('data-gsap');
            };
        });

        // ---- Mobile: snap carousel dot sync ----
        mm.add('(max-width: 992px)', () => {
            const pane = story.querySelector('.story-visual-pane');
            const dots = gsap.utils.toArray(story.querySelectorAll('.story-dot'));
            if (!pane || !dots.length) return;
            const onScroll = () => {
                const i = Math.round(pane.scrollLeft / Math.max(pane.clientWidth, 1));
                dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
            };
            pane.addEventListener('scroll', onScroll, { passive: true });
            return () => pane.removeEventListener('scroll', onScroll);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
