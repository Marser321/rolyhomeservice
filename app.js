document.addEventListener('DOMContentLoaded', () => {
    
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
        };

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            renderMenuIcon(navMenu.classList.contains('active'));
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
    // 2. INTERACTIVE BEFORE & AFTER SLIDER
    // ==========================================================================
    const slider = document.getElementById('beforeAfterSlider');
    const afterImage = document.querySelector('.ba-after');
    const handle = document.querySelector('.ba-handle');

    if (slider && afterImage && handle) {
        let isDragging = false;

        const setSliderPosition = (x) => {
            const rect = slider.getBoundingClientRect();
            let position = ((x - rect.left) / rect.width) * 100;
            if (position < 0) position = 0;
            if (position > 100) position = 100;

            afterImage.style.width = `${position}%`;
            handle.style.left = `${position}%`;
        };

        const onStart = (e) => {
            isDragging = true;
            e.preventDefault();
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            setSliderPosition(x);
        };

        const onEnd = () => {
            isDragging = false;
        };

        // Mouse Events
        handle.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        // Touch Events
        handle.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);

        slider.addEventListener('click', (e) => {
            if (e.target !== handle && !handle.contains(e.target)) {
                setSliderPosition(e.clientX);
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
            photoAttached: false
        };

        // File upload attachment check
        if (photoInput && fileLabelText) {
            photoInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    fileLabelText.textContent = `Attached: ${e.target.files[0].name}`;
                    fileLabelText.style.color = 'var(--color-orange)';
                    leadData.photoAttached = true;
                } else {
                    fileLabelText.textContent = "Upload project photos (optional)";
                    fileLabelText.style.color = 'var(--text-secondary)';
                    leadData.photoAttached = false;
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
            } else if (category === 'avatar-context') {
                leadData.avatarContext = val;
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

        // Error Feedback - Shake the form wrapper and highlight
        const triggerShakeError = (inputToFocus = null) => {
            formContainer.classList.remove('shake');
            void formContainer.offsetWidth; // Trigger reflow to restart animation
            formContainer.classList.add('shake');
            
            if (inputToFocus) {
                inputToFocus.focus();
                inputToFocus.style.borderColor = 'var(--color-orange)';
                inputToFocus.addEventListener('input', function removeHighlight() {
                    this.style.borderColor = '';
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
                    nextBtn.innerHTML = `Secure My Free Estimate <svg style="width: 18px; height:18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`;
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
            if (step === 1) {
                if (!leadData.projectType) {
                    triggerShakeError();
                    return false;
                }
            } else if (step === 2) {
                if (!leadData.avatarContext) {
                    triggerShakeError();
                    return false;
                }
            } else if (step === 3) {
                const zip = document.getElementById('projectZip');
                const address = document.getElementById('projectAddress');
                
                if (!zip.value.trim() || zip.value.trim().length < 5) {
                    triggerShakeError(zip);
                    return false;
                }
                if (!address.value.trim()) {
                    triggerShakeError(address);
                    return false;
                }
                leadData.zipCode = zip.value.trim();
                leadData.streetAddress = address.value.trim();
            } else if (step === 4) {
                const name = document.getElementById('clientName');
                const phone = document.getElementById('clientPhone');
                const email = document.getElementById('clientEmail');
                
                if (!name.value.trim()) {
                    triggerShakeError(name);
                    return false;
                }
                if (!phone.value.trim() || phone.value.trim().length < 10) {
                    triggerShakeError(phone);
                    return false;
                }
                if (!email.value.trim() || !email.value.includes('@')) {
                    triggerShakeError(email);
                    return false;
                }
                
                leadData.fullName = name.value.trim();
                leadData.phoneNumber = phone.value.trim();
                leadData.email = email.value.trim();
                leadData.projectDescription = document.getElementById('projectDesc').value.trim();
                leadData.preferredTime = document.getElementById('preferredSchedule').value;
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
            if (leadData.projectType === 'improvements') ghlTags.push('Smart-Renovations');
            
            if (leadData.avatarContext === 'sell') ghlTags.push('Preparing-to-Sell');
            if (leadData.avatarContext === 'buy') ghlTags.push('New-Homeowner');
            if (leadData.avatarContext === 'update') ghlTags.push('Current-Home-Improvement');
            if (leadData.avatarContext === 'partner') ghlTags.push('Realtor-Investor-Partner');

            console.log("Sending GHL progressive webhook payload:", leadData);
            console.log("Resulting tags computed:", ghlTags);

            slidesWrapper.style.opacity = '0.3';
            actionButtonsBar.style.opacity = '0.3';
            
            setTimeout(() => {
                slidesWrapper.style.display = 'none';
                actionButtonsBar.style.display = 'none';
                successCard.style.display = 'block';
                
                const tracker = document.getElementById('formStepsTracker');
                if (tracker) tracker.style.display = 'none';
            }, 800);
        };

        // Pre-select options based on the active page
        const pathname = window.location.pathname.toLowerCase();
        
        if (pathname.includes('painting.html')) {
            const interiorBox = formContainer.querySelector('.option-box[data-value="interior"]');
            if (interiorBox) selectOption(interiorBox);
        } else if (pathname.includes('presale.html')) {
            const improvementsBox = formContainer.querySelector('.option-box[data-value="improvements"]');
            const sellBox = formContainer.querySelector('.option-box[data-value="sell"]');
            if (improvementsBox) selectOption(improvementsBox);
            if (sellBox) selectOption(sellBox);
        } else if (pathname.includes('renovations.html')) {
            const improvementsBox = formContainer.querySelector('.option-box[data-value="improvements"]');
            const updateBox = formContainer.querySelector('.option-box[data-value="update"]');
            if (improvementsBox) selectOption(improvementsBox);
            if (updateBox) selectOption(updateBox);
        } else if (pathname.includes('partners.html')) {
            const improvementsBox = formContainer.querySelector('.option-box[data-value="improvements"]');
            const partnerBox = formContainer.querySelector('.option-box[data-value="partner"]');
            if (improvementsBox) selectOption(improvementsBox);
            if (partnerBox) selectOption(partnerBox);
        }

        goToStep(1);
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

        // ==========================================================================
        // 5.1. INTERACTIVE COLORIZER SWATCH SELECTORS
        // ==========================================================================
        const swatchBtns = document.querySelectorAll('.swatch-btn');
        swatchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.parentElement;
                const type = group.getAttribute('data-type');
                const color = btn.getAttribute('data-color');
                
                // Update active state in UI
                group.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply custom properties to document root (so SVG colors update instantly)
                if (type === 'siding') {
                    document.documentElement.style.setProperty('--color-house-siding', color);
                } else if (type === 'trim') {
                    document.documentElement.style.setProperty('--color-house-trim', color);
                } else if (type === 'door') {
                    document.documentElement.style.setProperty('--color-house-door', color);
                }
            });
        });
    }

    // ==========================================================================
    // 6. SCROLLYTELLING — handled by motion.js (GSAP presentational layer)
    // ==========================================================================
});
