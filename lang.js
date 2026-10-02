/**
 * LogixSense Language / Internationalization Helper (lang.js)
 * Supports English (en), Tamil (ta), Hindi (hi), Telugu (te), Kannada (kn), Malayalam (ml)
 * 
 * Usage:
 *   - Elements with data-i18n="key" have their textContent translated
 *   - Elements with data-i18n-placeholder="key" have their placeholder translated
 *   - Call t('key') to get the translated string in JS
 *   - Call applyLanguage('en'|'ta'|'hi'|'te'|'kn'|'ml') to switch languages
 */

(function() {
  'use strict';

  let _currentLang = 'en';
  let _translations = {};
  let _loaded = {};

  const LANG_KEY = 'logixsense_lang';
  const ENGLISH_FONT  = "'Syne', system-ui, sans-serif";
  const TAMIL_FONT    = "'Noto Sans Tamil', sans-serif";
  const HINDI_FONT    = "'Noto Sans Devanagari', sans-serif";
  const TELUGU_FONT   = "'Noto Sans Telugu', sans-serif";
  const KANNADA_FONT  = "'Noto Sans Kannada', sans-serif";
  const MALAYALAM_FONT= "'Noto Sans Malayalam', sans-serif";
  const SUPPORTED_LANGS = ['en', 'ta', 'hi', 'te', 'kn', 'ml'];

  /**
   * Get translation for a key, falling back to the key itself
   */
  window.t = function(key) {
    return _translations[key] || key;
  };

  /**
   * Load the translation JSON file for a given language
   */
  async function loadTranslations(lang) {
    if (_loaded[lang]) return _loaded[lang];
    try {
      const base = (window.__LS_BASE__ || new URL('./', window.location.href).href).replace(/\/?$/, '/');
      const res = await fetch(`${base}locales/${lang}.json?v=${Date.now()}`);
      if (!res.ok) throw new Error(`Failed to load /locales/${lang}.json`);
      const data = await res.json();
      _loaded[lang] = data;
      return data;
    } catch (e) {
      console.warn('lang.js: Could not load translations for', lang, e);
      return {};
    }
  }

  /**
   * Apply translations to all elements with data-i18n attributes
   */
  function applyTranslationsToDom(translations) {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key] !== undefined) {
        el.textContent = translations[key];
      }
    });

    // Placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[key] !== undefined) {
        el.placeholder = translations[key];
      }
    });

    // Title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (translations[key] !== undefined) {
        el.title = translations[key];
      }
    });
  }

  /**
   * Apply correct script font to body for the given language
   */
  function applyFont(lang) {
    const fontMap = {
      ta: TAMIL_FONT,
      hi: HINDI_FONT,
      te: TELUGU_FONT,
      kn: KANNADA_FONT,
      ml: MALAYALAM_FONT,
    };
    document.body.style.fontFamily = fontMap[lang] || ENGLISH_FONT;
  }

  /**
   * Switch app language.
   * @param {string} lang - 'en', 'ta', 'hi', 'te', 'kn', or 'ml'
   */
  window.applyLanguage = async function(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      lang = 'en';
    }
    _currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);

    const translations = await loadTranslations(lang);
    _translations = translations;
    applyTranslationsToDom(translations);
    applyFont(lang);

    // Update toggle button/dropdown appearance
    const toggleBtns = document.querySelectorAll('.lang-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.setAttribute('data-current-lang', lang);
    });

    const selectElements = document.querySelectorAll('.lang-select-dropdown');
    selectElements.forEach(sel => {
      sel.value = lang;
    });

    // Save to Firestore if authenticated & db is loaded
    if (window.auth && window.auth.currentUser && window.db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await setDoc(doc(window.db, 'users', window.auth.currentUser.uid), {
          preferredLanguage: lang
        }, { merge: true });
      } catch (e) {
        console.warn('lang.js: Could not sync language to user profile:', e);
      }
    }

    // Dispatch event so other parts of the app can react
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  };

  /**
   * Toggle between English and Tamil (fallback toggle method)
   */
  window.toggleLanguage = function() {
    const newLang = _currentLang === 'en' ? 'ta' : 'en';
    window.applyLanguage(newLang);
  };

  /**
   * Get current language
   */
  window.getCurrentLang = function() {
    return _currentLang;
  };

  /**
   * Get the Gemini language instruction to append to prompts
   */
  window.getGeminiLangInstruction = function() {
    const lang = localStorage.getItem(LANG_KEY) || 'en';
    if (lang === 'ta') {
      return '\n\nRespond entirely in Tamil language using Tamil script.';
    } else if (lang === 'hi') {
      return '\n\nRespond entirely in Hindi language using Devanagari script.';
    } else if (lang === 'te') {
      return '\n\nRespond entirely in Telugu language using Telugu script.';
    } else if (lang === 'kn') {
      return '\n\nRespond entirely in Kannada language using Kannada script.';
    } else if (lang === 'ml') {
      return '\n\nRespond entirely in Malayalam language using Malayalam script.';
    }
    return '\n\nRespond in English.';
  };

  /**
   * Initialize language on page load
   */
  async function initLanguage() {
    const saved = localStorage.getItem(LANG_KEY) || 'en';
    // Pre-load translations before applying
    const translations = await loadTranslations(saved);
    _translations = translations;
    _currentLang = saved;
    applyTranslationsToDom(translations);
    applyFont(saved);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
  } else {
    initLanguage();
  }
})();
