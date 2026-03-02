(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var dom = app.dom;
    var audio = app.core.audio;
    var i18nRuntime = app.core.i18n;
    var render = app.core.render;
    var timer = app.core.timer;
    var popup = app.core.popup;
    var ui = app.ui.main || {};

    function isHelpPanelOpen() {
        return !!(dom.helpPanel && !dom.helpPanel.classList.contains('hidden'));
    }

    function toggleHelpPanel(forceOpen) {
        if (!dom.helpPanel) {
            return;
        }

        var shouldOpen = typeof forceOpen === 'boolean'
            ? forceOpen
            : dom.helpPanel.classList.contains('hidden');

        dom.helpPanel.classList.toggle('hidden', !shouldOpen);
        dom.helpPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    }

    function handlePrepTimeChange() {
        var changed = render.updatePrepTimeFromInput(true);
        if (changed || state.isRunning()) {
            render.render();
        }
    }

    function bindClick(element, handler) {
        if (!element) {
            return;
        }

        element.addEventListener('click', function(event) {
            event.preventDefault();
            handler(event);
        });
    }

    function init() {
        if (ui.initialized) {
            return;
        }

        bindClick(dom.abcdToggle, function() {
            timer.cycleABCDMode();
        });

        bindClick(dom.startAction, function() {
            timer.startTimer();
        });

        bindClick(dom.stopAction, function() {
            timer.ceaseFire();
        });

        bindClick(dom.helpButton, function() {
            toggleHelpPanel();
        });

        bindClick(dom.optionsButton, function() {
            popup.showCtrlPanel();
        });

        bindClick(dom.helpClose, function() {
            toggleHelpPanel(false);
        });

        if (dom.languageButtons && dom.languageButtons.length) {
            for (var i = 0; i < dom.languageButtons.length; i++) {
                dom.languageButtons[i].addEventListener('click', function(event) {
                    var button = event.currentTarget;
                    var language = button.getAttribute('data-language');
                    if (!language) {
                        return;
                    }

                    if (i18nRuntime.setLanguage(language)) {
                        render.render();
                    }
                });
            }
        }

        if (dom.toggleColors) {
            dom.toggleColors.addEventListener('change', function() {
                timer.setInversedColors(dom.toggleColors.checked);
            });
        }

        if (dom.volumeSlider) {
            dom.volumeSlider.addEventListener('input', function() {
                audio.setVolumePercent(dom.volumeSlider.value, true);
            });
        }

        if (dom.fullscreenButton) {
            dom.fullscreenButton.addEventListener('click', function(event) {
                event.preventDefault();
                render.toggleFullscreen();
            });
        }

        if (dom.prepTime) {
            dom.prepTime.addEventListener('change', handlePrepTimeChange);
        }

        ui.initialized = true;
    }

    ui.init = init;
    ui.toggleHelpPanel = toggleHelpPanel;
    ui.isHelpPanelOpen = isHelpPanelOpen;

    app.ui.main = ui;
})(window);
