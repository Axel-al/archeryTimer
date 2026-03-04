import { state, dom, readMainDom, safeInt } from '/js/core/state.js';
import { getCatalog, getDefaultLanguage, setLanguage } from '/js/core/i18n-runtime.js';
import { setVolumePercent } from '/js/core/audio.js';
import { updatePrepTimeFromInput, setControlsHidden, render } from '/js/core/render.js';
import { pauseOrResumeTimer } from '/js/core/timer.js';
import { closeCtrlPanel, createBridge } from '/js/core/popup.js';
import { initMainUI, isHelpPanelOpen, toggleHelpPanel } from '/js/ui/main-ui.js';

const bridge = createBridge();
window.ArcheryTimerBridge = bridge;

function canHandleSpacebar(event) {
    const target = event.target;
    if (!target) {
        return true;
    }

    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') {
        return false;
    }

    return !target.isContentEditable;
}

function initializePreferences() {
    try {
        const catalog = getCatalog();
        const defaultLanguage = getDefaultLanguage();
        const storedLang = localStorage.getItem('archeryTimer.language');

        if (storedLang && catalog[storedLang]) {
            state.language = storedLang;
        } else {
            const browserLang = (navigator.language ?? 'fr').slice(0, 2).toLowerCase();
            if (Object.prototype.hasOwnProperty.call(defaultLanguage, browserLang)) {
                state.language = defaultLanguage[browserLang];
            }
        }

        state.inversedColors = localStorage.getItem('archeryTimer.themeInversed') === '1';
        const storedVolume = safeInt(localStorage.getItem('archeryTimer.volume'), state.volumePercent);
        state.volumePercent = Math.max(0, Math.min(100, storedVolume));
    } catch {
        // Ignore storage failures.
    }
}

function bootstrap() {
    readMainDom(document);
    initMainUI();

    if (dom.prepTime && !dom.prepTime.value) {
        dom.prepTime.value = String(state.prepSeconds);
    }

    updatePrepTimeFromInput(false);
    initializePreferences();
    setVolumePercent(state.volumePercent, false);
    setControlsHidden(state.controlsHidden);
    setLanguage(state.language, false);
    render();
}

document.addEventListener('keydown', event => {
    if (event.code === 'Space' && canHandleSpacebar(event)) {
        event.preventDefault();
        pauseOrResumeTimer();
        return;
    }

    if (event.code === 'Escape' && isHelpPanelOpen()) {
        toggleHelpPanel(false);
    }
});

window.addEventListener('beforeunload', () => {
    closeCtrlPanel();
});

window.addEventListener('unload', () => {
    closeCtrlPanel();
    try {
        delete window.ArcheryTimerBridge;
    } catch {
        window.ArcheryTimerBridge = undefined;
    }
});

window.addEventListener('fullscreenchange', () => {
    render();
});

window.addEventListener('load', bootstrap);
