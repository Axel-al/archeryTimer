(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var i18nRuntime = app.core.i18n || {};

    function getCatalog() {
        return app.catalog || {};
    }

    function getFallbackCatalog() {
        var catalog = getCatalog();
        return catalog.frFR || {};
    }

    function getLanguageCatalog(lang) {
        var catalog = getCatalog();
        if (catalog[lang]) {
            return catalog[lang];
        }
        return getFallbackCatalog();
    }

    function getEntry(key, langOverride) {
        var languageCatalog = getLanguageCatalog(langOverride || state.language);
        var fallbackCatalog = getFallbackCatalog();

        if (Object.prototype.hasOwnProperty.call(languageCatalog, key)) {
            return languageCatalog[key];
        }
        return fallbackCatalog[key];
    }

    function replacePlaceholders(str, node, languageCatalog, fallbackCatalog) {
        var replaced = str;
        var tags = replaced.match(/\{%\$?[\w.-]+\}/g);

        while (tags !== null) {
            for (var i = 0; i < tags.length; i++) {
                var naked = tags[i].slice(2, -1).toLowerCase();
                var value = '';

                if (naked.substr(0, 1) === '$') {
                    var nestedKey = naked.substring(1);
                    value = Object.prototype.hasOwnProperty.call(languageCatalog, nestedKey)
                        ? languageCatalog[nestedKey]
                        : fallbackCatalog[nestedKey];
                } else if (node) {
                    value = node.getAttribute('data-i18n-' + naked);
                }

                if (typeof value !== 'string') {
                    value = '';
                }

                replaced = replaced.replace(tags[i], value);
            }

            tags = replaced.match(/\{%\$?[\w.-]+\}/g);
        }

        return replaced;
    }

    function localizeDocument(root, languageOverride) {
        var target = root || document;
        var lang = languageOverride || state.language;
        var languageCatalog = getLanguageCatalog(lang);
        var fallbackCatalog = getFallbackCatalog();
        var elements = target.querySelectorAll('[data-i18n]');

        for (var i = 0; i < elements.length; i++) {
            var key = elements[i].dataset.i18n;
            var str = Object.prototype.hasOwnProperty.call(languageCatalog, key)
                ? languageCatalog[key]
                : fallbackCatalog[key];

            if (Array.isArray(str)) {
                str = str[0];
            }
            if (typeof str !== 'string') {
                continue;
            }

            elements[i].innerHTML = replacePlaceholders(str, elements[i], languageCatalog, fallbackCatalog);
        }
    }

    function setLanguage(lang, persist) {
        var catalog = getCatalog();
        if (!catalog[lang]) {
            return false;
        }

        state.language = lang;
        localizeDocument(document, state.language);

        if (persist !== false) {
            try {
                localStorage.setItem('archeryTimer.language', state.language);
            } catch (error) {
                // Ignore storage failures.
            }
        }

        return true;
    }

    function getLanguage() {
        return state.language;
    }

    i18nRuntime.getEntry = getEntry;
    i18nRuntime.replacePlaceholders = replacePlaceholders;
    i18nRuntime.localizeDocument = localizeDocument;
    i18nRuntime.setLanguage = setLanguage;
    i18nRuntime.getLanguage = getLanguage;
    i18nRuntime.getCatalog = getCatalog;
    i18nRuntime.getLanguageCatalog = getLanguageCatalog;

    app.core.i18n = i18nRuntime;
})(window);
