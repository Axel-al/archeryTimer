(function(window) {
    var app = window.ArcheryTimer;
    var ctrlPanel = app.ui.ctrlPanel || {};
    var instance = ctrlPanel.instance || {
        mounted: false,
        root: null,
        adapter: null,
        refreshTimer: null,
        clickHandler: null,
        beforeUnloadHandler: null,
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
        if (options && isBridgeLike(options.bridge)) {
            return options.bridge;
        }

        if (isBridgeLike(window.ArcheryTimer && window.ArcheryTimer.bridge)) {
            return window.ArcheryTimer.bridge;
        }

        try {
            if (
                window.opener &&
                !window.opener.closed &&
                window.opener.ArcheryTimer &&
                isBridgeLike(window.opener.ArcheryTimer.bridge)
            ) {
                return window.opener.ArcheryTimer.bridge;
            }
        } catch (error) {
            // Ignore cross-window access failures.
        }

        return null;
    }

    function resolveBridgeAdapter(options) {
        return {
            getBridge: function() {
                return pickBridge(options || {});
            },
            isAvailable: function() {
                return !!pickBridge(options || {});
            },
            runPrimaryAction: function() {
                var bridge = pickBridge(options || {});
                if (bridge) {
                    bridge.runPrimaryAction();
                }
            },
            ceaseFire: function() {
                var bridge = pickBridge(options || {});
                if (bridge) {
                    bridge.ceaseFire();
                }
            },
            setRoundSeconds: function(seconds) {
                var bridge = pickBridge(options || {});
                if (bridge) {
                    bridge.setRoundSeconds(seconds);
                }
            },
            setABCDMode: function(mode) {
                var bridge = pickBridge(options || {});
                if (bridge) {
                    bridge.setABCDMode(mode);
                }
            },
            toggleDecimal: function() {
                var bridge = pickBridge(options || {});
                if (bridge) {
                    bridge.toggleDecimal();
                }
            },
            toggleControls: function() {
                var bridge = pickBridge(options || {});
                if (bridge) {
                    bridge.toggleControls();
                }
            },
            getSnapshot: function() {
                var bridge = pickBridge(options || {});
                return bridge ? bridge.getSnapshot() : null;
            },
            getCatalog: function() {
                var bridge = pickBridge(options || {});
                return bridge ? bridge.getCatalog() : null;
            },
            getLanguage: function() {
                var bridge = pickBridge(options || {});
                return bridge ? bridge.getLanguage() : null;
            }
        };
    }

    function getQueryRoot() {
        return instance.root || document;
    }

    function queryOne(selector) {
        return getQueryRoot().querySelector(selector);
    }

    function queryAll(selector) {
        return getQueryRoot().querySelectorAll(selector);
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

    function localize(languageOverride) {
        var catalog = instance.adapter.getCatalog();
        if (!catalog) {
            return false;
        }

        var lang = languageOverride || instance.adapter.getLanguage();
        if (!lang) {
            return false;
        }

        var languageCatalog = catalog[lang] || catalog.frFR || {};
        var fallbackCatalog = catalog.frFR || languageCatalog;
        var elements = queryAll('[data-i18n]');

        for (var i = 0; i < elements.length; i++) {
            var key = elements[i].dataset.i18n;
            var str = Object.prototype.hasOwnProperty.call(languageCatalog, key)
                ? languageCatalog[key]
                : fallbackCatalog[key];

            if (typeof str !== 'string') {
                continue;
            }

            elements[i].innerHTML = replacePlaceholders(str, elements[i], languageCatalog, fallbackCatalog);
        }

        instance.activeLanguage = lang;
        return true;
    }

    function setInteractive(enabled) {
        var buttons = queryAll('button');

        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = !enabled;
        }

        var stopButton = queryOne('#ctrlStop');
        if (stopButton) {
            stopButton.classList.toggle('is-disabled', !enabled);
        }
    }

    function handleBridgeLoss() {
        setInteractive(false);

        if (instance.autoCloseOnBridgeLoss && !instance.closeAttempted) {
            instance.closeAttempted = true;
            try {
                window.close();
            } catch (error) {
                // Ignore close failures and keep the UI disabled.
            }
        }
    }

    function refreshState() {
        if (!instance.mounted) {
            return;
        }

        if (!instance.adapter.isAvailable()) {
            handleBridgeLoss();
            return;
        }

        instance.closeAttempted = false;
        setInteractive(true);

        var snapshot = instance.adapter.getSnapshot();
        if (!snapshot) {
            handleBridgeLoss();
            return;
        }

        if (snapshot.language && snapshot.language !== instance.activeLanguage) {
            localize(snapshot.language);
        }

        var startButton = queryOne('#ctrlStart');
        if (startButton && snapshot.primaryActionLabel) {
            startButton.textContent = snapshot.primaryActionLabel;
        }

        var stopButton = queryOne('#ctrlStop');
        if (stopButton) {
            stopButton.disabled = !snapshot.emergencyEnabled;
            stopButton.classList.toggle('is-disabled', !snapshot.emergencyEnabled);
        }
    }

    function handleAction(action, element) {
        if (!instance.adapter.isAvailable()) {
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

    function mount(options) {
        if (instance.mounted) {
            ctrlPanel.unmount();
        }

        var resolvedOptions = options || {};
        instance.root = resolvedOptions.root || document;
        instance.adapter = resolveBridgeAdapter(resolvedOptions);
        instance.autoCloseOnBridgeLoss = !!resolvedOptions.autoCloseOnBridgeLoss;
        instance.activeLanguage = null;
        instance.closeAttempted = false;
        instance.clickHandler = function(event) {
            var source = event.target;
            if (!source || !source.closest) {
                return;
            }

            var target = source.closest('[data-action]');
            if (!target || !getQueryRoot().contains(target)) {
                return;
            }

            event.preventDefault();
            handleAction(target.getAttribute('data-action'), target);
        };

        getQueryRoot().addEventListener('click', instance.clickHandler);
        instance.beforeUnloadHandler = function() {
            ctrlPanel.unmount();
        };
        window.addEventListener('beforeunload', instance.beforeUnloadHandler);
        instance.mounted = true;

        if (instance.adapter.isAvailable()) {
            localize();
        } else {
            handleBridgeLoss();
        }

        refreshState();
        instance.refreshTimer = window.setInterval(refreshState, 200);
    }

    function unmount() {
        if (!instance.mounted && !instance.clickHandler && !instance.refreshTimer) {
            return;
        }

        if (instance.refreshTimer !== null) {
            window.clearInterval(instance.refreshTimer);
        }
        if (instance.clickHandler && instance.root && instance.root.removeEventListener) {
            instance.root.removeEventListener('click', instance.clickHandler);
        }
        if (instance.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', instance.beforeUnloadHandler);
        }

        instance.mounted = false;
        instance.root = null;
        instance.adapter = null;
        instance.refreshTimer = null;
        instance.clickHandler = null;
        instance.beforeUnloadHandler = null;
        instance.activeLanguage = null;
        instance.autoCloseOnBridgeLoss = false;
        instance.closeAttempted = false;
    }

    ctrlPanel.mount = mount;
    ctrlPanel.unmount = unmount;
    ctrlPanel.resolveBridgeAdapter = resolveBridgeAdapter;
    ctrlPanel.instance = instance;

    app.ui.ctrlPanel = ctrlPanel;

    document.addEventListener('DOMContentLoaded', function() {
        if (document.body && document.body.getAttribute('data-ui') === 'ctrlpanel') {
            ctrlPanel.mount({ autoCloseOnBridgeLoss: true });
        }
    });
})(window);
