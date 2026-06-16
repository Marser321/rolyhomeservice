document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 0. CONFIG — GoHighLevel inbound webhook (lead capture)
    //    Paste the GHL "Inbound Webhook" trigger URL here to go live. While
    //    this is empty the form still works and logs the payload to the
    //    console, so the site is shippable before the CRM is wired.
    // ==========================================================================
    const GHL_WEBHOOK_URL = ''; // TODO(client): paste GoHighLevel inbound webhook URL
    const GHL_FILE_UPLOAD_ENABLED = false;
    const GUIDED_ESTIMATE_ENABLED = true;

    // Broad planning ranges only. Roly should approve these bands before
    // campaigns drive paid traffic to the form.
    const ESTIMATE_RATE_CARD = {
        interiorBase: [650, 1200],
        interiorRoom: [450, 875],
        trimPerRoom: [180, 375],
        ceilingPerRoom: [220, 450],
        interiorCondition: {
            clean: [0, 0],
            average: [250, 650],
            repairs: [650, 1600]
        },
        exteriorSize: {
            small: [3200, 6200],
            medium: [5200, 9800],
            large: [7800, 14500],
            estate: [11500, 22000]
        },
        storyAdd: {
            one: [0, 0],
            two: [900, 1900],
            three: [1800, 3600]
        },
        exteriorCondition: {
            clean: [0, 0],
            weathered: [700, 1800],
            repair: [1600, 3800]
        },
        cabinetCount: {
            small: [2800, 4800],
            medium: [4200, 7200],
            large: [6200, 9800],
            estate: [8500, 14000]
        },
        cabinetCondition: {
            clean: [0, 0],
            worn: [650, 1600],
            heavy: [1400, 3200]
        },
        addOns: {
            drywall: [450, 1800],
            pressureWashing: [450, 1200],
            deckFence: [900, 3600]
        }
    };

    // ==========================================================================
    // 1. MOBILE HAMBURGER MENU & HEADER SCROLL
    // ==========================================================================
    const hamburger = document.getElementById('hamburgerMenu');
    const navMenu = document.getElementById('navMenu');
    const header = document.querySelector('.site-header');

    if (hamburger && navMenu) {
        const spans = hamburger.querySelectorAll('span');

        const renderMenuIcon = (open) => {
            spans[0].style.transform = open ? 'rotate(45deg) translate(6px, 6px)' : 'none';
            spans[1].style.opacity = open ? '0' : '1';
            spans[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : 'none';
        };

        const closeMenu = () => {
            navMenu.classList.remove('active');
            renderMenuIcon(false);
            // Collapse the Services submenu whenever the mobile menu closes.
            navMenu.querySelectorAll('.nav-has-dropdown.open').forEach(dd => {
                dd.classList.remove('open');
                const t = dd.querySelector('.nav-dropdown-toggle');
                if (t) t.setAttribute('aria-expanded', 'false');
            });
        };

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            renderMenuIcon(navMenu.classList.contains('active'));
        });

        // Mobile: tap the caret to expand/collapse the Services submenu.
        // Desktop reveals it on hover/focus-within via CSS, where the .open
        // class is simply ignored, so this handler is safe on both.
        navMenu.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = toggle.closest('.nav-has-dropdown');
                const isOpen = dropdown.classList.toggle('open');
                toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        });

        // Close when choosing any menu link, including the CTA button.
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close when clicking outside the open menu.
        document.addEventListener('click', (e) => {
            if (!navMenu.classList.contains('active')) return;
            if (navMenu.contains(e.target) || hamburger.contains(e.target)) return;
            closeMenu();
        });

        // Close on Escape and restore focus to the toggle.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
                hamburger.focus();
            }
        });
    }

    // Shrink header on scroll
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('shrink');
            } else {
                header.classList.remove('shrink');
            }
        });
    }

    // ==========================================================================
    // 3. SCROLL REVEAL OBSERVER (a11y & motion compliant)
    // ==========================================================================
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    if ('IntersectionObserver' in window && revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Reveal only once
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => el.classList.add('visible'));
    }

    // Palette summary attached to the lead when the visitor uses the
    // "Get an Estimate with This Palette" CTA (set in section 5.3).
    let selectedPalette = '';

    // ==========================================================================
    // 4. PROGRESSIVE MULTI-STEP CRM FORM (with smooth slides & validation shake)
    // ==========================================================================
    const formContainer = document.getElementById('ghlProgressiveForm');
    
    if (formContainer) {
        const slides = formContainer.querySelectorAll('.form-slide');
        const nextBtns = formContainer.querySelectorAll('.btn-next');
        const prevBtns = formContainer.querySelectorAll('.btn-prev');
        const stepNodes = document.querySelectorAll('.step-node');
        const photoInput = document.getElementById('projectPhotos');
        const fileLabelText = document.getElementById('uploadFileText');
        const successCard = document.getElementById('formSuccessCard');
        const slidesWrapper = document.getElementById('formSlidesWrapper');
        const actionButtonsBar = document.getElementById('formActionButtonsBar');
        
        let currentStep = 1;
        const totalSteps = 4;
        
        const leadData = {
            projectType: '',
            avatarContext: '',
            zipCode: '',
            streetAddress: '',
            fullName: '',
            phoneNumber: '',
            email: '',
            projectDescription: '',
            preferredTime: '',
            photoAttached: false,
            photoStatus: GHL_FILE_UPLOAD_ENABLED ? 'not_attached' : 'requested_after_submit',
            scopeInputs: {},
            addOns: [],
            estimateRangeLow: null,
            estimateRangeHigh: null,
            estimateConfidence: 'planning'
        };

        const applyFieldMetadata = () => {
            const metadata = {
                projectZip: { name: 'projectZip', autocomplete: 'postal-code', inputmode: 'numeric' },
                projectAddress: { name: 'projectAddress', autocomplete: 'street-address' },
                clientName: { name: 'fullName', autocomplete: 'name' },
                clientPhone: { name: 'phoneNumber', autocomplete: 'tel', inputmode: 'tel' },
                clientEmail: { name: 'email', autocomplete: 'email', inputmode: 'email' },
                preferredSchedule: { name: 'preferredVisitWindow' },
                projectDesc: { name: 'projectDescription' },
                projectPhotos: { name: 'projectPhotos' }
            };

            Object.entries(metadata).forEach(([id, attrs]) => {
                const field = document.getElementById(id);
                if (!field) return;
                Object.entries(attrs).forEach(([attr, value]) => field.setAttribute(attr, value));
            });
        };

        const injectGuidedEstimateFields = () => {
            if (!GUIDED_ESTIMATE_ENABLED || formContainer.querySelector('#estimateScopePanel')) return;
            const descriptionField = document.getElementById('projectDesc');
            const descriptionGroup = descriptionField ? descriptionField.closest('.form-group') : null;
            if (!descriptionGroup) return;

            const panel = document.createElement('div');
            panel.className = 'estimate-scope-panel';
            panel.id = 'estimateScopePanel';
            panel.innerHTML = `
                <div class="estimate-panel-header">
                    <div>
                        <span class="section-label">Guided Planning Range</span>
                        <h5>Help us build a useful first estimate</h5>
                    </div>
                    <span class="estimate-pill">Approximate</span>
                </div>
                <p class="estimate-panel-copy">These details create a planning range only. Your final quote is confirmed after photos, scope review, or an on-site visit.</p>

                <div class="scope-fields" data-scope-fields="interior">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label" for="scopeInteriorRooms">Rooms or areas</label>
                            <input class="form-control" id="scopeInteriorRooms" name="scopeInteriorRooms" type="number" inputmode="numeric" min="1" max="12" value="2">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="scopeWallCondition">Wall condition</label>
                            <select class="form-control" id="scopeWallCondition" name="scopeWallCondition">
                                <option value="clean">Mostly clean / color change</option>
                                <option value="average" selected>Average scuffs and touch-ups</option>
                                <option value="repairs">Visible drywall or texture repairs</option>
                            </select>
                        </div>
                    </div>
                    <div class="estimate-check-row" aria-label="Interior add-ons">
                        <label><input type="checkbox" id="scopeInteriorTrim" name="scopeInteriorTrim"> Include trim/baseboards</label>
                        <label><input type="checkbox" id="scopeInteriorCeilings" name="scopeInteriorCeilings"> Include ceilings</label>
                    </div>
                </div>

                <div class="scope-fields" data-scope-fields="exterior">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label" for="scopeExteriorSize">Home size</label>
                            <select class="form-control" id="scopeExteriorSize" name="scopeExteriorSize">
                                <option value="small">Small / single section</option>
                                <option value="medium" selected>Average home</option>
                                <option value="large">Large home</option>
                                <option value="estate">Large or complex exterior</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="scopeExteriorStories">Stories</label>
                            <select class="form-control" id="scopeExteriorStories" name="scopeExteriorStories">
                                <option value="one">1 story</option>
                                <option value="two" selected>2 stories</option>
                                <option value="three">3 stories / high access</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="scopeExteriorCondition">Exterior condition</label>
                        <select class="form-control" id="scopeExteriorCondition" name="scopeExteriorCondition">
                            <option value="clean">Mostly clean</option>
                            <option value="weathered" selected>Weathered paint or prep needed</option>
                            <option value="repair">Peeling paint, repair, or heavy prep</option>
                        </select>
                    </div>
                </div>

                <div class="scope-fields" data-scope-fields="cabinets">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label" for="scopeCabinetCount">Doors and drawers</label>
                            <select class="form-control" id="scopeCabinetCount" name="scopeCabinetCount">
                                <option value="small">Under 15</option>
                                <option value="medium" selected>15-25</option>
                                <option value="large">26-40</option>
                                <option value="estate">40+</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="scopeCabinetCondition">Cabinet condition</label>
                            <select class="form-control" id="scopeCabinetCondition" name="scopeCabinetCondition">
                                <option value="clean">Clean, ready to prep</option>
                                <option value="worn" selected>Worn finish / standard prep</option>
                                <option value="heavy">Heavy grain, damage, or extra prep</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="estimate-addons">
                    <p class="form-label">Optional restoration &amp; finishing add-ons</p>
                    <div class="estimate-check-row">
                        <label><input type="checkbox" id="addOnDrywall" name="addOnDrywall" value="drywall"> Drywall, trim &amp; repairs</label>
                        <label><input type="checkbox" id="addOnPressureWashing" name="addOnPressureWashing" value="pressureWashing"> Pressure washing / exterior prep</label>
                        <label><input type="checkbox" id="addOnDeckFence" name="addOnDeckFence" value="deckFence"> Deck or fence staining</label>
                    </div>
                </div>

                <div class="estimate-range-preview" id="estimateRangePreview" aria-live="polite">
                    <span>Planning range</span>
                    <strong>Choose a service to preview</strong>
                    <small>Not a final quote. Roly confirms scope before pricing.</small>
                </div>
            `;
            descriptionGroup.parentNode.insertBefore(panel, descriptionGroup);
        };

        const formatCurrency = (value) => {
            const rounded = Math.round(value / 50) * 50;
            return `$${rounded.toLocaleString('en-US')}`;
        };

        const addRange = (base, addition) => [base[0] + addition[0], base[1] + addition[1]];

        const collectScopeInputs = () => {
            const checkedAddOns = Array.from(formContainer.querySelectorAll('.estimate-addons input[type="checkbox"]:checked'))
                .map(input => input.value);
            const rooms = Math.max(1, Math.min(12, parseInt(document.getElementById('scopeInteriorRooms')?.value || '2', 10) || 2));

            const scope = {
                interiorRooms: rooms,
                includeTrim: Boolean(document.getElementById('scopeInteriorTrim')?.checked),
                includeCeilings: Boolean(document.getElementById('scopeInteriorCeilings')?.checked),
                wallCondition: document.getElementById('scopeWallCondition')?.value || 'average',
                exteriorSize: document.getElementById('scopeExteriorSize')?.value || 'medium',
                exteriorStories: document.getElementById('scopeExteriorStories')?.value || 'two',
                exteriorCondition: document.getElementById('scopeExteriorCondition')?.value || 'weathered',
                cabinetCount: document.getElementById('scopeCabinetCount')?.value || 'medium',
                cabinetCondition: document.getElementById('scopeCabinetCondition')?.value || 'worn'
            };

            return { scope, checkedAddOns };
        };

        const calculateGuidedEstimate = () => {
            const { scope, checkedAddOns } = collectScopeInputs();
            let range = [0, 0];

            if (leadData.projectType === 'interior') {
                range = addRange(ESTIMATE_RATE_CARD.interiorBase, [
                    ESTIMATE_RATE_CARD.interiorRoom[0] * scope.interiorRooms,
                    ESTIMATE_RATE_CARD.interiorRoom[1] * scope.interiorRooms
                ]);
                range = addRange(range, ESTIMATE_RATE_CARD.interiorCondition[scope.wallCondition]);
                if (scope.includeTrim) range = addRange(range, [
                    ESTIMATE_RATE_CARD.trimPerRoom[0] * scope.interiorRooms,
                    ESTIMATE_RATE_CARD.trimPerRoom[1] * scope.interiorRooms
                ]);
                if (scope.includeCeilings) range = addRange(range, [
                    ESTIMATE_RATE_CARD.ceilingPerRoom[0] * scope.interiorRooms,
                    ESTIMATE_RATE_CARD.ceilingPerRoom[1] * scope.interiorRooms
                ]);
            } else if (leadData.projectType === 'exterior') {
                range = ESTIMATE_RATE_CARD.exteriorSize[scope.exteriorSize];
                range = addRange(range, ESTIMATE_RATE_CARD.storyAdd[scope.exteriorStories]);
                range = addRange(range, ESTIMATE_RATE_CARD.exteriorCondition[scope.exteriorCondition]);
            } else if (leadData.projectType === 'cabinets') {
                range = ESTIMATE_RATE_CARD.cabinetCount[scope.cabinetCount];
                range = addRange(range, ESTIMATE_RATE_CARD.cabinetCondition[scope.cabinetCondition]);
            } else {
                // Defensive fallback: project type is always one of the three
                // painting categories now, but keep a painting base just in case.
                range = ESTIMATE_RATE_CARD.interiorBase;
            }

            checkedAddOns.forEach(addOn => {
                range = addRange(range, ESTIMATE_RATE_CARD.addOns[addOn] || [0, 0]);
            });

            if (leadData.avatarContext === 'sell') {
                range = addRange(range, [350, 950]);
            }

            return {
                low: range[0],
                high: Math.max(range[1], range[0] + 600),
                confidence: checkedAddOns.length || leadData.projectType ? 'planning' : 'needs-more-info',
                scope,
                addOns: checkedAddOns
            };
        };

        const updateEstimatePreview = () => {
            const preview = document.getElementById('estimateRangePreview');
            if (!preview) return;
            if (!leadData.projectType) {
                preview.innerHTML = `
                    <span>Planning range</span>
                    <strong>Choose a service to preview</strong>
                    <small>Not a final quote. Roly confirms scope before pricing.</small>
                `;
                return;
            }
            const estimate = calculateGuidedEstimate();
            preview.innerHTML = `
                <span>Planning range</span>
                <strong>${formatCurrency(estimate.low)} - ${formatCurrency(estimate.high)}</strong>
                <small>Approximate only. Final pricing is confirmed after photos, review, or visit.</small>
            `;
        };

        const syncScopeVisibility = () => {
            formContainer.querySelectorAll('[data-scope-fields]').forEach(group => {
                const scope = group.getAttribute('data-scope-fields');
                group.hidden = scope !== leadData.projectType;
            });
            updateEstimatePreview();
        };

        applyFieldMetadata();
        injectGuidedEstimateFields();

        if (!GHL_FILE_UPLOAD_ENABLED && photoInput && fileLabelText) {
            const uploadGroup = photoInput.closest('.form-group');
            if (uploadGroup) {
                uploadGroup.innerHTML = `
                    <label class="form-label">Project Photos</label>
                    <div class="photo-followup-note">
                        Photos are requested by text after you submit, so Roly can review the right surfaces before confirming the estimate.
                    </div>
                `;
            }
        }

        formContainer.querySelectorAll('#estimateScopePanel input, #estimateScopePanel select').forEach(field => {
            field.addEventListener('change', updateEstimatePreview);
            field.addEventListener('input', updateEstimatePreview);
        });
        syncScopeVisibility();

        // File upload attachment check
        if (photoInput && fileLabelText) {
            photoInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    fileLabelText.textContent = `Attached: ${e.target.files[0].name}`;
                    fileLabelText.style.color = 'var(--color-orange)';
                    leadData.photoAttached = true;
                    leadData.photoStatus = 'attached_pending_file_endpoint';
                } else {
                    fileLabelText.textContent = "Upload project photos (optional)";
                    fileLabelText.style.color = 'var(--text-secondary)';
                    leadData.photoAttached = false;
                    leadData.photoStatus = GHL_FILE_UPLOAD_ENABLED ? 'not_attached' : 'requested_after_submit';
                }
            });
        }

        // Selection event listener for boxes (mouse + keyboard enter/space)
        const optionBoxes = formContainer.querySelectorAll('.option-box');
        
        const selectOption = (box) => {
            const group = box.parentElement;
            group.querySelectorAll('.option-box').forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            
            const val = box.getAttribute('data-value');
            const category = box.getAttribute('data-category');
            
            if (category === 'project-type') {
                leadData.projectType = val;
                clearSlideError(1);
                syncScopeVisibility();
            } else if (category === 'avatar-context') {
                leadData.avatarContext = val;
                clearSlideError(2);
                updateEstimatePreview();
            }
        };

        optionBoxes.forEach(box => {
            // Mouse select
            box.addEventListener('click', () => selectOption(box));
            
            // Keyboard accessibility triggers (Space or Enter)
            box.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    selectOption(box);
                }
            });
        });

        const clearFieldError = (field) => {
            if (!field) return;
            field.removeAttribute('aria-invalid');
            const describedBy = (field.getAttribute('aria-describedby') || '')
                .split(/\s+/)
                .filter(id => id && !id.endsWith('-error'))
                .join(' ');
            if (describedBy) field.setAttribute('aria-describedby', describedBy);
            else field.removeAttribute('aria-describedby');
            const error = document.getElementById(`${field.id}-error`);
            if (error) error.remove();
        };

        const setFieldError = (field, message) => {
            if (!field) return;
            clearFieldError(field);
            field.setAttribute('aria-invalid', 'true');
            const error = document.createElement('p');
            error.className = 'field-error';
            error.id = `${field.id}-error`;
            error.textContent = message;
            field.insertAdjacentElement('afterend', error);
            const describedBy = field.getAttribute('aria-describedby');
            field.setAttribute('aria-describedby', describedBy ? `${describedBy} ${error.id}` : error.id);
        };

        const setSlideError = (step, message) => {
            const slide = slides[step - 1];
            if (!slide) return;
            let error = slide.querySelector('.slide-error');
            if (!error) {
                error = document.createElement('p');
                error.className = 'slide-error';
                const title = slide.querySelector('.form-slide-title');
                if (title) title.insertAdjacentElement('afterend', error);
                else slide.prepend(error);
            }
            error.textContent = message;
        };

        const clearSlideError = (step) => {
            const error = slides[step - 1]?.querySelector('.slide-error');
            if (error) error.remove();
        };

        // Error Feedback - Shake the form wrapper and highlight
        const triggerShakeError = (inputToFocus = null, message = '') => {
            formContainer.classList.remove('shake');
            void formContainer.offsetWidth; // Trigger reflow to restart animation
            formContainer.classList.add('shake');
            
            if (inputToFocus) {
                if (message) setFieldError(inputToFocus, message);
                inputToFocus.focus();
                inputToFocus.style.borderColor = 'var(--color-orange)';
                inputToFocus.addEventListener('input', function removeHighlight() {
                    this.style.borderColor = '';
                    clearFieldError(this);
                    this.removeEventListener('input', removeHighlight);
                });
            }
            
            setTimeout(() => {
                formContainer.classList.remove('shake');
            }, 500);
        };

        const updateProgressBar = (step) => {
            stepNodes.forEach((node, idx) => {
                const nodeStep = idx + 1;
                node.classList.remove('active', 'completed');
                
                if (nodeStep === step) {
                    node.classList.add('active');
                } else if (nodeStep < step) {
                    node.classList.add('completed');
                }
            });
        };

        // Smooth translation-based slide changes. The guard prevents a fast
        // double-click from skipping a step while the previous transition runs.
        let isStepAnimating = false;
        const goToStep = (step) => {
            if (isStepAnimating) return;
            const fromSlide = formContainer.querySelector('.form-slide.active');
            const toSlide = slides[step - 1];
            const dir = step >= currentStep ? 1 : -1;

            // Buttons + progress + step counter. Applied immediately so the
            // tracker responds the instant the user advances.
            const applyChrome = () => {
                const backBtn = formContainer.querySelector('.btn-prev');
                const nextBtn = formContainer.querySelector('.btn-next');

                backBtn.style.visibility = step === 1 ? 'hidden' : 'visible';

                if (step === totalSteps) {
                    nextBtn.innerHTML = `Send My Estimate Request <svg style="width: 18px; height:18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`;
                    nextBtn.style.backgroundColor = 'var(--color-orange)';
                } else {
                    nextBtn.innerHTML = `Next Step <svg style="width:16px; height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>`;
                    nextBtn.style.backgroundColor = 'var(--color-navy)';
                }

                updateProgressBar(step);
                currentStep = step;
            };

            const setSlideClasses = () => {
                slides.forEach(slide => slide.classList.remove('active', 'exit'));
                toSlide.classList.add('active');
            };

            // Preferred path: GSAP slide+fade+blur via the motion.js hook.
            if (window.RolyMotion && typeof window.RolyMotion.animateFormStep === 'function' && fromSlide && fromSlide !== toSlide) {
                isStepAnimating = true;
                applyChrome();
                window.RolyMotion.animateFormStep(fromSlide, toSlide, dir, () => {
                    setSlideClasses();
                    isStepAnimating = false;
                });
            } else if (fromSlide && fromSlide !== toSlide) {
                // Fallback: CSS class-based transition.
                isStepAnimating = true;
                fromSlide.classList.add('exit');
                setTimeout(() => {
                    setSlideClasses();
                    applyChrome();
                    isStepAnimating = false;
                }, 200);
            } else {
                setSlideClasses();
                applyChrome();
            }
        };

        const validateStep = (step) => {
            clearSlideError(step);
            if (step === 1) {
                if (!leadData.projectType) {
                    setSlideError(step, 'Choose the main service so we can guide the estimate.');
                    slides[0]?.querySelector('.option-box')?.focus();
                    triggerShakeError();
                    return false;
                }
            } else if (step === 2) {
                if (!leadData.avatarContext) {
                    setSlideError(step, 'Choose the goal that best matches this project.');
                    slides[1]?.querySelector('.option-box')?.focus();
                    triggerShakeError();
                    return false;
                }
            } else if (step === 3) {
                const zip = document.getElementById('projectZip');
                const address = document.getElementById('projectAddress');
                
                if (!zip.value.trim() || zip.value.trim().length < 5) {
                    triggerShakeError(zip, 'Enter a 5-digit ZIP code.');
                    return false;
                }
                clearFieldError(zip);
                if (!address.value.trim()) {
                    triggerShakeError(address, 'Enter the project street address.');
                    return false;
                }
                clearFieldError(address);
                leadData.zipCode = zip.value.trim();
                leadData.streetAddress = address.value.trim();
            } else if (step === 4) {
                const name = document.getElementById('clientName');
                const phone = document.getElementById('clientPhone');
                const email = document.getElementById('clientEmail');
                
                if (!name.value.trim()) {
                    triggerShakeError(name, 'Enter the name our project manager should ask for.');
                    return false;
                }
                clearFieldError(name);
                if (!phone.value.trim() || phone.value.trim().length < 10) {
                    triggerShakeError(phone, 'Enter a phone number with area code.');
                    return false;
                }
                clearFieldError(phone);
                if (!email.value.trim() || !email.value.includes('@')) {
                    triggerShakeError(email, 'Enter a valid email address.');
                    return false;
                }
                clearFieldError(email);
                
                leadData.fullName = name.value.trim();
                leadData.phoneNumber = phone.value.trim();
                leadData.email = email.value.trim();
                leadData.projectDescription = document.getElementById('projectDesc').value.trim();
                leadData.preferredTime = document.getElementById('preferredSchedule').value;
                const estimate = calculateGuidedEstimate();
                leadData.scopeInputs = estimate.scope;
                leadData.addOns = estimate.addOns;
                leadData.estimateRangeLow = estimate.low;
                leadData.estimateRangeHigh = estimate.high;
                leadData.estimateConfidence = estimate.confidence;
            }
            return true;
        };

        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!validateStep(currentStep)) return;
                
                if (currentStep < totalSteps) {
                    goToStep(currentStep + 1);
                } else {
                    submitLeadForm();
                }
            });
        });

        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep > 1) {
                    goToStep(currentStep - 1);
                }
            });
        });

        const submitLeadForm = () => {
            // Tagging rules mapping
            const ghlTags = ['Lead-Source-Web'];
            if (leadData.projectType === 'interior') ghlTags.push('Painting-Interior');
            if (leadData.projectType === 'exterior') ghlTags.push('Painting-Exterior');
            if (leadData.projectType === 'cabinets') ghlTags.push('Cabinet-Refinishing');
            // Restoration is now a secondary add-on; tag the lead when it's selected.
            if (Array.isArray(leadData.addOns) && leadData.addOns.includes('drywall')) ghlTags.push('Smart-Renovations');
            
            if (leadData.avatarContext === 'sell') ghlTags.push('Preparing-to-Sell');
            if (leadData.avatarContext === 'buy') ghlTags.push('New-Homeowner');
            if (leadData.avatarContext === 'update') ghlTags.push('Current-Home-Improvement');
            if (leadData.avatarContext === 'partner') ghlTags.push('Realtor-Investor-Partner');

            leadData.colorPalette = selectedPalette;
            if (selectedPalette) ghlTags.push('Color-Lab-Palette');

            const payload = {
                ...leadData,
                tags: ghlTags,
                preferredVisitWindow: leadData.preferredTime,
                source: 'website',
                pageUrl: window.location.href,
                submittedAt: new Date().toISOString()
            };

            // Fire-and-forget POST to GoHighLevel. The success card shows
            // regardless of the network result so the visitor is never blocked;
            // a failure is logged for manual follow-up. Until GHL_WEBHOOK_URL
            // is set, the payload is logged so the flow is testable offline.
            if (GHL_WEBHOOK_URL) {
                fetch(GHL_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(err => console.error('GHL webhook POST failed:', err));
            } else {
                console.log('GHL_WEBHOOK_URL not set — lead payload:', payload);
            }

            slidesWrapper.style.opacity = '0.3';
            actionButtonsBar.style.opacity = '0.3';
            
            setTimeout(() => {
                slidesWrapper.style.display = 'none';
                actionButtonsBar.style.display = 'none';
                const existingRange = successCard.querySelector('.success-estimate-range');
                if (existingRange) existingRange.remove();
                const rangeCard = document.createElement('div');
                rangeCard.className = 'success-estimate-range';
                rangeCard.innerHTML = `
                    <span>Your guided planning range</span>
                    <strong>${formatCurrency(leadData.estimateRangeLow)} - ${formatCurrency(leadData.estimateRangeHigh)}</strong>
                    <p>This is a non-binding planning range. Roly confirms the final quote after reviewing photos, access, repairs, materials, and schedule.</p>
                `;
                const successParagraph = successCard.querySelector('p');
                if (successParagraph) successParagraph.insertAdjacentElement('afterend', rangeCard);
                else successCard.appendChild(rangeCard);
                successCard.style.display = 'block';
                
                const tracker = document.getElementById('formStepsTracker');
                if (tracker) tracker.style.display = 'none';
            }, 800);
        };

        // Pre-select options based on the active page
        const pathname = window.location.pathname.toLowerCase();

        // Restoration/repairs are now a secondary add-on rather than a project
        // type, so pages that used to default to "improvements" instead anchor to
        // a painting category and pre-check the restoration add-on.
        const checkRestorationAddOn = () => {
            const restorationAddOn = formContainer.querySelector('#addOnDrywall');
            if (restorationAddOn) {
                restorationAddOn.checked = true;
                updateEstimatePreview();
            }
        };

        if (pathname.includes('painting.html')) {
            const interiorBox = formContainer.querySelector('.option-box[data-value="interior"]');
            if (interiorBox) selectOption(interiorBox);
        } else if (pathname.includes('presale.html')) {
            const interiorBox = formContainer.querySelector('.option-box[data-value="interior"]');
            const sellBox = formContainer.querySelector('.option-box[data-value="sell"]');
            if (interiorBox) selectOption(interiorBox);
            if (sellBox) selectOption(sellBox);
            checkRestorationAddOn();
        } else if (pathname.includes('renovations.html')) {
            const interiorBox = formContainer.querySelector('.option-box[data-value="interior"]');
            const updateBox = formContainer.querySelector('.option-box[data-value="update"]');
            if (interiorBox) selectOption(interiorBox);
            if (updateBox) selectOption(updateBox);
            checkRestorationAddOn();
        } else if (pathname.includes('partners.html')) {
            const interiorBox = formContainer.querySelector('.option-box[data-value="interior"]');
            const partnerBox = formContainer.querySelector('.option-box[data-value="partner"]');
            if (interiorBox) selectOption(interiorBox);
            if (partnerBox) selectOption(partnerBox);
        }

        goToStep(1);
    }

    // Gallery filters: keep the full project library on one page while making
    // painting, cabinets, and support work easy to scan.
    const galleryFilters = document.getElementById('galleryFilters');
    const galleryCards = document.querySelectorAll('#galleryGrid .gallery-card');
    if (galleryFilters && galleryCards.length) {
        galleryFilters.querySelectorAll('.gallery-filter').forEach(button => {
            button.setAttribute('aria-selected', button.classList.contains('is-active') ? 'true' : 'false');
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                galleryFilters.querySelectorAll('.gallery-filter').forEach(btn => {
                    btn.classList.remove('is-active');
                    btn.setAttribute('aria-selected', 'false');
                });
                button.classList.add('is-active');
                button.setAttribute('aria-selected', 'true');

                galleryCards.forEach(card => {
                    const show = filter === 'all' || card.getAttribute('data-category') === filter;
                    card.classList.toggle('is-hidden', !show);
                });
            });
        });
    }

    // ==========================================================================
    // 5. COLOR SCIENCE & PROPERTY PSYCHOLOGY LAB VISUALIZER
    // ==========================================================================
    const colorChips = document.querySelectorAll('.color-chip-btn');
    const labImages = document.querySelectorAll('.lab-image');
    const labCards = document.querySelectorAll('.lab-data-card');
    const dbTitle = document.getElementById('labDashboardTitle');
    const dbRating = document.getElementById('labDashboardRating');

    if (colorChips.length > 0) {
        // Lazily preload the palette images only as the lab section approaches the
        // viewport, so the page-load fetch stays lean (was eager ~3MB on load).
        const imagesToPreload = ['color_navy_cream.webp', 'color_sage_charcoal.webp', 'color_white_bronze.webp'];
        const labSection = document.getElementById('color-science-lab');
        const preloadLabImages = () => {
            imagesToPreload.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        };
        if (labSection && 'IntersectionObserver' in window) {
            const labPreloadObserver = new IntersectionObserver((entries, observer) => {
                if (entries.some(e => e.isIntersecting)) {
                    preloadLabImages();
                    observer.disconnect();
                }
            }, { rootMargin: '800px 0px' });
            labPreloadObserver.observe(labSection);
        } else {
            preloadLabImages();
        }

        const dashboardMetadata = {
            navy: {
                title: 'Classic Navy & Cream',
                rating: '9.4 / 10 Premium Choice'
            },
            sage: {
                title: 'Organic Sage & Charcoal',
                rating: '8.9 / 10 Serene Integration'
            },
            white: {
                title: 'Modern Off-White & Bronze',
                rating: '9.6 / 10 Elite Curb Appeal'
            },
            interactive: {
                title: 'Custom Interactive Lab',
                rating: '9.8 / 10 Create Your Style'
            }
        };

        // Keep the data-card container exactly as tall as the ACTIVE card.
        // Inactive cards are position:absolute (see style.css) so they no longer
        // inflate the box to the tallest (interactive) card; setting an explicit
        // pixel height lets the CSS height-transition animate the grow/shrink so
        // the static palettes stay compact and only the interactive one stretches.
        const cardsGrid = document.querySelector('.lab-data-cards-grid');
        const syncLabCardsHeight = () => {
            if (!cardsGrid) return;
            const activeCard = cardsGrid.querySelector('.lab-data-card.active');
            if (!activeCard) return;
            requestAnimationFrame(() => {
                cardsGrid.style.height = activeCard.offsetHeight + 'px';
            });
        };

        const switchPalette = (targetId) => {
            // Toggle active classes on buttons (tablist A11y compliant)
            colorChips.forEach(btn => {
                const isTarget = btn.getAttribute('data-target') === targetId;
                btn.classList.toggle('active', isTarget);
                btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
            });

            // Toggle active images (cross-fade transition)
            labImages.forEach(img => {
                const imgId = img.id.toLowerCase();
                const isTarget = imgId.includes(targetId);
                img.classList.toggle('active', isTarget);
            });

            // Toggle active information cards
            labCards.forEach(card => {
                const cardId = card.id.toLowerCase();
                const isTarget = cardId.includes(targetId);
                card.classList.toggle('active', isTarget);
            });

            // Update Glassmorphic Image Overlay Dashboard Texts
            if (dbTitle && dbRating && dashboardMetadata[targetId]) {
                dbTitle.textContent = dashboardMetadata[targetId].title;
                dbRating.textContent = dashboardMetadata[targetId].rating;
            }

            // Resize the container to fit the newly active card.
            syncLabCardsHeight();
        };

        // Attach mouse click and keyboard key listeners
        colorChips.forEach(chip => {
            const target = chip.getAttribute('data-target');
            
            chip.addEventListener('click', () => switchPalette(target));

            // Keyboard accessibility (Space or Enter on tab focus)
            chip.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    switchPalette(target);
                }
            });
        });

        // Set the initial height (default state is Navy) and keep it correct as
        // the cards reflow on viewport changes or once web fonts finish loading.
        syncLabCardsHeight();
        window.addEventListener('load', syncLabCardsHeight);
        let labResizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(labResizeTimer);
            labResizeTimer = setTimeout(syncLabCardsHeight, 150);
        });

    }

    // ==========================================================================
    // 5.1. INTERACTIVE HOUSE COLORIZER SWATCH SELECTORS
    // (Standalone: powers the Color Lab customizer tab on the home page and the
    // "Paint Your Own Home" section on the gallery page. The CSS custom
    // properties are the single source of truth; the 2D SVG reacts to the vars
    // and house-3d.js reacts to the 'roly:housecolor' event.)
    // ==========================================================================
    const HOUSE_ZONES = ['siding', 'trim', 'door', 'roof', 'shutters', 'garage'];

    const applyHouseColor = (type, color) => {
        if (!HOUSE_ZONES.includes(type) || !color) return;
        document.documentElement.style.setProperty('--color-house-' + type, color);
        document.dispatchEvent(new CustomEvent('roly:housecolor', { detail: { type, color } }));
    };

    const swatchBtns = document.querySelectorAll('.swatch-btn');
    swatchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.parentElement;
            const type = group.getAttribute('data-type');
            const color = btn.getAttribute('data-color');

            // Update active state in UI
            group.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // A manual pick breaks the preset combination, so clear its highlight.
            // (Preset clicks re-apply their own active state right after.)
            const box = btn.closest('.interactive-control-box');
            if (box) box.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

            applyHouseColor(type, color);
        });
    });

    // ==========================================================================
    // 5.2. DESIGNER PALETTE PRESETS (one click repaints every zone)
    // Each preset carries a data-palette JSON of zone -> hex. We "click" the
    // matching swatch in each group so active states, CSS vars, and the 3D
    // model all update through the exact same path as a manual pick.
    // ==========================================================================
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            let palette;
            try {
                palette = JSON.parse(btn.getAttribute('data-palette'));
            } catch (e) {
                return;
            }

            // Scope to the customizer this preset row belongs to, so the home
            // page and gallery instances stay independent in markup terms.
            const scope = btn.closest('.interactive-control-box') || document;

            Object.keys(palette).forEach(type => {
                const group = scope.querySelector('.swatch-group[data-type="' + type + '"]');
                if (!group) return;
                const target = group.querySelector('.swatch-btn[data-color="' + palette[type] + '"]');
                if (target && !target.classList.contains('active')) target.click();
            });

            const row = btn.closest('.palette-presets');
            if (row) {
                row.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // ==========================================================================
    // 5.3. COLOR PLAN PANEL, ESTIMATE CTA, SHARE LINK & PALETTE CARD DOWNLOAD
    // The active swatch of each group is the single source for names/colors;
    // this section only reads that state and turns it into conversions.
    // ==========================================================================
    const planPanel = document.querySelector('[data-color-plan]');

    if (planPanel) {
        const ZONE_LABELS = {
            siding: 'Siding', trim: 'Trim', door: 'Front Door',
            roof: 'Roof', shutters: 'Shutters', garage: 'Garage'
        };

        const activeSwatch = (type) =>
            document.querySelector('.swatch-group[data-type="' + type + '"] .swatch-btn.active');

        const currentSelections = () => HOUSE_ZONES.map(zone => {
            const btn = activeSwatch(zone);
            return {
                zone,
                label: ZONE_LABELS[zone],
                color: btn ? btn.getAttribute('data-color') : '#888888',
                name: btn ? btn.getAttribute('data-name') : 'Custom',
                lrv: btn && btn.hasAttribute('data-lrv') ? parseInt(btn.getAttribute('data-lrv'), 10) : null
            };
        });

        const paletteSummary = (selections) => (selections || currentSelections())
            .map(s => s.label + ': ' + s.name)
            .join(' · ');

        // Section 5.4 (A/B comparator) plugs into the share / estimate /
        // download flows through these hooks; they stay inert until it wires up.
        let shareExtras = () => '';
        let estimateExtras = () => '';
        let composeCompareCard = null;

        const renderColorPlan = () => {
            const rows = planPanel.querySelector('[data-plan-rows]');
            const verdict = planPanel.querySelector('[data-plan-verdict]');
            const selections = currentSelections();

            if (rows) {
                rows.innerHTML = selections.map(s =>
                    '<div class="color-plan-row">' +
                        '<span class="plan-dot" style="background:' + s.color + ';"></span>' +
                        '<span style="min-width:0;">' +
                            '<span class="plan-zone">' + s.label + '</span>' +
                            '<span class="plan-name">' + s.name + '</span>' +
                        '</span>' +
                    '</div>'
                ).join('');
            }

            const siding = selections[0], trim = selections[1];
            if (verdict && siding.lrv !== null && trim.lrv !== null) {
                const diff = Math.abs(siding.lrv - trim.lrv);
                let note;
                if (diff >= 40) note = 'bold curb appeal';
                else if (diff >= 20) note = 'balanced, classic look';
                else note = 'soft look — consider a lighter trim';
                verdict.innerHTML = 'Siding vs. trim LRV contrast: <strong>' + diff + ' points</strong> — ' + note;
            }
        };

        renderColorPlan();
        document.addEventListener('roly:housecolor', renderColorPlan);

        // --- "Get an Estimate with This Palette": attach the palette to the
        // lead, prefill the visible description, pre-select Exterior Painting.
        // The #get-started anchor itself handles the smooth scroll (Lenis).
        const estimateBtn = planPanel.querySelector('[data-palette-estimate]');
        if (estimateBtn) {
            estimateBtn.addEventListener('click', () => {
                selectedPalette = paletteSummary() + estimateExtras();
                const desc = document.getElementById('projectDesc');
                if (desc) desc.value = 'My exterior palette — ' + selectedPalette;
                if (formContainer) {
                    const exteriorBox = formContainer.querySelector('.option-box[data-value="exterior"]');
                    if (exteriorBox) exteriorBox.click();
                }
            });
        }

        // --- Share link: the palette serialized into the page URL
        const pageAnchor = document.getElementById('paint-your-home') ? '#paint-your-home' : '#color-science-lab';

        const fallbackCopy = (text, done) => {
            const input = document.createElement('input');
            input.value = text;
            input.setAttribute('readonly', '');
            input.style.position = 'absolute';
            input.style.left = '-9999px';
            document.body.appendChild(input);
            input.select();
            try { document.execCommand('copy'); done(); } catch (e) { /* clipboard unavailable */ }
            document.body.removeChild(input);
        };

        const shareBtn = planPanel.querySelector('[data-palette-share]');
        if (shareBtn) {
            const defaultLabel = shareBtn.textContent;
            shareBtn.addEventListener('click', () => {
                const tokens = currentSelections()
                    .map(s => (s.color || '#888888').replace('#', ''))
                    .join('-');
                const url = location.origin + location.pathname + '?palette=' + tokens + shareExtras() + pageAnchor;
                const done = () => {
                    shareBtn.textContent = 'Link Copied!';
                    setTimeout(() => { shareBtn.textContent = defaultLabel; }, 2000);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
                } else {
                    fallbackCopy(url, done);
                }
            });
        }

        // --- Palette card download (button is revealed by house-3d.js once the
        // 3D stage is live; composes a branded PNG with the snapshot + chips).
        const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
            const words = text.split(' ');
            let line = '';
            words.forEach(word => {
                const test = line ? line + ' ' + word : word;
                if (ctx.measureText(test).width > maxWidth && line) {
                    ctx.fillText(line, x, y);
                    line = word;
                    y += lineHeight;
                } else {
                    line = test;
                }
            });
            if (line) ctx.fillText(line, x, y);
        };

        const downloadBtn = planPanel.querySelector('[data-palette-download]');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                // Both slots saved with live snapshots -> branded comparison card
                if (composeCompareCard && composeCompareCard()) return;
                if (!window.RolyHouse3D || typeof window.RolyHouse3D.snapshot !== 'function') return;
                const shot = window.RolyHouse3D.snapshot();
                if (!shot) return;

                const img = new Image();
                img.onload = () => {
                    const W = 1200, H = 980;
                    const canvas = document.createElement('canvas');
                    canvas.width = W;
                    canvas.height = H;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, W, H);

                    ctx.fillStyle = '#0F1E36';
                    ctx.fillRect(0, 0, W, 110);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '800 40px Outfit, Arial, sans-serif';
                    ctx.fillText('My Roly Color Plan', 48, 70);
                    ctx.fillStyle = '#FF6B35';
                    ctx.font = '700 22px Inter, Arial, sans-serif';
                    ctx.fillText('rolyhomeservices.com', W - 48 - ctx.measureText('rolyhomeservices.com').width, 66);

                    const maxW = W - 96, maxH = 500;
                    const scale = Math.min(maxW / img.width, maxH / img.height);
                    const dw = img.width * scale, dh = img.height * scale;
                    ctx.drawImage(img, (W - dw) / 2, 140, dw, dh);

                    const selections = currentSelections();
                    const gap = 16;
                    const chipW = (W - 96 - 5 * gap) / 6;
                    selections.forEach((s, i) => {
                        const x = 48 + i * (chipW + gap);
                        const y = 690;
                        ctx.fillStyle = s.color;
                        ctx.fillRect(x, y, chipW, 84);
                        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                        ctx.strokeRect(x, y, chipW, 84);
                        ctx.fillStyle = '#5A6478';
                        ctx.font = '700 15px Inter, Arial, sans-serif';
                        ctx.fillText(s.label.toUpperCase(), x, y + 112);
                        ctx.fillStyle = '#0F1E36';
                        ctx.font = '700 17px Inter, Arial, sans-serif';
                        wrapText(ctx, s.name, x, y + 140, chipW, 22);
                    });

                    ctx.fillStyle = '#5A6478';
                    ctx.font = '600 20px Inter, Arial, sans-serif';
                    ctx.fillText('Roly Home Services — Your Property Best Friend · 770-769-0008', 48, H - 42);

                    const a = document.createElement('a');
                    a.download = 'roly-color-plan.png';
                    a.href = canvas.toDataURL('image/png');
                    a.click();
                };
                img.src = shot;
            });
        }

        // --- Apply a shared palette from the URL (?palette=hex-hex-hex-hex-hex-hex)
        const paletteParam = new URLSearchParams(location.search).get('palette');
        if (paletteParam) {
            const tokens = paletteParam.split('-');
            const valid = tokens.length === HOUSE_ZONES.length &&
                tokens.every(t => /^[0-9a-fA-F]{6}$/.test(t));
            if (valid) {
                HOUSE_ZONES.forEach((zone, i) => {
                    const hex = '#' + tokens[i].toUpperCase();
                    const group = document.querySelector('.swatch-group[data-type="' + zone + '"]');
                    const matched = group && Array.from(group.querySelectorAll('.swatch-btn')).find(b =>
                        (b.getAttribute('data-color') || '').toUpperCase() === hex);
                    if (matched) {
                        if (!matched.classList.contains('active')) matched.click();
                    } else {
                        // Color outside the current catalog — apply it anyway.
                        applyHouseColor(zone, hex);
                    }
                });

                // Show the right view: the Interactive tab on the home page.
                const interactiveChip = document.getElementById('chipInteractive');
                if (interactiveChip) interactiveChip.click();

                const target = document.querySelector(pageAnchor);
                if (target) {
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
                }
                renderColorPlan();
            }
        }

        // ======================================================================
        // 5.4. A/B PALETTE COMPARATOR — save two favorites, morph between them
        // The same house morphs between palettes (never a second WebGL scene);
        // slots persist for the session and ride along on share links,
        // estimates, and the downloadable card.
        // ======================================================================
        const compareBlock = planPanel.querySelector('[data-palette-compare]');
        if (compareBlock) {
            const STORAGE_KEY = 'roly-palette-compare-v1';
            let savedPalettes = {};
            try {
                savedPalettes = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') || {};
            } catch (e) {
                savedPalettes = {};
            }
            const paletteShots = {}; // slot -> snapshot dataURL, memory only
            let compareOverlay = null;
            let compareOpen = false;
            let applyingSlot = false;

            const saveBtns = {
                a: compareBlock.querySelector('[data-save-slot="a"]'),
                b: compareBlock.querySelector('[data-save-slot="b"]')
            };
            const compareToggle = compareBlock.querySelector('[data-compare-toggle]');

            const persistSlots = () => {
                try {
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedPalettes));
                } catch (e) { /* storage unavailable — slots stay in memory */ }
            };

            const slotSelections = (slot) => {
                const saved = savedPalettes[slot];
                if (!saved) return null;
                return HOUSE_ZONES.map(zone => ({
                    zone,
                    label: ZONE_LABELS[zone],
                    color: saved.zones[zone] ? saved.zones[zone].hex : '#888888',
                    name: saved.zones[zone] ? saved.zones[zone].name : 'Custom'
                }));
            };

            const slotDots = (slot) => {
                const selections = slotSelections(slot);
                if (!selections) return '';
                return '<span class="preset-dots">' + selections.map(s =>
                    '<span style="background:' + s.color + ';"></span>').join('') + '</span>';
            };

            const segmentHTML = (slot) => {
                const shot = paletteShots[slot];
                return (shot
                    ? '<img class="compare-thumb" alt="Option ' + slot.toUpperCase() + ' preview" src="' + shot + '">'
                    : '') +
                    '<span class="compare-seg-name">' + slot.toUpperCase() + '</span>' +
                    slotDots(slot);
            };

            const setViewing = (slot) => {
                if (!compareOverlay) return;
                compareOverlay.querySelectorAll('[data-compare-view]').forEach(btn => {
                    btn.classList.toggle('is-viewing', btn.getAttribute('data-compare-view') === slot);
                });
            };

            const renderCompareUI = () => {
                ['a', 'b'].forEach(slot => {
                    const btn = saveBtns[slot];
                    if (!btn || btn.classList.contains('is-flashing')) return;
                    btn.innerHTML = slotDots(slot) + 'Save as ' + slot.toUpperCase();
                });
                const both = !!(savedPalettes.a && savedPalettes.b);
                if (compareToggle) {
                    compareToggle.disabled = !both;
                    if (both) compareToggle.removeAttribute('title');
                    else compareToggle.setAttribute('title', 'Save a second palette to compare');
                }
                if (compareOverlay) {
                    compareOverlay.querySelectorAll('[data-compare-view]').forEach(btn => {
                        btn.innerHTML = segmentHTML(btn.getAttribute('data-compare-view'));
                    });
                }
            };

            const saveSlot = (slot) => {
                const zones = {};
                currentSelections().forEach(s => { zones[s.zone] = { hex: s.color, name: s.name }; });
                savedPalettes[slot] = { zones: zones, savedAt: new Date().toISOString() };
                persistSlots();
                if (window.RolyHouse3D && typeof window.RolyHouse3D.snapshot === 'function') {
                    const shot = window.RolyHouse3D.snapshot();
                    if (shot) paletteShots[slot] = shot;
                }
                const btn = saveBtns[slot];
                if (btn) {
                    btn.classList.add('is-flashing');
                    btn.textContent = 'Saved ✓';
                    setTimeout(() => {
                        btn.classList.remove('is-flashing');
                        renderCompareUI();
                    }, 1500);
                }
                renderCompareUI();
            };

            // Apply a slot through the preset path (programmatic swatch clicks)
            // so actives, CSS vars, the plan panel, and the 3D morph stay in
            // sync; off-catalog colors fall back to applyHouseColor directly.
            const applySlot = (slot) => {
                const saved = savedPalettes[slot];
                if (!saved) return;
                applyingSlot = true;
                HOUSE_ZONES.forEach(zone => {
                    const entry = saved.zones[zone];
                    if (!entry) return;
                    const group = document.querySelector('.swatch-group[data-type="' + zone + '"]');
                    const match = group && Array.from(group.querySelectorAll('.swatch-btn')).find(b =>
                        (b.getAttribute('data-color') || '').toUpperCase() === entry.hex.toUpperCase());
                    if (match) {
                        if (!match.classList.contains('active')) match.click();
                    } else {
                        applyHouseColor(zone, entry.hex);
                    }
                });
                applyingSlot = false;
                setViewing(slot);
            };

            const closeCompare = () => {
                compareOpen = false;
                if (compareOverlay) compareOverlay.hidden = true;
                if (compareToggle) compareToggle.setAttribute('aria-pressed', 'false');
                setViewing(null);
            };

            const buildOverlay = () => {
                const viewer = document.querySelector('[data-house-3d]');
                if (!viewer) return null;
                const el = document.createElement('div');
                el.className = 'compare-overlay';
                el.innerHTML =
                    '<button type="button" class="compare-seg" data-compare-view="a"></button>' +
                    '<button type="button" class="compare-seg" data-compare-view="b"></button>' +
                    '<button type="button" class="compare-close" aria-label="Exit comparison">&#215;</button>';
                el.querySelectorAll('[data-compare-view]').forEach(btn => {
                    btn.addEventListener('click', () => applySlot(btn.getAttribute('data-compare-view')));
                });
                el.querySelector('.compare-close').addEventListener('click', closeCompare);
                viewer.appendChild(el);
                return el;
            };

            const openCompare = () => {
                if (!(savedPalettes.a && savedPalettes.b)) return;
                compareOverlay = compareOverlay || buildOverlay();
                if (!compareOverlay) return;
                compareOpen = true;
                compareOverlay.hidden = false;
                if (compareToggle) compareToggle.setAttribute('aria-pressed', 'true');
                renderCompareUI();
            };

            ['a', 'b'].forEach(slot => {
                if (saveBtns[slot]) saveBtns[slot].addEventListener('click', () => saveSlot(slot));
            });
            if (compareToggle) {
                compareToggle.addEventListener('click', () => (compareOpen ? closeCompare() : openCompare()));
            }

            // A manual edit while comparing forks into a custom palette: keep
            // the overlay open but drop the "currently viewing" highlight.
            document.addEventListener('roly:housecolor', () => {
                if (compareOpen && !applyingSlot) setViewing(null);
            });

            // --- Share link / estimate / download integration (hooks from 5.3)
            const slotTokens = (slot) => HOUSE_ZONES.map(zone =>
                (savedPalettes[slot].zones[zone] ? savedPalettes[slot].zones[zone].hex : '#888888')
                    .replace('#', '')).join('-');

            shareExtras = () => {
                let extra = '';
                if (savedPalettes.a) extra += '&a=' + slotTokens('a');
                if (savedPalettes.b) extra += '&b=' + slotTokens('b');
                return extra;
            };

            estimateExtras = () => {
                if (!(savedPalettes.a && savedPalettes.b)) return '';
                return ' | Also comparing — Option A: ' + paletteSummary(slotSelections('a')) +
                    ' · Option B: ' + paletteSummary(slotSelections('b'));
            };

            composeCompareCard = () => {
                if (!(paletteShots.a && paletteShots.b && savedPalettes.a && savedPalettes.b)) return false;
                const imgA = new Image();
                const imgB = new Image();
                let loaded = 0;
                const drawCard = () => {
                    if (++loaded < 2) return;
                    const W = 1200, H = 1100;
                    const canvas = document.createElement('canvas');
                    canvas.width = W;
                    canvas.height = H;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, W, H);
                    ctx.fillStyle = '#0F1E36';
                    ctx.fillRect(0, 0, W, 110);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '800 40px Outfit, Arial, sans-serif';
                    ctx.fillText('My Roly Color Plan — A/B', 48, 70);
                    ctx.fillStyle = '#FF6B35';
                    ctx.font = '700 22px Inter, Arial, sans-serif';
                    ctx.fillText('rolyhomeservices.com', W - 48 - ctx.measureText('rolyhomeservices.com').width, 66);

                    const colW = (W - 96 - 48) / 2;
                    [['a', imgA, 48], ['b', imgB, 48 + colW + 48]].forEach(opt => {
                        const slot = opt[0], img = opt[1], x0 = opt[2];
                        ctx.fillStyle = '#0F1E36';
                        ctx.font = '800 28px Outfit, Arial, sans-serif';
                        ctx.fillText('Option ' + slot.toUpperCase(), x0, 168);

                        const maxH = 430;
                        const scale = Math.min(colW / img.width, maxH / img.height);
                        const dw = img.width * scale, dh = img.height * scale;
                        ctx.drawImage(img, x0 + (colW - dw) / 2, 190, dw, dh);

                        const selections = slotSelections(slot);
                        const gap = 10;
                        const chipW = (colW - 5 * gap) / 6;
                        selections.forEach((s, i) => {
                            const x = x0 + i * (chipW + gap);
                            const y = 660;
                            ctx.fillStyle = s.color;
                            ctx.fillRect(x, y, chipW, 64);
                            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                            ctx.strokeRect(x, y, chipW, 64);
                            ctx.fillStyle = '#5A6478';
                            ctx.font = '700 12px Inter, Arial, sans-serif';
                            ctx.fillText(s.label.toUpperCase(), x, y + 86);
                            ctx.fillStyle = '#0F1E36';
                            ctx.font = '700 13px Inter, Arial, sans-serif';
                            wrapText(ctx, s.name, x, y + 106, chipW, 17);
                        });
                    });

                    ctx.fillStyle = '#5A6478';
                    ctx.font = '600 20px Inter, Arial, sans-serif';
                    ctx.fillText('Roly Home Services — Your Property Best Friend · 770-769-0008', 48, H - 42);

                    const a = document.createElement('a');
                    a.download = 'roly-color-plan.png';
                    a.href = canvas.toDataURL('image/png');
                    a.click();
                };
                imgA.onload = drawCard;
                imgB.onload = drawCard;
                imgA.src = paletteShots.a;
                imgB.src = paletteShots.b;
                return true;
            };

            // --- Hydrate slots from a shared URL (?a=...&b=..., same 6-token
            // serialization as ?palette=; malformed params are ignored).
            const hydrateSlotParam = (slot, value) => {
                if (!value) return false;
                const tokens = value.split('-');
                const valid = tokens.length === HOUSE_ZONES.length &&
                    tokens.every(t => /^[0-9a-fA-F]{6}$/.test(t));
                if (!valid) return false;
                const zones = {};
                HOUSE_ZONES.forEach((zone, i) => {
                    const hex = '#' + tokens[i].toUpperCase();
                    const group = document.querySelector('.swatch-group[data-type="' + zone + '"]');
                    const match = group && Array.from(group.querySelectorAll('.swatch-btn')).find(b =>
                        (b.getAttribute('data-color') || '').toUpperCase() === hex);
                    zones[zone] = { hex: hex, name: match ? (match.getAttribute('data-name') || 'Custom') : 'Custom' };
                });
                savedPalettes[slot] = { zones: zones, savedAt: new Date().toISOString() };
                return true;
            };

            const compareParams = new URLSearchParams(location.search);
            const hydratedA = hydrateSlotParam('a', compareParams.get('a'));
            const hydratedB = hydrateSlotParam('b', compareParams.get('b'));
            if (hydratedA || hydratedB) persistSlots();

            renderCompareUI();
        }
    }

    // ==========================================================================
    // 6. SCROLLYTELLING — handled by motion.js (GSAP presentational layer)
    // ==========================================================================

    // ==========================================================================
    // 7. BEFORE / AFTER COMPARISON SLIDERS (gridded drag curtain)
    //    Multi-instance, pointer + keyboard. Drives the --pos CSS var that the
    //    .ba-after clip-path reads. No deps; degrades to a static 50/50 split.
    // ==========================================================================
    document.querySelectorAll('[data-ba-slider]').forEach(slider => {
        const handle = slider.querySelector('.ba-handle');
        if (!handle) return;

        let dragging = false;

        const setPos = (pct) => {
            const clamped = Math.max(0, Math.min(100, pct));
            slider.style.setProperty('--pos', clamped + '%');
            handle.setAttribute('aria-valuenow', Math.round(clamped));
        };

        const posFromX = (clientX) => {
            const rect = slider.getBoundingClientRect();
            return ((clientX - rect.left) / rect.width) * 100;
        };

        handle.addEventListener('pointerdown', (e) => {
            dragging = true;
            handle.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        handle.addEventListener('pointermove', (e) => {
            if (dragging) setPos(posFromX(e.clientX));
        });
        const endDrag = (e) => {
            dragging = false;
            try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
        };
        handle.addEventListener('pointerup', endDrag);
        handle.addEventListener('pointercancel', endDrag);

        // Tap/click anywhere on the track jumps the curtain to that point.
        slider.addEventListener('pointerdown', (e) => {
            if (e.target === handle || handle.contains(e.target)) return;
            setPos(posFromX(e.clientX));
        });

        // Keyboard a11y: arrows nudge by 5%, Home/End snap to the edges.
        handle.addEventListener('keydown', (e) => {
            const cur = parseFloat(slider.style.getPropertyValue('--pos')) || 50;
            let next = null;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = cur - 5;
            else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = cur + 5;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = 100;
            if (next !== null) {
                e.preventDefault();
                setPos(next);
            }
        });

        setPos(50); // start centered
    });
});
