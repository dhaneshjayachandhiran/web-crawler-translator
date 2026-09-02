/**
 * Website Localization Publishing Snippet
 * A vanilla JavaScript file for runtime localization injection
 */

(function() {
    'use strict';

    // Language code to human-readable name mapping
    var LANGUAGE_NAMES = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'zh-CN': 'Chinese (Simplified)',
        'zh-TW': 'Chinese (Traditional)',
        'ru': 'Russian',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'pl': 'Polish',
        'tr': 'Turkish',
        'el': 'Greek',
        'he': 'Hebrew'
    };

    // Current language state
    var currentLang = 'en';
    var translations = {};
    var originalTexts = {};

    /**
     * Get human-readable language name
     */
    function getLanguageName(langCode) {
        return LANGUAGE_NAMES[langCode] || langCode;
    }

    /**
     * Detect browser language
     */
    function detectBrowserLanguage() {
        var navLang = navigator.language || navigator.userLanguage;
        var langCode = navLang.split('-')[0];
        return langCode in LANGUAGE_NAMES ? langCode : 'en';
    }

    /**
     * Load translations from CDN
     */
    function loadTranslations(langCode, callback) {
        var script = document.createElement('script');
        script.src = '/cdn/translations/' + encodeURIComponent(langCode) + '.json';
        script.onload = function() {
            if (typeof window !== 'undefined' && window.locTranslations) {
                translations = window.locTranslations;
                if (callback) callback();
            } else {
                // Fallback: try to load from embedded data
                if (callback) callback();
            }
        };
        script.onerror = function() {
            console.warn('Failed to load translations for: ' + langCode);
            if (callback) callback();
        };
        document.head.appendChild(script);
    }

    /**
     * Find and replace text in the DOM
     */
    function applyTranslations(langCode) {
        if (!translations[langCode]) {
            console.warn('No translations found for: ' + langCode);
            return;
        }

        var langTranslations = translations[langCode];

        // Replace text content for elements with data-loc-key
        var elements = document.querySelectorAll('[data-loc-key]');
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var key = el.getAttribute('data-loc-key');
            if (langTranslations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = langTranslations[key];
                } else {
                    el.textContent = langTranslations[key];
                }
            }
        }

        // Replace href attributes for links
        var links = document.querySelectorAll('[data-loc-href]');
        for (var j = 0; j < links.length; j++) {
            var link = links[j];
            var key = link.getAttribute('data-loc-href');
            if (langTranslations[key]) {
                link.href = langTranslations[key];
            }
        }
    }

    /**
     * Create the floating language switcher widget
     */
    function createLanguageSwitcher() {
        var widget = document.createElement('div');
        widget.id = 'loc-switcher';
        widget.style.cssText = [
            'position: fixed',
            'bottom: 20px',
            'right: 20px',
            'z-index: 10000',
            'background: rgba(255, 255, 255, 0.95)',
            'border: 1px solid #ddd',
            'border-radius: 8px',
            'box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1)',
            'padding: 8px',
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'cursor: pointer',
            'transition: all 0.2s ease'
        ].join('; ');

        var currentBtn = document.createElement('button');
        currentBtn.id = 'loc-current-lang';
        currentBtn.style.cssText = [
            'background: none',
            'border: none',
            'padding: 8px 12px',
            'font-size: 14px',
            'font-weight: 500',
            'color: #333',
            'cursor: pointer',
            'border-radius: 4px',
            'display: flex',
            'align-items: center',
            'gap: 4px'
        ].join('; ');

        currentBtn.innerHTML = '<span id="loc-current-name">' + getLanguageName(currentLang) + '</span> ▼';

        var dropdown = document.createElement('div');
        dropdown.id = 'loc-dropdown';
        dropdown.style.cssText = [
            'position: absolute',
            'bottom: 100%',
            'right: 0',
            'margin-bottom: 8px',
            'background: #fff',
            'border: 1px solid #ddd',
            'border-radius: 8px',
            'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)',
            'padding: 8px 0',
            'display: none',
            'min-width: 140px',
            'z-index: 10001'
        ].join('; ');

        // Add language options
        var availableLangs = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
        for (var k = 0; k < availableLangs.length; k++) {
            var lang = availableLangs[k];
            var btn = document.createElement('button');
            btn.style.cssText = [
                'width: 100%',
                'padding: 8px 12px',
                'background: none',
                'border: none',
                'text-align: left',
                'font-size: 13px',
                'color: #333',
                'cursor: pointer',
                'border-radius: 4px',
                'transition: background 0.15s'
            ].join('; ');
            btn.style.cssText += ';';
            btn.setAttribute('data-lang', lang);
            btn.textContent = getLanguageName(lang);

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var selectedLang = this.getAttribute('data-lang');
                switchLanguage(selectedLang);
            });

            btn.addEventListener('mouseenter', function() {
                this.style.background = '#f5f5f5';
            });

            btn.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });

            dropdown.appendChild(btn);
        }

        currentBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });

        widget.appendChild(currentBtn);
        widget.appendChild(dropdown);

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!widget.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        document.body.appendChild(widget);
    }

    /**
     * Switch language
     */
    function switchLanguage(langCode) {
        if (currentLang === langCode) return;

        currentLang = langCode;
        document.getElementById('loc-current-name').textContent = getLanguageName(langCode);

        // Apply translations
        applyTranslations(langCode);

        // Dispatch event for other scripts to listen to
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('loc:languageChanged', {
                detail: { language: langCode }
            }));
        }
    }

    /**
     * Initialize the localization system
     */
    function init() {
        // Detect browser language
        var browserLang = detectBrowserLanguage();

        // Load translations
        loadTranslations(browserLang, function() {
            // Apply initial translations
            applyTranslations(browserLang);

            // Create the language switcher widget
            createLanguageSwitcher();
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API globally
    window.loc = {
        switchLanguage: switchLanguage,
        getCurrentLanguage: function() { return currentLang; },
        getLanguageName: getLanguageName,
        applyTranslations: applyTranslations
    };

})();