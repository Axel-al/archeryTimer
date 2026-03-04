import { state } from '/js/core/state.js';
import { render, setControlsHidden, getSnapshot } from '/js/core/render.js';
import {
    startTimer as runPrimaryAction,
    ceaseFire as emergencyCeaseFire,
    setRoundSeconds as applyRoundSeconds,
    setABCDMode as applyABCDMode,
    toggleDecimal as toggleDecimalDisplay,
    toggleControls as toggleMainControls
} from '/js/core/timer.js';
import { getCatalog, getLanguage } from '/js/core/i18n-runtime.js';

function restoreCtrlPanelState(monitoredWindow) {
    // Ignore stale close callbacks from a previous popup instance.
    if (state.ctrlPanelWindow !== monitoredWindow) {
        return;
    }

    state.ctrlPanelWindow = null;

    if (state.ctrlPanelAutoHidden) {
        setControlsHidden(false);
        state.ctrlPanelAutoHidden = false;
        render();
    }
}

export function closeCtrlPanel() {
    if (state.ctrlPanelWindow && !state.ctrlPanelWindow.closed) {
        state.ctrlPanelWindow.close();
    }

    restoreCtrlPanelState(state.ctrlPanelWindow);
}

export function showCtrlPanel() {
    if (state.ctrlPanelWindow && !state.ctrlPanelWindow.closed) {
        state.ctrlPanelWindow.focus();
        return state.ctrlPanelWindow;
    }

    const opened = window.open('/panels/ctrlpanel.html', '_blank', 'height=280,width=650');
    if (!opened) {
        return null;
    }

    state.ctrlPanelWindow = opened;

    if (!state.controlsHidden) {
        state.ctrlPanelAutoHidden = true;
        setControlsHidden(true);
        render();
    }

    opened.addEventListener?.('blur', () => {
        if (!opened.closed) {
            opened.close();
        }
    });

    const checkClosed = window.setInterval(() => {
        if (!opened || opened.closed) {
            window.clearInterval(checkClosed);
            restoreCtrlPanelState(opened);
        }
    }, 250);

    return opened;
}

export function createBridge() {
    return {
        runPrimaryAction() {
            runPrimaryAction();
        },
        ceaseFire() {
            emergencyCeaseFire();
        },
        setRoundSeconds(seconds) {
            applyRoundSeconds(seconds);
        },
        setABCDMode(mode) {
            applyABCDMode(mode);
        },
        toggleDecimal() {
            toggleDecimalDisplay();
        },
        toggleControls() {
            toggleMainControls();
        },
        getSnapshot() {
            return getSnapshot();
        },
        getCatalog() {
            return getCatalog();
        },
        getLanguage() {
            return getLanguage();
        }
    };
}
