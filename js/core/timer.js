(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var dom = app.dom;
    var audio = app.core.audio;
    var render = app.core.render;
    var timer = app.core.timer || {};

    function syncFlagsFromElapsed(elapsedMs) {
        var prepMs = state.getPrepMs();

        state.shootStarted = elapsedMs >= prepMs;
        state.lowTimeReached = elapsedMs >= (prepMs + Math.max(0, state.getShootMs() - 20000));
        state.prepCuePlayed = elapsedMs >= Math.max(0, prepMs - 2000);
    }

    function startLoop() {
        if (state.isRunning()) {
            return;
        }

        state.intervalId = window.setInterval(tick, 100);
    }

    function stopLoop() {
        if (!state.isRunning()) {
            return;
        }

        window.clearInterval(state.intervalId);
        state.intervalId = -1;
    }

    function startNextLine() {
        state.onCD = true;
        state.cycleStartMs = state.getNowMs();
        state.pausedElapsedMs = 0;
        state.shootStarted = false;
        state.lowTimeReached = false;
        state.prepCuePlayed = false;
        audio.play(dom.beep2);
        render.render();
    }

    function resetRound(playTone, flipSides) {
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
            audio.play(dom.beep3);
        }

        render.render();
    }

    function tick() {
        var nowMs = state.getNowMs();
        var elapsedMs = nowMs - state.cycleStartMs;
        var phaseState = state.getPhaseState(elapsedMs);

        if (!state.prepCuePlayed && phaseState.phase === 'prep' && phaseState.phaseRemainingMs <= 3000 && phaseState.phaseRemainingMs > 2000) {
            state.prepCuePlayed = true;
            audio.play(dom.startSound);
        }

        if (!state.shootStarted && phaseState.phase === 'shoot') {
            state.shootStarted = true;
        }

        if (!state.lowTimeReached && phaseState.phase === 'shoot' && phaseState.shootRemainingMs <= 20000) {
            state.lowTimeReached = true;
        }

        if (elapsedMs >= state.getRoundMs()) {
            if (state.useABCD && !state.onCD) {
                startNextLine();
            } else {
                resetRound(true, true);
            }
            return;
        }

        render.render();
    }

    function startTimer() {
        render.updatePrepTimeFromInput(false);

        if (state.isRunning()) {
            if (state.useABCD && !state.onCD) {
                startNextLine();
            } else {
                resetRound(true, true);
            }
            return;
        }

        var resumed = state.isPaused();
        state.cycleStartMs = state.getNowMs() - state.pausedElapsedMs;
        syncFlagsFromElapsed(state.pausedElapsedMs);
        state.pausedElapsedMs = 0;

        startLoop();
        if (resumed) {
            audio.play(dom.beep1);
        } else {
            audio.play(dom.beep2);
        }

        render.render();
    }

    function ceaseFire() {
        if (!state.isRunning()) {
            return;
        }

        state.pausedElapsedMs = Math.max(0, state.getNowMs() - state.cycleStartMs);
        syncFlagsFromElapsed(state.pausedElapsedMs);
        stopLoop();
        audio.play(dom.cease);
        render.render();
    }

    function pauseOrResumeTimer() {
        if (state.isRunning()) {
            ceaseFire();
            return;
        }

        startTimer();
    }

    function cycleABCDMode() {
        if (state.controlsHidden || state.isRunning()) {
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

        render.render();
    }

    function setABCDMode(mode) {
        if (state.isRunning()) {
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
        render.render();
    }

    function setRoundSeconds(seconds) {
        if (state.isRunning()) {
            return;
        }

        state.totalSeconds = state.safeInt(seconds, state.totalSeconds);
        state.pausedElapsedMs = 0;
        render.render();
    }

    function toggleDecimal() {
        if (state.isRunning()) {
            return;
        }

        state.useDecimal = !state.useDecimal;
        render.render();
    }

    function toggleControls() {
        if (state.isRunning() && state.shootStarted) {
            return;
        }

        render.setControlsHidden(!state.controlsHidden);
        render.render();
    }

    function setInversedColors(enabled) {
        state.inversedColors = !!enabled;

        try {
            localStorage.setItem('archeryTimer.themeInversed', state.inversedColors ? '1' : '0');
        } catch (error) {
            // Ignore storage failures.
        }

        render.render();
    }

    timer.startLoop = startLoop;
    timer.stopLoop = stopLoop;
    timer.startTimer = startTimer;
    timer.ceaseFire = ceaseFire;
    timer.pauseOrResumeTimer = pauseOrResumeTimer;
    timer.cycleABCDMode = cycleABCDMode;
    timer.setABCDMode = setABCDMode;
    timer.setRoundSeconds = setRoundSeconds;
    timer.toggleDecimal = toggleDecimal;
    timer.toggleControls = toggleControls;
    timer.setInversedColors = setInversedColors;
    timer.resetRound = resetRound;
    timer.tick = tick;

    app.core.timer = timer;
})(window);
