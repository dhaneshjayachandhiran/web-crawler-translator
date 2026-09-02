/**
 * loc.js - Website Localization Publishing Snippet
 * Vanilla JavaScript, no dependencies.
 *
 * Usage: <script src="http://localhost:8000/cdn/loc.js?project_id=1"></script>
 *
 * Features:
 * - DOM matching via [data-loc-key] attributes (with text content fallback)
 * - Floating language switcher widget (human-readable names)
 * - Auto-detects browser language
 * - Persists language preference in localStorage
 */

(function() {
  "use strict";

  // __INJECT_TRANSLATIONS__

  // ============================================
  // Language name mapping (human-readable)
  // ============================================
  var LANG_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ru": "Russian",
    "ar": "Arabic",
  };

  // Reverse mapping: "Spanish" -> "es"
  var NAME_TO_CODE = {};
  for (var code in LANG_NAMES) {
    NAME_TO_CODE[LANG_NAMES[code].toLowerCase()] = code;
  }

  // ============================================
  // State
  // ============================================
  var currentLang = detectBrowserLang();
  var originalTexts = {}; // Cache for restoring original text
  var STORAGE_KEY = "loc_pref_lang";

  // Load saved preference
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANG_NAMES[saved]) {
      currentLang = saved;
    }
  } catch (e) { /* localStorage unavailable */ }

  // ============================================
  // Translation source
  // ============================================
  function getTranslations(lang) {
    if (typeof window.LOC_TRANSLATIONS !== "undefined") {
      return window.LOC_TRANSLATIONS;
    }
    return {};
  }

  function detectBrowserLang() {
    var navLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    var short = navLang.split("-")[0];
    if (LANG_NAMES[short]) return short;
    return "en";
  }

  // ============================================
  // Hash function (matches backend SHA256 logic)
  // ============================================
  function hashText(text) {
    // Simple non-cryptographic hash for client-side lookup
    // Backend uses SHA256 but we just need consistent matching
    var hash = 0;
    for (var i = 0; i < text.length; i++) {
      var char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Use a deterministic hex representation
    return ("0000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  // ============================================
  // DOM Matching Strategy
  // ============================================
  function findTranslatableElements() {
    var elements = [];

    // Strategy 1: Elements with [data-loc-key] attribute
    var keyed = document.querySelectorAll("[data-loc-key]");
    for (var i = 0; i < keyed.length; i++) {
      elements.push({
        el: keyed[i],
        key: keyed[i].getAttribute("data-loc-key"),
        sourceText: (keyed[i].textContent || "").trim(),
        mode: "attribute",
      });
    }

    // Strategy 2: Common translatable elements (p, h1-h6, span, button, a, li, etc.)
    if (elements.length === 0) {
      var tags = "p,h1,h2,h3,h4,h5,h6,span,button,a,li,td,th,label,blockquote";
      var candidates = document.querySelectorAll(tags);
      for (var j = 0; j < candidates.length; j++) {
        var text = (candidates[j].textContent || "").trim();
        if (text.length > 1 && text.length < 1000) {
          // Skip if inside script/style
          if (candidates[j].closest("script, style, noscript")) continue;
          elements.push({
            el: candidates[j],
            key: hashText(text),
            sourceText: text,
            mode: "text-fallback",
          });
        }
      }
    }

    return elements;
  }

  // ============================================
  // Apply Translations
  // ============================================
  function applyTranslations(lang) {
    var translations = getTranslations(lang);
    var elements = findTranslatableElements();

    for (var i = 0; i < elements.length; i++) {
      var item = elements[i];
      var translated = translations[item.key] || translations[item.sourceText];

      if (translated) {
        // Cache original text for restoration
        if (!originalTexts[item.el]) {
          originalTexts[item.el] = item.el.textContent;
        }
        item.el.textContent = translated;
        item.el.setAttribute("data-loc-translated", "true");
      } else if (originalTexts[item.el]) {
        // Restore original
        item.el.textContent = originalTexts[item.el];
        item.el.removeAttribute("data-loc-translated");
      }
    }
  }

  // ============================================
  // Language Switcher Widget (Floating)
  // ============================================
  function createSwitcher() {
    // Container
    var container = document.createElement("div");
    container.id = "loc-switcher";
    container.setAttribute("data-loc-widget", "switcher");
    container.style.cssText = [
      "position: fixed",
      "bottom: 20px",
      "right: 20px",
      "z-index: 999999",
      "background: #ffffff",
      "border: 1px solid #e5e7eb",
      "border-radius: 12px",
      "box-shadow: 0 10px 25px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.05)",
      "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "font-size: 14px",
      "min-width: 140px",
      "user-select: none",
    ].join(";");

    // Toggle button
    var button = document.createElement("button");
    button.id = "loc-toggle";
    button.type = "button";
    button.style.cssText = [
      "width: 100%",
      "padding: 10px 14px",
      "background: transparent",
      "border: none",
      "cursor: pointer",
      "display: flex",
      "align-items: center",
      "justify-content: space-between",
      "font-size: 14px",
      "font-weight: 500",
      "color: #1f2937",
      "border-radius: 12px",
    ].join(";");
    button.innerHTML =
      '<span style="display:flex;align-items:center;gap:6px;">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"></circle>' +
      '<line x1="2" y1="12" x2="22" y2="12"></line>' +
      '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>' +
      "</svg>" +
      '<span id="loc-current-name">' + escapeHtml(LANG_NAMES[currentLang]) + "</span>" +
      "</span>" +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="6 9 12 15 18 9"></polyline>' +
      "</svg>";

    // Dropdown menu
    var menu = document.createElement("div");
    menu.id = "loc-menu";
    menu.style.cssText = [
      "display: none",
      "position: absolute",
      "bottom: calc(100% + 8px)",
      "right: 0",
      "background: #ffffff",
      "border: 1px solid #e5e7eb",
      "border-radius: 8px",
      "box-shadow: 0 10px 25px rgba(0,0,0,0.15)",
      "min-width: 160px",
      "padding: 4px",
      "max-height: 280px",
      "overflow-y: auto",
    ].join(";");

    // Available languages
    var availableLangs = Object.keys(LANG_NAMES);
    if (typeof window.LOC_TARGET_LANG !== "undefined") {
      availableLangs = ["en", window.LOC_TARGET_LANG];
    }

    for (var i = 0; i < availableLangs.length; i++) {
      (function(lang) {
        var item = document.createElement("button");
        item.type = "button";
        item.style.cssText = [
          "display: flex",
          "align-items: center",
          "justify-content: space-between",
          "width: 100%",
          "padding: 8px 12px",
          "background: transparent",
          "border: none",
          "cursor: pointer",
          "font-size: 14px",
          "color: #1f2937",
          "text-align: left",
          "border-radius: 6px",
          "transition: background 0.15s",
        ].join(";");
        item.innerHTML =
          '<span>' + escapeHtml(LANG_NAMES[lang]) + "</span>" +
          (lang === currentLang
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : "");

        item.onmouseover = function() { this.style.background = "#f3f4f6"; };
        item.onmouseout = function() { this.style.background = "transparent"; };
        item.onclick = function(e) {
          e.stopPropagation();
          switchLanguage(lang);
          menu.style.display = "none";
        };

        menu.appendChild(item);
      })(availableLangs[i]);
    }

    button.onclick = function(e) {
      e.stopPropagation();
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    };

    // Close menu on outside click
    document.addEventListener("click", function(e) {
      if (!container.contains(e.target)) {
        menu.style.display = "none";
      }
    });

    container.appendChild(button);
    container.appendChild(menu);
    document.body.appendChild(container);
  }

  function switchLanguage(lang) {
    currentLang = lang;

    // Update UI
    var nameEl = document.getElementById("loc-current-name");
    if (nameEl) nameEl.textContent = LANG_NAMES[lang];

    // Save preference
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}

    // Apply translations
    applyTranslations(lang);

    // Update <html lang="...">
    document.documentElement.setAttribute("lang", lang);

    // Dispatch event for custom integrations
    window.dispatchEvent(new CustomEvent("loc:languageChanged", { detail: { lang: lang } }));
  }

  // ============================================
  // Utility
  // ============================================
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================
  // Init
  // ============================================
  function init() {
    // Create UI
    createSwitcher();
    // Apply initial translations
    applyTranslations(currentLang);
    // Set html lang attribute
    document.documentElement.setAttribute("lang", currentLang);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  window.loc = {
    switchLanguage: switchLanguage,
    getCurrentLanguage: function() { return currentLang; },
    getLanguageName: function(code) { return LANG_NAMES[code] || code; },
    applyTranslations: applyTranslations,
  };
})();