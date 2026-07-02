/* ==========================================================================
   i18n.js — Roly Home Services language + theme runtime
   --------------------------------------------------------------------------
   English lives inline in the HTML (source of truth). Spanish ships as
   per-page dictionaries (i18n/es/*.js) that populate window.__I18N before
   this file runs. Switching back to English restores the original DOM
   content captured on the first Spanish pass.

   Persisted keys: roly-lang ('en'|'es'), roly-theme ('light'|'dark').
   The anti-FOUC <head> snippet on every page reads the same keys.
   ========================================================================== */
(function () {
    'use strict';

    var LANG_KEY = 'roly-lang';
    var THEME_KEY = 'roly-theme';
    var THEME_COLORS = { light: '#FBFAF7', dark: '#0B1526' };

    /* element -> { text, html, attrs } English snapshot, captured lazily */
    var originals = new WeakMap();

    function safeGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function safeSet(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
    }

    function parseAttrMap(spec) {
        /* "placeholder:key1;aria-label:key2" -> [['placeholder','key1'], ...] */
        var pairs = [];
        spec.split(';').forEach(function (chunk) {
            var idx = chunk.indexOf(':');
            if (idx > 0) {
                pairs.push([chunk.slice(0, idx).trim(), chunk.slice(idx + 1).trim()]);
            }
        });
        return pairs;
    }

    function snapshot(el) {
        var snap = { attrs: {} };
        if (el.hasAttribute('data-i18n')) snap.text = el.textContent;
        if (el.hasAttribute('data-i18n-html')) snap.html = el.innerHTML;
        var attrSpec = el.getAttribute('data-i18n-attr');
        if (attrSpec) {
            parseAttrMap(attrSpec).forEach(function (pair) {
                snap.attrs[pair[0]] = el.getAttribute(pair[0]);
            });
        }
        return snap;
    }

    function restore(el, snap) {
        if (snap.text !== undefined) el.textContent = snap.text;
        if (snap.html !== undefined) el.innerHTML = snap.html;
        Object.keys(snap.attrs).forEach(function (name) {
            if (snap.attrs[name] === null) el.removeAttribute(name);
            else el.setAttribute(name, snap.attrs[name]);
        });
    }

    function applyLanguage(lang) {
        var dict = window.__I18N || {};
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]').forEach(function (el) {
            if (!originals.has(el)) originals.set(el, snapshot(el));
            if (lang === 'en') { restore(el, originals.get(el)); return; }

            var key = el.getAttribute('data-i18n');
            if (key && dict[key] != null) el.textContent = dict[key];

            var htmlKey = el.getAttribute('data-i18n-html');
            if (htmlKey && dict[htmlKey] != null) el.innerHTML = dict[htmlKey];

            var attrSpec = el.getAttribute('data-i18n-attr');
            if (attrSpec) {
                parseAttrMap(attrSpec).forEach(function (pair) {
                    if (dict[pair[1]] != null) el.setAttribute(pair[0], dict[pair[1]]);
                });
            }
        });

        safeSet(LANG_KEY, lang);

        document.querySelectorAll('.lang-toggle').forEach(function (btn) {
            btn.setAttribute('aria-pressed', lang === 'es' ? 'true' : 'false');
            var label = btn.querySelector('.lang-toggle-label');
            /* Label shows the language you would switch TO */
            if (label) label.textContent = lang === 'es' ? 'EN' : 'ES';
        });

        document.dispatchEvent(new CustomEvent('roly:langchange', { detail: { lang: lang } }));
    }

    function currentLang() {
        return safeGet(LANG_KEY) === 'es' ? 'es' : 'en';
    }

    function applyTheme(theme, persist) {
        document.documentElement.setAttribute('data-theme', theme);
        if (persist) safeSet(THEME_KEY, theme);
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        });
        /* Keep the browser chrome color in sync with the manual override */
        document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
            meta.setAttribute('content', THEME_COLORS[theme]);
            meta.removeAttribute('media');
        });
    }

    window.rolyI18n = {
        apply: applyLanguage,
        lang: currentLang,
        t: function (key, fallback) {
            if (currentLang() === 'es' && window.__I18N && window.__I18N[key] != null) {
                return window.__I18N[key];
            }
            return fallback;
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        if (currentLang() === 'es') applyLanguage('es');

        document.querySelectorAll('.lang-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                applyLanguage(currentLang() === 'es' ? 'en' : 'es');
            });
        });

        var initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            btn.setAttribute('aria-pressed', initialTheme === 'dark' ? 'true' : 'false');
            btn.addEventListener('click', function () {
                var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                applyTheme(next, true);
            });
        });
    });
})();
