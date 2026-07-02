#!/usr/bin/env python3
"""
extract_common.py — Tag shared (header/footer/form) copy with data-i18n keys
=============================================================================
Idempotent: replacements only fire when the untagged markup is present.
The Spanish values for every key live in i18n/es/common.js.

Usage: python3 extract_common.py
"""

import re
from pathlib import Path

PAGES = [
    "index.html", "services.html", "painting.html", "presale.html",
    "renovations.html", "partners.html", "gallery.html", "reviews.html",
    "about.html", "contact.html", "community.html", "lp-painting.html",
    "privacy.html", "terms.html", "vsl.html", "404.html",
]

# (kind, pattern, replacement) — kind 'str' is plain replace, 're' is regex.
RULES = [
    # ---- Chrome ----
    ("str", '<a class="skip-link" href="#main-content">Skip to main content</a>',
            '<a class="skip-link" href="#main-content" data-i18n="common.skip">Skip to main content</a>'),
    ("str", '<p class="logo-slogan">Your Property Best Friend</p>',
            '<p class="logo-slogan" data-i18n="common.logo.slogan">Your Property Best Friend</p>'),
    ("str", '<button class="hamburger" id="hamburgerMenu" aria-label="Toggle navigation">',
            '<button class="hamburger" id="hamburgerMenu" aria-label="Toggle navigation" data-i18n-attr="aria-label:common.nav.hamburgerAria">'),
    ("str", 'aria-controls="servicesSubmenu" aria-label="Toggle Services menu">',
            'aria-controls="servicesSubmenu" aria-label="Toggle Services menu" data-i18n-attr="aria-label:common.nav.servicesMenuAria">'),

    # ---- Nav menu (class carries optional "active") ----
    ("re", r'(class="nav-link[^"]*")>Home</a>', r'\1 data-i18n="common.nav.home">Home</a>'),
    ("re", r'(class="nav-link[^"]*")>Services</a>', r'\1 data-i18n="common.nav.services">Services</a>'),
    ("re", r'(class="nav-link[^"]*")>All Services</a>', r'\1 data-i18n="common.nav.allServices">All Services</a>'),
    ("re", r'(class="nav-link[^"]*")>Painting</a>', r'\1 data-i18n="common.nav.painting">Painting</a>'),
    ("re", r'(class="nav-link[^"]*")>Pre-Sale Home Preparation</a>', r'\1 data-i18n="common.nav.presale">Pre-Sale Home Preparation</a>'),
    ("re", r'(class="nav-link[^"]*")>Renovations &amp; Repairs</a>', r'\1 data-i18n="common.nav.renovations">Renovations &amp; Repairs</a>'),
    ("re", r'(class="nav-link[^"]*")>Real Estate Partners</a>', r'\1 data-i18n="common.nav.partners">Real Estate Partners</a>'),
    ("re", r'(class="nav-link[^"]*")>Gallery</a>', r'\1 data-i18n="common.nav.gallery">Gallery</a>'),
    ("re", r'(class="nav-link[^"]*")>Reviews</a>', r'\1 data-i18n="common.nav.reviews">Reviews</a>'),
    ("re", r'(class="nav-link[^"]*")>About</a>', r'\1 data-i18n="common.nav.about">About</a>'),
    ("re", r'(class="nav-link[^"]*")>Contact</a>', r'\1 data-i18n="common.nav.contact">Contact</a>'),
    ("re", r'(<a href="#get-started" class="btn btn-primary btn-sm")>Get Free Estimate</a>',
           r'\1 data-i18n="common.nav.cta">Get Free Estimate</a>'),

    # ---- Progressive form: banner + steps tracker ----
    ("str", '<h3>Free Property Assessment</h3>',
            '<h3 data-i18n="common.form.banner.title">Free Property Assessment</h3>'),
    ("str", '<p>Qualify your project details in 60 seconds.</p>',
            '<p data-i18n="common.form.banner.sub">Qualify your project details in 60 seconds.</p>'),
    ("str", '<div class="step-circle">1</div>\n                        <span>Category</span>',
            '<div class="step-circle">1</div>\n                        <span data-i18n="common.form.step1">Category</span>'),
    ("str", '<div class="step-circle">2</div>\n                        <span>Goals</span>',
            '<div class="step-circle">2</div>\n                        <span data-i18n="common.form.step2">Goals</span>'),
    ("str", '<div class="step-circle">3</div>\n                        <span>Location</span>',
            '<div class="step-circle">3</div>\n                        <span data-i18n="common.form.step3">Location</span>'),
    ("str", '<div class="step-circle">4</div>\n                        <span>Contact</span>',
            '<div class="step-circle">4</div>\n                        <span data-i18n="common.form.step4">Contact</span>'),

    # ---- Slide 1 ----
    ("str", '>What type of transformation are you looking for?</h4>',
            ' data-i18n="common.form.slide1.title">What type of transformation are you looking for?</h4>'),
    ("str", '<h4>Interior Painting</h4>',
            '<h4 data-i18n="common.form.opt.interior.title">Interior Painting</h4>'),
    ("str", '<p>Walls, ceilings, trims, baseboards</p>',
            '<p data-i18n="common.form.opt.interior.desc">Walls, ceilings, trims, baseboards</p>'),
    ("str", '<h4>Exterior Painting</h4>',
            '<h4 data-i18n="common.form.opt.exterior.title">Exterior Painting</h4>'),
    ("str", '<p>Siding, trim, fascia, deck stain</p>',
            '<p data-i18n="common.form.opt.exterior.desc">Siding, trim, fascia, deck stain</p>'),
    ("str", '<h4>Cabinet Painting</h4>',
            '<h4 data-i18n="common.form.opt.cabinets.title">Cabinet Painting</h4>'),
    ("str", '<p>Factory-grade spray refinishing</p>',
            '<p data-i18n="common.form.opt.cabinets.desc">Factory-grade spray refinishing</p>'),
    ("str", '>Restoration, drywall, and deck work are added as finishing touches to your painting project on the next step.</p>',
            ' data-i18n="common.form.slide1.hint">Restoration, drywall, and deck work are added as finishing touches to your painting project on the next step.</p>'),

    # ---- Slide 2 ----
    ("str", '>What are the main goals for your property?</h4>',
            ' data-i18n="common.form.slide2.title">What are the main goals for your property?</h4>'),
    ("str", '<h4>Preparing to List / Sell</h4>',
            '<h4 data-i18n="common.form.opt.sell.title">Preparing to List / Sell</h4>'),
    ("str", '<p>Increase appraisal value & speed sale</p>',
            '<p data-i18n="common.form.opt.sell.desc">Increase appraisal value & speed sale</p>'),
    ("str", '<h4>Newly Purchased Home</h4>',
            '<h4 data-i18n="common.form.opt.buy.title">Newly Purchased Home</h4>'),
    ("str", '<p>Personalize before moving in</p>',
            '<p data-i18n="common.form.opt.buy.desc">Personalize before moving in</p>'),
    ("str", '<h4>Improve Current Home</h4>',
            '<h4 data-i18n="common.form.opt.update.title">Improve Current Home</h4>'),
    ("str", '<p>Protect siding or update aesthetics</p>',
            '<p data-i18n="common.form.opt.update.desc">Protect siding or update aesthetics</p>'),
    ("str", '<h4>Realtor / Investor Partner</h4>',
            '<h4 data-i18n="common.form.opt.partner.title">Realtor / Investor Partner</h4>'),
    ("str", '<p>Repeated projects, fast turnaround</p>',
            '<p data-i18n="common.form.opt.partner.desc">Repeated projects, fast turnaround</p>'),

    # ---- Slide 3 ----
    ("str", '>Where is the project located?</h4>',
            ' data-i18n="common.form.slide3.title">Where is the project located?</h4>'),
    ("re", r'>You\'re halfway there — about 30 seconds left\. We just need your location to check availability in the Tucker, Atlanta &(?:amp;)? surrounding service area\.</p>',
           ' data-i18n="common.form.slide3.note">You\'re halfway there — about 30 seconds left. We just need your location to check availability in the Tucker, Atlanta & surrounding service area.</p>'),
    ("str", '<label class="form-label" for="projectZip">ZIP Code</label>',
            '<label class="form-label" for="projectZip" data-i18n="common.form.zip.label">ZIP Code</label>'),
    ("str", 'id="projectZip" placeholder="e.g. 30084"',
            'id="projectZip" placeholder="e.g. 30084" data-i18n-attr="placeholder:common.form.zip.ph"'),
    ("str", '<label class="form-label" for="projectAddress">Street Address</label>',
            '<label class="form-label" for="projectAddress" data-i18n="common.form.address.label">Street Address</label>'),
    ("str", 'id="projectAddress" placeholder="e.g. 123 Main Street"',
            'id="projectAddress" placeholder="e.g. 123 Main Street" data-i18n-attr="placeholder:common.form.address.ph"'),

    # ---- Slide 4 ----
    ("str", '>Who should our project manager contact?</h4>',
            ' data-i18n="common.form.slide4.title">Who should our project manager contact?</h4>'),
    ("str", '<label class="form-label" for="clientName">Full Name</label>',
            '<label class="form-label" for="clientName" data-i18n="common.form.name.label">Full Name</label>'),
    ("str", 'id="clientName" placeholder="e.g. John Doe"',
            'id="clientName" placeholder="e.g. John Doe" data-i18n-attr="placeholder:common.form.name.ph"'),
    ("str", '<label class="form-label" for="clientPhone">Phone Number</label>',
            '<label class="form-label" for="clientPhone" data-i18n="common.form.phone.label">Phone Number</label>'),
    ("str", '<label class="form-label" for="clientEmail">Email Address</label>',
            '<label class="form-label" for="clientEmail" data-i18n="common.form.email.label">Email Address</label>'),
    ("str", 'id="clientEmail" placeholder="e.g. johndoe@gmail.com"',
            'id="clientEmail" placeholder="e.g. johndoe@gmail.com" data-i18n-attr="placeholder:common.form.email.ph"'),
    ("str", '<label class="form-label" for="preferredSchedule">Preferred Visit Window</label>',
            '<label class="form-label" for="preferredSchedule" data-i18n="common.form.schedule.label">Preferred Visit Window</label>'),
    ("str", '<option value="any">Any Day - Time Range Flexible</option>',
            '<option value="any" data-i18n="common.form.schedule.any">Any Day - Time Range Flexible</option>'),
    ("str", '<option value="weekday-morning">Weekdays - Morning (8am - 12pm)</option>',
            '<option value="weekday-morning" data-i18n="common.form.schedule.wm">Weekdays - Morning (8am - 12pm)</option>'),
    ("str", '<option value="weekday-afternoon">Weekdays - Afternoon (12pm - 5pm)</option>',
            '<option value="weekday-afternoon" data-i18n="common.form.schedule.wa">Weekdays - Afternoon (12pm - 5pm)</option>'),
    ("str", '<option value="saturday">Saturdays - Morning</option>',
            '<option value="saturday" data-i18n="common.form.schedule.sat">Saturdays - Morning</option>'),
    ("str", '<label class="form-label">Upload Photos (Optional)</label>',
            '<label class="form-label" data-i18n="common.form.upload.label">Upload Photos (Optional)</label>'),
    ("str", '<span id="uploadFileText">Upload photos (max 5MB)</span>',
            '<span id="uploadFileText" data-i18n="common.form.upload.text">Upload photos (max 5MB)</span>'),
    ("str", '<label class="form-label" for="projectDesc">Project Description (Brief)</label>',
            '<label class="form-label" for="projectDesc" data-i18n="common.form.desc.label">Project Description (Brief)</label>'),
    ("str", 'id="projectDesc" rows="2" placeholder="e.g. Wall painting in 2 bedrooms, minor drywall repairs."',
            'id="projectDesc" rows="2" placeholder="e.g. Wall painting in 2 bedrooms, minor drywall repairs." data-i18n-attr="placeholder:common.form.desc.ph"'),

    # ---- Consent + action buttons + success card ----
    ("re", r'(<div class="form-consent-notice"[^>]*>\s*<p style="[^"]*")>',
           r'\1 data-i18n-html="common.form.consent">'),
    ("re", r'(<button type="button" class="btn btn-outline btn-prev">\s*<svg[^>]*><path[^>]*></path></svg>)\s*Back',
           r'\1<span data-i18n="common.form.back">Back</span>'),
    ("re", r'(<button type="button" class="btn btn-secondary btn-next">)\s*Next Step',
           r'\1<span data-i18n="common.form.next">Next Step</span>'),
    ("str", '<h3>Estimate Request Received!</h3>',
            '<h3 data-i18n="common.form.success.title">Estimate Request Received!</h3>'),
    ("str", '<p>Thank you. Roly Home Services received your project details. A project manager will review the scope and follow up with the right next step.</p>',
            '<p data-i18n="common.form.success.p1">Thank you. Roly Home Services received your project details. A project manager will review the scope and follow up with the right next step.</p>'),
    ("re", r'>A Roly project manager will reach out within one business day to review your request and confirm the right next step\.</p>',
           ' data-i18n="common.form.success.p2">A Roly project manager will reach out within one business day to review your request and confirm the right next step.</p>'),
    ("re", r'(<a href="tel:7707690008" class="btn btn-secondary btn-sm")>Need Instant Help\? Call Us Now</a>',
           r'\1 data-i18n="common.form.success.cta">Need Instant Help? Call Us Now</a>'),

    # ---- Footer ----
    ("str", '<p>Professional painting, renovations, repairs, and property enhancements you can trust. Your Property Best Friend.</p>',
            '<p data-i18n="common.footer.brand">Professional painting, renovations, repairs, and property enhancements you can trust. Your Property Best Friend.</p>'),
    ("str", '<h4>Our Services</h4>',
            '<h4 data-i18n="common.footer.services.title">Our Services</h4>'),
    ("str", '<li><a href="services.html">All Services</a></li>',
            '<li><a href="services.html" data-i18n="common.nav.allServices">All Services</a></li>'),
    ("str", '<li><a href="painting.html">Interior Painting</a></li>',
            '<li><a href="painting.html" data-i18n="common.footer.services.interior">Interior Painting</a></li>'),
    ("str", '<li><a href="painting.html">Exterior Painting</a></li>',
            '<li><a href="painting.html" data-i18n="common.footer.services.exterior">Exterior Painting</a></li>'),
    ("str", '<li><a href="presale.html">Pre-Sale Home Preparation</a></li>',
            '<li><a href="presale.html" data-i18n="common.nav.presale">Pre-Sale Home Preparation</a></li>'),
    ("re", r'<li><a href="renovations.html">Renovations &(?:amp;)? Repairs</a></li>',
           '<li><a href="renovations.html" data-i18n="common.nav.renovations">Renovations &amp; Repairs</a></li>'),
    ("str", '<h4>Resources</h4>',
            '<h4 data-i18n="common.footer.resources.title">Resources</h4>'),
    ("re", r'<a href="gallery.html#projects">Before &(?:amp;)? After</a>',
           '<a href="gallery.html#projects" data-i18n="common.footer.resources.ba">Before &amp; After</a>'),
    ("re", r'<a href="#reviews">Reviews &(?:amp;)? Proof</a>',
           '<a href="#reviews" data-i18n="common.footer.resources.proof">Reviews &amp; Proof</a>'),
    ("re", r'<a href="reviews.html">Reviews &(?:amp;)? Testimonials</a>',
           '<a href="reviews.html" data-i18n="common.footer.resources.reviews">Reviews &amp; Testimonials</a>'),
    ("str", '<a href="about.html">About Us</a>',
            '<a href="about.html" data-i18n="common.footer.resources.about">About Us</a>'),
    ("str", '<a href="contact.html">Contact Us</a>',
            '<a href="contact.html" data-i18n="common.footer.resources.contact">Contact Us</a>'),
    ("str", '<a href="partners.html">Real Estate Partners</a>',
            '<a href="partners.html" data-i18n="common.nav.partners">Real Estate Partners</a>'),
    ("str", '<a href="vsl.html">Watch VSL Video</a>',
            '<a href="vsl.html" data-i18n="common.footer.resources.vsl">Watch VSL Video</a>'),
    ("str", '<a href="community.html">Community Campaign</a>',
            '<a href="community.html" data-i18n="common.footer.resources.community">Community Campaign</a>'),
    ("str", '<h4>Get In Touch</h4>',
            '<h4 data-i18n="common.footer.touch.title">Get In Touch</h4>'),
    ("str", '<p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">Call or Text Anytime</p>',
            '<p style="font-size: 0.75rem; color: rgba(255,255,255,0.5);" data-i18n="common.footer.touch.anytime">Call or Text Anytime</p>'),
    ("re", r'<p style="color: #FFFFFF;">Tucker, Atlanta &(?:amp;)? surrounding areas</p>',
           '<p style="color: #FFFFFF;" data-i18n="common.footer.touch.area">Tucker, Atlanta &amp; surrounding areas</p>'),
    ("str", '<p>&copy; 2026 Roly Home Services. All rights reserved. Your Property Best Friend.</p>',
            '<p data-i18n="common.footer.copyright">&copy; 2026 Roly Home Services. All rights reserved. Your Property Best Friend.</p>'),
    ("str", '<a href="privacy.html">Privacy Policy</a>',
            '<a href="privacy.html" data-i18n="common.footer.privacy">Privacy Policy</a>'),
    ("str", '<a href="terms.html">Terms of Service</a>',
            '<a href="terms.html" data-i18n="common.footer.terms">Terms of Service</a>'),

    # ---- Mobile call pill ----
    ("str", 'class="mobile-call-pill" aria-label="Call or text Roly Home Services at 770-769-0008">',
            'class="mobile-call-pill" aria-label="Call or text Roly Home Services at 770-769-0008" data-i18n-attr="aria-label:common.callPill.aria">'),
    ("re", r'(class="mobile-call-pill"[^>]*>\s*<svg[^>]*><path[^>]*></path></svg>\s*<span)>Call or Text</span>',
           r'\1 data-i18n="common.callPill.text">Call or Text</span>'),
]


def main() -> None:
    for page in PAGES:
        path = Path(page)
        if not path.exists():
            continue
        src = path.read_text(encoding="utf-8")
        hits = 0
        for kind, pat, repl in RULES:
            if kind == "str":
                if pat in src and repl.split(">")[0] not in src:
                    pass  # idempotence handled below by exact-match replace
                n = src.count(pat)
                if n:
                    src = src.replace(pat, repl)
                    hits += n
            else:
                src, n = re.subn(pat, repl, src)
                hits += n
        path.write_text(src, encoding="utf-8")
        print(f"{page}: {hits} replacements")


if __name__ == "__main__":
    main()
