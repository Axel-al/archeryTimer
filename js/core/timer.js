import {
    state,
    dom,
    safeInt,
    isRunning,
    isPaused,
    getNowMs,
    getPrepMs,
    getShootMs,
    getRoundMs,
    getPhaseState
} from '/js/core/state.js';
import { play } from '/js/core/audio.js';
import { updatePrepTimeFromInput, render, setControlsHidden } from '/js/core/render.js';

function syncFlagsFromElapsed(elapsedMs) {
    const prepMs = getPrepMs();

    state.shootStarted = elapsedMs >= prepMs;
    state.lowTimeReached = elapsedMs >= prepMs + Math.max(0, getShootMs() - 20000);
    state.prepCuePlayed = elapsedMs >= Math.max(0, prepMs - 2000);
}

export function startLoop() {
    if (isRunning()) {
        return;
    }

    state.intervalId = window.setInterval(tick, 100);
}

export function stopLoop() {
    if (!isRunning()) {
        return;
    }

    window.clearInterval(state.intervalId);
    state.intervalId = -1;
}

function startNextLine() {
    state.onCD = true;
    state.cycleStartMs = getNowMs();
    state.pausedElapsedMs = 0;
    state.shootStarted = false;
    state.lowTimeReached = false;
    state.prepCuePlayed = false;

    play(dom.beep2);
    render();
}

export function resetRound(playTone, flipSides) {
    stopLoop();
    state.pausedElapsedMs = 0;
    state.onCD = false;
    state.shootStarted = false;
    state.lowTimeReached = false;
    state.prepCuePlayed = false;

    if (flipSides) {
        state.flipCD = !state.flipCD;
    }

    if (playTone) {
        play(dom.beep3);
    }

    render();
}

export function tick() {
    const nowMs = getNowMs();
    const elapsedMs = nowMs - state.cycleStartMs;
    const phaseState = getPhaseState(elapsedMs);

    if (!state.prepCuePlayed && phaseState.phase === 'prep' && phaseState.phaseRemainingMs <= 3000 && phaseState.phaseRemainingMs > 2000) {
        state.prepCuePlayed = true;
        play(dom.startSound);
    }

    if (!state.shootStarted && phaseState.phase === 'shoot') {
        state.shootStarted = true;
    }

    if (!state.lowTimeReached && phaseState.phase === 'shoot' && phaseState.shootRemainingMs <= 20000) {
        state.lowTimeReached = true;
    }

    if (elapsedMs >= getRoundMs()) {
        if (state.useABCD && !state.onCD) {
            startNextLine();
        } else {
            resetRound(true, true);
        }
        return;
    }

    render();
}

export function startTimer() {
    updatePrepTimeFromInput(false);

    if (isRunning()) {
        if (state.useABCD && !state.onCD) {
            startNextLine();
        } else {
            resetRound(true, true);
        }
        return;
    }

    const resumed = isPaused();
    state.cycleStartMs = getNowMs() - state.pausedElapsedMs;
    syncFlagsFromElapsed(state.pausedElapsedMs);
    state.pausedElapsedMs = 0;

    startLoop();
    play(resumed ? dom.beep1 : dom.beep2);
    render();
}

export function ceaseFire() {
    if (!isRunning()) {
        return;
    }

    state.pausedElapsedMs = Math.max(0, getNowMs() - state.cycleStartMs);
    syncFlagsFromElapsed(state.pausedElapsedMs);
    stopLoop();
    play(dom.cease);
    render();
}

export function pauseOrResumeTimer() {
    if (isRunning()) {
        ceaseFire();
        return;
    }

    startTimer();
}

export function cycleABCDMode() {
    if (state.controlsHidden || isRunning()) {
        return;
    }

    if (!state.useABCD) {
        state.useABCD = true;
        state.flipCD = false;
        state.onCD = false;
    } else if (!state.flipCD) {
        state.flipCD = true;
    } else {
        state.useABCD = false;
        state.onCD = false;
    }

    render();
}

export function setABCDMode(mode) {
    if (isRunning()) {
        return;
    }

    if (mode === 'ab') {
        state.useABCD = true;
        state.flipCD = false;
    } else if (mode === 'cd') {
        state.useABCD = true;
        state.flipCD = true;
    } else {
        state.useABCD = false;
    }

    state.onCD = false;
    render();
}

export function setRoundSeconds(seconds) {
    if (isRunning()) {
        return;
    }

    state.totalSeconds = safeInt(seconds, state.totalSeconds);
    state.pausedElapsedMs = 0;
    render();
}

export function toggleDecimal() {
    if (isRunning()) {
        return;
    }

    state.useDecimal = !state.useDecimal;
    render();
}

export function toggleControls() {
    if (isRunning() && state.shootStarted) {
        return;
    }

    setControlsHidden(!state.controlsHidden);
    render();
}

export function setInversedColors(enabled) {
    state.inversedColors = !!enabled;

    try {
        localStorage.setItem('archeryTimer.themeInversed', state.inversedColors ? '1' : '0');
    } catch {
        // Ignore storage failures.
    }

    render();
}
