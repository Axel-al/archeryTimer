const instance = {
    mounted: false,
    root: null,
    adapter: null,
    refreshTimer: null,
    clickHandler: null,
    activeLanguage: null,
    autoCloseOnBridgeLoss: false,
    closeAttempted: false
};

function isBridgeLike(candidate) {
    return !!(
        candidate &&
        typeof candidate.runPrimaryAction === 'function' &&
        typeof candidate.ceaseFire === 'function' &&
        typeof candidate.setRoundSeconds === 'function' &&
        typeof candidate.setABCDMode === 'function' &&
        typeof candidate.toggleDecimal === 'function' &&
        typeof candidate.toggleControls === 'function' &&
        typeof candidate.getSnapshot === 'function' &&
        typeof candidate.getCatalog === 'function' &&
        typeof candidate.getLanguage === 'function'
    );
}

function pickBridge(options) {
    if (isBridgeLike(options?.bridge)) {
        return options.bridge;
    }

    if (isBridgeLike(window.ArcheryTimerBridge)) {
        return window.ArcheryTimerBridge;
    }

    try {
        const openerBridge = window.opener?.ArcheryTimerBridge;
        if (isBridgeLike(openerBridge)) {
            return openerBridge;
        }
    } catch {
        // Ignore cross-window access failures.
    }

    return null;
}

export function resolveBridgeAdapter(options = {}) {
    return {
        getBridge() {
            return pickBridge(options);
        },
        isAvailable() {
            return !!pickBridge(options);
        },
        runPrimaryAction() {
            pickBridge(options)?.runPrimaryAction();
        },
        ceaseFire() {
            pickBridge(options)?.ceaseFire();
        },
        setRoundSeconds(seconds) {
            pickBridge(options)?.setRoundSeconds(seconds);
        },
        setABCDMode(mode) {
            pickBridge(options)?.setABCDMode(mode);
        },
        toggleDecimal() {
            pickBridge(options)?.toggleDecimal();
        },
        toggleControls() {
            pickBridge(options)?.toggleControls();
        },
        getSnapshot() {
            return pickBridge(options)?.getSnapshot() ?? null;
        },
        getCatalog() {
            return pickBridge(options)?.getCatalog() ?? null;
        },
        getLanguage() {
            return pickBridge(options)?.getLanguage() ?? null;
        }
    };
}

function getQueryRoot() {
    return instance.root ?? document;
}

function queryOne(selector) {
    return getQueryRoot().querySelector(selector);
}

function queryAll(selector) {
    return getQueryRoot().querySelectorAll(selector);
}

function replacePlaceholders(str, node, languageCatalog, fallbackCatalog) {
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

function localize(languageOverride) {
    const catalog = instance.adapter?.getCatalog();
    if (!catalog) {
        return false;
    }

    const lang = languageOverride ?? instance.adapter?.getLanguage();
    if (!lang) {
        return false;
    }

    const languageCatalog = catalog[lang] ?? catalog.frFR ?? {};
    const fallbackCatalog = catalog.frFR ?? languageCatalog;

    for (const element of queryAll('[data-i18n]')) {
        const key = element.dataset.i18n;
        const str = Object.prototype.hasOwnProperty.call(languageCatalog, key)
            ? languageCatalog[key]
            : fallbackCatalog[key];

        if (typeof str !== 'string') {
            continue;
        }

        element.innerHTML = replacePlaceholders(str, element, languageCatalog, fallbackCatalog);
    }

    instance.activeLanguage = lang;
    return true;
}

function setInteractive(enabled) {
    for (const button of queryAll('button')) {
        button.disabled = !enabled;
    }

    queryOne('#ctrlStop')?.classList.toggle('is-disabled', !enabled);
}

function handleBridgeLoss() {
    setInteractive(false);

    if (instance.autoCloseOnBridgeLoss && !instance.closeAttempted) {
        instance.closeAttempted = true;
        try {
            window.close();
        } catch {
            // Ignore close failures and keep UI disabled.
        }
    }
}

function refreshState() {
    if (!instance.mounted) {
        return;
    }

    if (!instance.adapter?.isAvailable()) {
        handleBridgeLoss();
        return;
    }

    instance.closeAttempted = false;
    setInteractive(true);

    const snapshot = instance.adapter.getSnapshot();
    if (!snapshot) {
        handleBridgeLoss();
        return;
    }

    if (snapshot.language && snapshot.language !== instance.activeLanguage) {
        localize(snapshot.language);
    }

    const startButton = queryOne('#ctrlStart');
    if (startButton && snapshot.primaryActionLabel) {
        startButton.textContent = snapshot.primaryActionLabel;
    }

    const stopButton = queryOne('#ctrlStop');
    if (stopButton) {
        stopButton.disabled = !snapshot.emergencyEnabled;
        stopButton.classList.toggle('is-disabled', !snapshot.emergencyEnabled);
    }
}

function handleAction(action, element) {
    if (!instance.adapter?.isAvailable()) {
        handleBridgeLoss();
        return;
    }

    if (action === 'set-round-seconds') {
        instance.adapter.setRoundSeconds(element.getAttribute('data-seconds'));
    } else if (action === 'run-primary') {
        instance.adapter.runPrimaryAction();
    } else if (action === 'cease-fire') {
        instance.adapter.ceaseFire();
    } else if (action === 'set-abcd-mode') {
        instance.adapter.setABCDMode(element.getAttribute('data-mode'));
    } else if (action === 'toggle-decimal') {
        instance.adapter.toggleDecimal();
    } else if (action === 'toggle-controls') {
        instance.adapter.toggleControls();
    }

    refreshState();
}

export function mountCtrlPanel(options = {}) {
    if (instance.mounted) {
        unmountCtrlPanel();
    }

    instance.root = options.root ?? document;
    instance.adapter = resolveBridgeAdapter(options);
    instance.autoCloseOnBridgeLoss = !!options.autoCloseOnBridgeLoss;
    instance.activeLanguage = null;
    instance.closeAttempted = false;

    instance.clickHandler = function(event) {
        const source = event.target;
        if (!source?.closest) {
            return;
        }

        const target = source.closest('[data-action]');
        if (!target || !getQueryRoot().contains(target)) {
            return;
        }

        event.preventDefault();
        handleAction(target.getAttribute('data-action'), target);
    };

    getQueryRoot().addEventListener('click', instance.clickHandler);
    instance.mounted = true;

    if (instance.adapter.isAvailable()) {
        localize();
    } else {
        handleBridgeLoss();
    }

    refreshState();
    instance.refreshTimer = window.setInterval(refreshState, 200);
}

export function unmountCtrlPanel() {
    if (!instance.mounted && !instance.clickHandler && !instance.refreshTimer) {
        return;
    }

    if (instance.refreshTimer !== null) {
        window.clearInterval(instance.refreshTimer);
    }

    if (instance.clickHandler && instance.root?.removeEventListener) {
        instance.root.removeEventListener('click', instance.clickHandler);
    }

    instance.mounted = false;
    instance.root = null;
    instance.adapter = null;
    instance.refreshTimer = null;
    instance.clickHandler = null;
    instance.activeLanguage = null;
    instance.autoCloseOnBridgeLoss = false;
    instance.closeAttempted = false;
}
