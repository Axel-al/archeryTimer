import { state, dom, isRunning } from '/js/core/state.js';
import { setVolumePercent } from '/js/core/audio.js';
import { setLanguage } from '/js/core/i18n-runtime.js';
import { render, toggleFullscreen, updatePrepTimeFromInput } from '/js/core/render.js';
import { cycleABCDMode, startTimer, ceaseFire, setInversedColors } from '/js/core/timer.js';
import { showCtrlPanel } from '/js/core/popup.js';

let initialized = false;

export function isHelpPanelOpen() {
    return !!dom.helpPanel && !dom.helpPanel.classList.contains('hidden');
}

export function toggleHelpPanel(forceOpen) {
    if (!dom.helpPanel) {
        return;
    }

    const shouldOpen = typeof forceOpen === 'boolean'
        ? forceOpen
        : dom.helpPanel.classList.contains('hidden');

    dom.helpPanel.classList.toggle('hidden', !shouldOpen);
    dom.helpPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
}

function handlePrepTimeChange() {
    const changed = updatePrepTimeFromInput(true);
    if (changed || isRunning()) {
        render();
    }
}

function bindClick(element, handler) {
    element?.addEventListener('click', event => {
        event.preventDefault();
        handler(event);
    });
}

export function initMainUI() {
    if (initialized) {
        return;
    }

    bindClick(dom.abcdToggle, () => {
        cycleABCDMode();
    });

    bindClick(dom.startAction, () => {
        startTimer();
    });

    bindClick(dom.stopAction, () => {
        ceaseFire();
    });

    bindClick(dom.helpButton, () => {
        toggleHelpPanel();
    });

    bindClick(dom.optionsButton, () => {
        showCtrlPanel();
    });

    bindClick(dom.helpClose, () => {
        toggleHelpPanel(false);
    });

    for (const button of dom.languageButtons ?? []) {
        button.addEventListener('click', event => {
            const language = event.currentTarget?.getAttribute('data-language');
            if (!language) {
                return;
            }

            if (setLanguage(language)) {
                render();
            }
        });
    }

    dom.toggleColors?.addEventListener('change', () => {
        setInversedColors(dom.toggleColors?.checked);
    });

    dom.volumeSlider?.addEventListener('input', () => {
        setVolumePercent(dom.volumeSlider?.value, true);
    });

    dom.fullscreenButton?.addEventListener('click', event => {
        event.preventDefault();
        toggleFullscreen();
    });

    dom.prepTime?.addEventListener('change', handlePrepTimeChange);

    initialized = true;
}
