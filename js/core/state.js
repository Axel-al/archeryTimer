(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var dom = app.dom;

    state.COLORS = {
        idle: '#f00',
        active: '#0f0',
        low: '#ffa500'
    };

    state.PHASE_CLASS_MAP = {
        prep: 'phase-prep',
        shoot: 'phase-shoot',
        low: 'phase-low'
    };

    state.intervalId = -1;
    state.cycleStartMs = 0;
    state.pausedElapsedMs = 0;
    state.totalSeconds = 120;
    state.prepSeconds = 20;
    state.useABCD = false;
    state.onCD = false;
    state.flipCD = false;
    state.useDecimal = false;
    state.controlsHidden = false;
    state.language = 'frFR';
    state.inversedColors = false;
    state.shootStarted = false;
    state.lowTimeReached = false;
    state.prepCuePlayed = false;
    state.volumePercent = 100;
    state.prepFeedbackTimeout = null;
    state.ctrlPanelWindow = null;
    state.ctrlPanelAutoHidden = false;

    state.readMainDom = function(root) {
        var scope = root || document;

        dom.body = document.body;
        dom.timer = scope.getElementById('timer');
        dom.abcd = scope.getElementById('abcd');
        dom.abcdToggle = scope.getElementById('abcdToggle');
        dom.maintimer = scope.getElementById('maintimer');
        dom.controls = scope.getElementById('osccontrols');
        dom.startAction = scope.getElementById('startAction');
        dom.stopAction = scope.getElementById('stopAction');
        dom.toggleColors = scope.getElementById('toggleColors');
        dom.prepTime = scope.getElementById('prepTime');
        dom.prepFeedback = scope.getElementById('prepFeedback');
        dom.volumeSlider = scope.getElementById('volumeSlider');
        dom.volumeValue = scope.getElementById('volumeValue');
        dom.helpPanel = scope.getElementById('helpPanel');
        dom.fullscreenButton = scope.getElementById('fullscreenButton');
        dom.optionsButton = scope.getElementById('complexPanelButton');
        dom.helpButton = scope.getElementById('helpPanelButton');
        dom.helpClose = scope.getElementById('helpCloseButton');
        dom.languageButtons = scope.querySelectorAll('[data-language]');
        dom.beep1 = scope.getElementById('beep1');
        dom.beep2 = scope.getElementById('beep2');
        dom.beep3 = scope.getElementById('beep3');
        dom.cease = scope.getElementById('cease');
        dom.startSound = scope.getElementById('start');
    };

    state.safeInt = function(value, fallback) {
        var parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    state.clampPrepSeconds = function(value) {
        var next = state.safeInt(value, state.prepSeconds);
        if (next < 3) {
            return 3;
        }
        return next;
    };

    state.isRunning = function() {
        return state.intervalId !== -1;
    };

    state.isPaused = function() {
        return !state.isRunning() && state.pausedElapsedMs > 0;
    };

    state.getNowMs = function() {
        return new Date().getTime();
    };

    state.getPrepMs = function() {
        return state.prepSeconds * 1000;
    };

    state.getShootMs = function() {
        return state.totalSeconds * 1000;
    };

    state.getRoundMs = function() {
        return state.getPrepMs() + state.getShootMs();
    };

    state.getElapsedMs = function(nowMs) {
        if (state.isRunning()) {
            return Math.max(0, nowMs - state.cycleStartMs);
        }
        return Math.max(0, state.pausedElapsedMs);
    };

    state.getPhaseState = function(elapsedMs) {
        var prepMs = state.getPrepMs();
        var shootMs = state.getShootMs();

        if (elapsedMs < prepMs) {
            return {
                phase: 'prep',
                phaseElapsedMs: elapsedMs,
                phaseRemainingMs: prepMs - elapsedMs,
                shootElapsedMs: 0,
                shootRemainingMs: shootMs
            };
        }

        var shootElapsedMs = elapsedMs - prepMs;
        var shootRemainingMs = Math.max(0, shootMs - shootElapsedMs);

        return {
            phase: 'shoot',
            phaseElapsedMs: shootElapsedMs,
            phaseRemainingMs: shootRemainingMs,
            shootElapsedMs: shootElapsedMs,
            shootRemainingMs: shootRemainingMs
        };
    };

    state.getPhaseTone = function(phaseState) {
        if (phaseState.phase === 'prep') {
            return 'prep';
        }
        if (phaseState.shootRemainingMs <= 20000) {
            return 'low';
        }
        return 'shoot';
    };

    state.getABCDMode = function() {
        if (!state.useABCD) {
            return 'all';
        }
        return state.flipCD ? 'cd' : 'ab';
    };

    state.getABCDLabel = function() {
        if (!state.useABCD) {
            return '';
        }

        if (!state.flipCD) {
            return state.onCD ? 'C<br />D' : 'A<br />B';
        }
        return state.onCD ? 'A<br />B' : 'C<br />D';
    };
})(window);
