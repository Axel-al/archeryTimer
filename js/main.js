(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var dom = app.dom;
    var i18nRuntime = app.core.i18n;
    var audio = app.core.audio;
    var render = app.core.render;
    var timer = app.core.timer;
    var popup = app.core.popup;
    var mainUi = app.ui.main;

    function canHandleSpacebar(event) {
        var target = event.target;
        if (!target) {
            return true;
        }

        var tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') {
            return false;
        }

        return !target.isContentEditable;
    }

    function initializePreferences() {
        try {
            var catalog = app.catalog || {};
            var storedLang = localStorage.getItem('archeryTimer.language');

            if (storedLang && catalog[storedLang]) {
                state.language = storedLang;
            } else {
                var browserLang = (navigator.language || 'fr').slice(0, 2).toLowerCase();
                if (app.defaultLanguage && Object.prototype.hasOwnProperty.call(app.defaultLanguage, browserLang)) {
                    state.language = app.defaultLanguage[browserLang];
                }
            }

            state.inversedColors = localStorage.getItem('archeryTimer.themeInversed') === '1';
            var storedVolume = state.safeInt(localStorage.getItem('archeryTimer.volume'), state.volumePercent);
            state.volumePercent = Math.max(0, Math.min(100, storedVolume));
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function bootstrap() {
        state.readMainDom(document);
        mainUi.init();

        if (dom.prepTime && !dom.prepTime.value) {
            dom.prepTime.value = String(state.prepSeconds);
        }

        render.updatePrepTimeFromInput(false);
        initializePreferences();
        audio.setVolumePercent(state.volumePercent, false);
        render.setControlsHidden(state.controlsHidden);
        i18nRuntime.setLanguage(state.language, false);
        render.render();
    }

    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && canHandleSpacebar(event)) {
            event.preventDefault();
            timer.pauseOrResumeTimer();
            return;
        }

        if (event.code === 'Escape' && mainUi.isHelpPanelOpen()) {
            mainUi.toggleHelpPanel(false);
        }
    });

    window.addEventListener('beforeunload', function() {
        popup.closeCtrlPanel();
    });

    window.addEventListener('unload', function() {
        popup.closeCtrlPanel();
    });

    window.addEventListener('fullscreenchange', function() {
        render.render();
    });

    window.addEventListener('load', bootstrap);
})(window);
