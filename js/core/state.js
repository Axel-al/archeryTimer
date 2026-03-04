export const COLORS = {
    idle: '#f00',
    active: '#0f0',
    low: '#ffa500'
};

export const PHASE_CLASS_MAP = {
    prep: 'phase-prep',
    shoot: 'phase-shoot',
    low: 'phase-low'
};

export const state = {
    intervalId: -1,
    cycleStartMs: 0,
    pausedElapsedMs: 0,
    totalSeconds: 120,
    prepSeconds: 20,
    useABCD: false,
    onCD: false,
    flipCD: false,
    useDecimal: false,
    controlsHidden: false,
    language: 'frFR',
    inversedColors: false,
    shootStarted: false,
    lowTimeReached: false,
    prepCuePlayed: false,
    volumePercent: 100,
    prepFeedbackTimeout: null,
    ctrlPanelWindow: null,
    ctrlPanelAutoHidden: false
};

export const dom = {
    body: null,
    timer: null,
    abcd: null,
    abcdToggle: null,
    maintimer: null,
    controls: null,
    startAction: null,
    stopAction: null,
    toggleColors: null,
    prepTime: null,
    prepFeedback: null,
    volumeSlider: null,
    volumeValue: null,
    helpPanel: null,
    fullscreenButton: null,
    optionsButton: null,
    helpButton: null,
    helpClose: null,
    languageButtons: [],
    beep1: null,
    beep2: null,
    beep3: null,
    cease: null,
    startSound: null
};

export function readMainDom(root = document) {
    dom.body = document.body;
    dom.timer = root.getElementById('timer');
    dom.abcd = root.getElementById('abcd');
    dom.abcdToggle = root.getElementById('abcdToggle');
    dom.maintimer = root.getElementById('maintimer');
    dom.controls = root.getElementById('osccontrols');
    dom.startAction = root.getElementById('startAction');
    dom.stopAction = root.getElementById('stopAction');
    dom.toggleColors = root.getElementById('toggleColors');
    dom.prepTime = root.getElementById('prepTime');
    dom.prepFeedback = root.getElementById('prepFeedback');
    dom.volumeSlider = root.getElementById('volumeSlider');
    dom.volumeValue = root.getElementById('volumeValue');
    dom.helpPanel = root.getElementById('helpPanel');
    dom.fullscreenButton = root.getElementById('fullscreenButton');
    dom.optionsButton = root.getElementById('complexPanelButton');
    dom.helpButton = root.getElementById('helpPanelButton');
    dom.helpClose = root.getElementById('helpCloseButton');
    dom.languageButtons = [...root.querySelectorAll('[data-language]')];
    dom.beep1 = root.getElementById('beep1');
    dom.beep2 = root.getElementById('beep2');
    dom.beep3 = root.getElementById('beep3');
    dom.cease = root.getElementById('cease');
    dom.startSound = root.getElementById('start');
}

export function safeInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function clampPrepSeconds(value) {
    const next = safeInt(value, state.prepSeconds);
    return next < 3 ? 3 : next;
}

export function isRunning() {
    return state.intervalId !== -1;
}

export function isPaused() {
    return !isRunning() && state.pausedElapsedMs > 0;
}

export function getNowMs() {
    return Date.now();
}

export function getPrepMs() {
    return state.prepSeconds * 1000;
}

export function getShootMs() {
    return state.totalSeconds * 1000;
}

export function getRoundMs() {
    return getPrepMs() + getShootMs();
}

export function getElapsedMs(nowMs) {
    if (isRunning()) {
        return Math.max(0, nowMs - state.cycleStartMs);
    }
    return Math.max(0, state.pausedElapsedMs);
}

export function getPhaseState(elapsedMs) {
    const prepMs = getPrepMs();
    const shootMs = getShootMs();

    if (elapsedMs < prepMs) {
        return {
            phase: 'prep',
            phaseElapsedMs: elapsedMs,
            phaseRemainingMs: prepMs - elapsedMs,
            shootElapsedMs: 0,
            shootRemainingMs: shootMs
        };
    }

    const shootElapsedMs = elapsedMs - prepMs;
    const shootRemainingMs = Math.max(0, shootMs - shootElapsedMs);

    return {
        phase: 'shoot',
        phaseElapsedMs: shootElapsedMs,
        phaseRemainingMs: shootRemainingMs,
        shootElapsedMs,
        shootRemainingMs
    };
}

export function getPhaseTone(phaseState) {
    if (phaseState.phase === 'prep') {
        return 'prep';
    }
    return phaseState.shootRemainingMs <= 20000 ? 'low' : 'shoot';
}

export function getABCDMode() {
    if (!state.useABCD) {
        return 'all';
    }
    return state.flipCD ? 'cd' : 'ab';
}

export function getABCDLabel() {
    if (!state.useABCD) {
        return '';
    }

    if (!state.flipCD) {
        return state.onCD ? 'C<br />D' : 'A<br />B';
    }
    return state.onCD ? 'A<br />B' : 'C<br />D';
}
