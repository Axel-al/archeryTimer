(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var render = app.core.render;
    var timer = app.core.timer;
    var i18nRuntime = app.core.i18n;
    var popup = app.core.popup || {};
    var bridge = app.bridge || {};

    function restoreCtrlPanelState(monitoredWindow) {
        if (state.ctrlPanelWindow === monitoredWindow) {
            state.ctrlPanelWindow = null;
        }

        if (state.ctrlPanelAutoHidden) {
            render.setControlsHidden(false);
            state.ctrlPanelAutoHidden = false;
            render.render();
        }
    }

    function closeCtrlPanel() {
        if (state.ctrlPanelWindow && !state.ctrlPanelWindow.closed) {
            state.ctrlPanelWindow.close();
        }
        restoreCtrlPanelState(state.ctrlPanelWindow);
    }

    function showCtrlPanel() {
        if (state.ctrlPanelWindow && !state.ctrlPanelWindow.closed) {
            state.ctrlPanelWindow.focus();
            return state.ctrlPanelWindow;
        }

        var opened = window.open('/panels/ctrlpanel.html', '_blank', 'height=280,width=650');
        if (!opened) {
            return null;
        }

        state.ctrlPanelWindow = opened;

        if (!state.controlsHidden) {
            state.ctrlPanelAutoHidden = true;
            render.setControlsHidden(true);
            render.render();
        }

        if (opened.addEventListener) {
            opened.addEventListener('blur', function() {
                if (!opened.closed) {
                    opened.close();
                }
            });
        }

        var checkClosed = window.setInterval(function() {
            if (!opened || opened.closed) {
                window.clearInterval(checkClosed);
                restoreCtrlPanelState(opened);
            }
        }, 250);

        return opened;
    }

    bridge.runPrimaryAction = function() {
        timer.startTimer();
    };
    bridge.ceaseFire = function() {
        timer.ceaseFire();
    };
    bridge.setRoundSeconds = function(seconds) {
        timer.setRoundSeconds(seconds);
    };
    bridge.setABCDMode = function(mode) {
        timer.setABCDMode(mode);
    };
    bridge.toggleDecimal = function() {
        timer.toggleDecimal();
    };
    bridge.toggleControls = function() {
        timer.toggleControls();
    };
    bridge.getSnapshot = function() {
        return render.getSnapshot();
    };
    bridge.getCatalog = function() {
        return i18nRuntime.getCatalog();
    };
    bridge.getLanguage = function() {
        return i18nRuntime.getLanguage();
    };

    popup.closeCtrlPanel = closeCtrlPanel;
    popup.showCtrlPanel = showCtrlPanel;

    app.core.popup = popup;
    app.bridge = bridge;
})(window);
