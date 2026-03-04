import { catalog, defaultLanguage } from '/js/i18n.js';
import { state } from '/js/core/state.js';

export function getCatalog() {
    return catalog;
}

export function getDefaultLanguage() {
    return defaultLanguage;
}

function getFallbackCatalog() {
    return catalog.frFR ?? {};
}

export function getLanguageCatalog(lang) {
    return catalog[lang] ?? getFallbackCatalog();
}

export function getEntry(key, langOverride) {
    const languageCatalog = getLanguageCatalog(langOverride ?? state.language);
    const fallbackCatalog = getFallbackCatalog();

    return Object.prototype.hasOwnProperty.call(languageCatalog, key)
        ? languageCatalog[key]
        : fallbackCatalog[key];
}

export function replacePlaceholders(str, node, languageCatalog, fallbackCatalog) {
    let replaced = str;
    let tags = replaced.match(/\{%\$?[\w.-]+\}/g);

    while (tags !== null) {
        for (const tag of tags) {
            const naked = tag.slice(2, -1).toLowerCase();
            let value = '';

            if (naked.startsWith('$')) {
                const nestedKey = naked.substring(1);
                value = Object.prototype.hasOwnProperty.call(languageCatalog, nestedKey)
                    ? languageCatalog[nestedKey]
                    : fallbackCatalog[nestedKey];
            } else if (node) {
                value = node.getAttribute(`data-i18n-${naked}`);
            }

            if (typeof value !== 'string') {
                value = '';
            }

            replaced = replaced.replace(tag, value);
        }

        tags = replaced.match(/\{%\$?[\w.-]+\}/g);
    }

    return replaced;
}

export function localizeDocument(root = document, languageOverride) {
    const lang = languageOverride ?? state.language;
    const languageCatalog = getLanguageCatalog(lang);
    const fallbackCatalog = getFallbackCatalog();
    const elements = root.querySelectorAll('[data-i18n]');

    for (const element of elements) {
        const key = element.dataset.i18n;
        let str = Object.prototype.hasOwnProperty.call(languageCatalog, key)
            ? languageCatalog[key]
            : fallbackCatalog[key];

        if (Array.isArray(str)) {
            [str] = str;
        }

        if (typeof str !== 'string') {
            continue;
        }

        element.innerHTML = replacePlaceholders(str, element, languageCatalog, fallbackCatalog);
    }
}

export function setLanguage(lang, persist = true) {
    if (!catalog[lang]) {
        return false;
    }

    state.language = lang;
    localizeDocument(document, state.language);

    if (persist) {
        try {
            localStorage.setItem('archeryTimer.language', state.language);
        } catch {
            // Ignore storage failures.
        }
    }

    return true;
}

export function getLanguage() {
    return state.language;
}
