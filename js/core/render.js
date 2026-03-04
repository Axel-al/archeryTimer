import {
    PHASE_CLASS_MAP,
    state,
    dom,
    clampPrepSeconds,
    isRunning,
    isPaused,
    getElapsedMs,
    getNowMs,
    getPhaseState,
    getPhaseTone,
    getABCDLabel,
    getABCDMode
} from '/js/core/state.js';
import { getEntry } from '/js/core/i18n-runtime.js';

export function showPrepFeedback(message, isError) {
    if (!dom.prepFeedback) {
        return;
    }

    dom.prepFeedback.textContent = message;
    dom.prepFeedback.classList.remove('prep-feedback-visible', 'prep-feedback-error');

    if (isError) {
        dom.prepFeedback.classList.add('prep-feedback-error');
    }

    void dom.prepFeedback.offsetWidth;
    dom.prepFeedback.classList.add('prep-feedback-visible');

    window.clearTimeout(state.prepFeedbackTimeout);
    state.prepFeedbackTimeout = window.setTimeout(() => {
        dom.prepFeedback?.classList.remove('prep-feedback-visible');
    }, 1800);
}

export function updatePrepTimeFromInput(showFeedback) {
    if (!dom.prepTime) {
        return false;
    }

    let raw = String(dom.prepTime.value ?? '').trim();
    if (raw === '') {
        raw = '20';
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
        showPrepFeedback(getEntry('feedback.prep_invalid') ?? 'Valeur invalide: minimum 3 secondes.', true);
        dom.prepTime.value = String(state.prepSeconds);
        return false;
    }

    const next = clampPrepSeconds(parsed);
    const changed = next !== state.prepSeconds;
    state.prepSeconds = next;
    dom.prepTime.value = String(state.prepSeconds);

    if (showFeedback) {
        const template = getEntry('feedback.prep_applied') ?? 'Préparation: {value}s (appliqué)';
        showPrepFeedback(template.replace('{value}', state.prepSeconds), false);
    }

    return changed;
}

export function setControlsHidden(hidden) {
    state.controlsHidden = !!hidden;
    dom.body?.classList.toggle('controls-hidden', state.controlsHidden);
}

function formatTimerValue(ms) {
    if (state.useDecimal) {
        const tenths = Math.max(0, Math.floor(ms / 100));
        const whole = Math.floor(tenths / 10);
        const decimal = tenths % 10;
        return `${whole}<small>.${decimal}</small>`;
    }

    return String(Math.max(0, Math.ceil(ms / 1000)));
}

function applyPhaseClass(element, phaseTone) {
    if (!element) {
        return;
    }

    element.classList.remove(PHASE_CLASS_MAP.prep, PHASE_CLASS_MAP.shoot, PHASE_CLASS_MAP.low);
    element.classList.add(PHASE_CLASS_MAP[phaseTone] ?? PHASE_CLASS_MAP.prep);
}

export function renderTheme(phaseTone) {
    if (!dom.body || !dom.timer) {
        return;
    }

    dom.body.classList.toggle('theme-inversed', state.inversedColors);
    dom.body.classList.toggle('theme-normal', !state.inversedColors);

    applyPhaseClass(dom.body, phaseTone);
    applyPhaseClass(dom.timer, phaseTone);
}

export function isFullscreenActive() {
    return !!document.fullscreenElement;
}

export function toggleFullscreen() {
    const root = document.documentElement;

    if (!isFullscreenActive()) {
        root.requestFullscreen?.();
        return;
    }

    document.exitFullscreen?.();
}

function setEmergencyStopLabel(label) {
    if (!dom.stopAction) {
        return;
    }

    const labels = dom.stopAction.querySelectorAll('.stop-label-layer');
    for (const item of labels) {
        item.textContent = label;
    }

    dom.stopAction.setAttribute('aria-label', label);
    dom.stopAction.querySelector('.stop-banner')?.setAttribute('aria-label', label);
}

export function getPrimaryActionState() {
    if (isRunning()) {
        return 'finish_round';
    }
    if (isPaused()) {
        return 'resume';
    }
    return 'start';
}

export function getPrimaryActionLabel() {
    const actionState = getPrimaryActionState();

    if (actionState === 'resume') {
        return getEntry('controls.primary.resume') ?? 'Reprendre';
    }
    if (actionState === 'finish_round') {
        return getEntry('controls.primary.finish_round') ?? 'Finir la volée';
    }
    return getEntry('controls.primary.start') ?? 'Démarrer';
}

function renderActions() {
    if (dom.startAction) {
        dom.startAction.innerHTML = getPrimaryActionLabel();
        dom.startAction.dataset.actionState = getPrimaryActionState();
    }

    if (dom.stopAction) {
        const enabled = isRunning();
        setEmergencyStopLabel(getEntry('controls.emergency_stop') ?? "Pause d'urgence");
        dom.stopAction.classList.toggle('disabled', !enabled);
        dom.stopAction.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    if (dom.fullscreenButton) {
        const fullscreenLabel = isFullscreenActive()
            ? (getEntry('controls.exit_fullscreen') ?? 'Quitter le plein écran')
            : (getEntry('controls.fullscreen') ?? 'Plein écran');

        dom.fullscreenButton.title = fullscreenLabel;
        dom.fullscreenButton.setAttribute('aria-label', fullscreenLabel);
        dom.fullscreenButton.classList.toggle('is-active', isFullscreenActive());
    }
}

function renderABCD() {
    if (!dom.abcd) {
        return;
    }

    if (!state.useABCD) {
        dom.abcd.innerHTML = `<span class="abcd-hint">${getEntry('hints.abcd_click') ?? 'AB/CD'}</span>`;
        return;
    }

    dom.abcd.innerHTML = getABCDLabel();
}

function renderTimer() {
    if (!dom.timer) {
        return;
    }

    if (!isRunning() && state.pausedElapsedMs === 0) {
        dom.timer.innerHTML = state.useDecimal ? `${state.totalSeconds}<small>.0</small>` : String(state.totalSeconds);
        renderTheme('prep');
        return;
    }

    const elapsedMs = getElapsedMs(getNowMs());
    const phaseState = getPhaseState(elapsedMs);
    dom.timer.innerHTML = formatTimerValue(phaseState.phaseRemainingMs);
    renderTheme(getPhaseTone(phaseState));
}

export function render() {
    if (!dom.body || !dom.timer) {
        return;
    }

    if (dom.toggleColors) {
        dom.toggleColors.checked = state.inversedColors;
    }

    renderTimer();
    renderABCD();
    renderActions();
}

export function getSnapshot() {
    return {
        primaryActionState: getPrimaryActionState(),
        primaryActionLabel: getPrimaryActionLabel(),
        emergencyEnabled: isRunning(),
        inversedColors: state.inversedColors,
        language: state.language,
        controlsHidden: state.controlsHidden,
        roundSeconds: state.totalSeconds,
        prepSeconds: state.prepSeconds,
        abcdMode: getABCDMode()
    };
}
