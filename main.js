var COLORS = {
    idle: '#f00',
    active: '#0f0',
    low: '#ffa500'
};

var PHASE_CLASS_MAP = {
    prep: 'phase-prep',
    shoot: 'phase-shoot',
    low: 'phase-low'
};

var state = {
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

var dom = {
    body: null,
    timer: null,
    abcd: null,
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
    beep1: null,
    beep2: null,
    beep3: null,
    cease: null,
    startSound: null
};

function readDom() {
    dom.body = document.body;
    dom.timer = document.getElementById('timer');
    dom.abcd = document.getElementById('abcd');
    dom.maintimer = document.getElementById('maintimer');
    dom.controls = document.getElementById('osccontrols');
    dom.startAction = document.getElementById('startAction');
    dom.stopAction = document.getElementById('stopAction');
    dom.toggleColors = document.getElementById('toggleColors');
    dom.prepTime = document.getElementById('prepTime');
    dom.prepFeedback = document.getElementById('prepFeedback');
    dom.volumeSlider = document.getElementById('volumeSlider');
    dom.volumeValue = document.getElementById('volumeValue');
    dom.helpPanel = document.getElementById('helpPanel');
    dom.fullscreenButton = document.getElementById('fullscreenButton');
    dom.optionsButton = document.getElementById('complexPanelButton');
    dom.helpButton = document.getElementById('helpPanelButton');
    dom.beep1 = document.getElementById('beep1');
    dom.beep2 = document.getElementById('beep2');
    dom.beep3 = document.getElementById('beep3');
    dom.cease = document.getElementById('cease');
    dom.startSound = document.getElementById('start');
}

function safeInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPrepSeconds(value) {
    var next = safeInt(value, state.prepSeconds);
    if (next < 3) {
        return 3;
    }
    return next;
}

function updatePrepTimeFromInput(showFeedback) {
    if (!dom.prepTime) {
        return false;
    }

    var raw = String(dom.prepTime.value || '').trim();
    if (raw === '') {
        raw = '20';
    }

    var parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
        showPrepFeedback(getI18NEntry('feedback.prep_invalid') || 'Valeur invalide: minimum 3 secondes.', true);
        dom.prepTime.value = String(state.prepSeconds);
        return false;
    }

    var next = clampPrepSeconds(parsed);
    var changed = next !== state.prepSeconds;
    state.prepSeconds = next;
    dom.prepTime.value = String(state.prepSeconds);

    if (showFeedback) {
        var template = getI18NEntry('feedback.prep_applied') || 'Préparation: {value}s (appliqué)';
        showPrepFeedback(template.replace('{value}', state.prepSeconds), false);
    }

    return changed;
}

function showPrepFeedback(message, isError) {
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
    state.prepFeedbackTimeout = window.setTimeout(function() {
        dom.prepFeedback.classList.remove('prep-feedback-visible');
    }, 1800);
}

function isRunning() {
    return state.intervalId !== -1;
}

function isPaused() {
    return !isRunning() && state.pausedElapsedMs > 0;
}

function getNowMs() {
    return new Date().getTime();
}

function getPrepMs() {
    return state.prepSeconds * 1000;
}

function getShootMs() {
    return state.totalSeconds * 1000;
}

function getRoundMs() {
    return getPrepMs() + getShootMs();
}

function getElapsedMs(nowMs) {
    if (isRunning()) {
        return Math.max(0, nowMs - state.cycleStartMs);
    }
    return Math.max(0, state.pausedElapsedMs);
}

function getPhaseState(elapsedMs) {
    var prepMs = getPrepMs();
    var shootMs = getShootMs();

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
}

function formatTimerValue(ms) {
    if (state.useDecimal) {
        var tenths = Math.max(0, Math.floor(ms / 100));
        var whole = Math.floor(tenths / 10);
        var decimal = tenths % 10;
        return whole + '<small>.' + decimal + '</small>';
    }
    return String(Math.max(0, Math.ceil(ms / 1000)));
}

function getPhaseTone(phaseState) {
    if (phaseState.phase === 'prep') {
        return 'prep';
    }
    if (phaseState.shootRemainingMs <= 20000) {
        return 'low';
    }
    return 'shoot';
}

function getABCDLabel() {
    if (!state.useABCD) {
        return '';
    }

    if (!state.flipCD) {
        return state.onCD ? 'C<br />D' : 'A<br />B';
    }
    return state.onCD ? 'A<br />B' : 'C<br />D';
}

function getPrimaryActionState() {
    if (isRunning()) {
        return 'finish_round';
    }
    if (isPaused()) {
        return 'resume';
    }
    return 'start';
}

function getPrimaryActionLabel() {
    var actionState = getPrimaryActionState();
    if (actionState === 'resume') {
        return getI18NEntry('controls.primary.resume') || 'Reprendre';
    }
    if (actionState === 'finish_round') {
        return getI18NEntry('controls.primary.finish_round') || 'Finir la volée';
    }
    return getI18NEntry('controls.primary.start') || 'Démarrer';
}

function stopSound(sound) {
    if (!sound) {
        return;
    }
    sound.pause();
    sound.currentTime = 0;
}

function stopAllSounds(exceptSound) {
    var sounds = [dom.beep1, dom.beep2, dom.beep3, dom.cease, dom.startSound];
    for (var i = 0; i < sounds.length; i++) {
        if (sounds[i] && sounds[i] !== exceptSound && !sounds[i].paused) {
            stopSound(sounds[i]);
        }
    }
}

function playSound(sound) {
    if (!sound) {
        return;
    }
    stopAllSounds(sound);
    sound.play();
}

function applyVolume() {
    var level = Math.max(0, Math.min(100, state.volumePercent)) / 100;
    var sounds = [dom.beep1, dom.beep2, dom.beep3, dom.cease, dom.startSound];
    for (var i = 0; i < sounds.length; i++) {
        if (sounds[i]) {
            sounds[i].volume = level;
        }
    }
}

function setVolumePercent(value, persist) {
    state.volumePercent = Math.max(0, Math.min(100, safeInt(value, state.volumePercent)));
    applyVolume();

    if (dom.volumeSlider) {
        dom.volumeSlider.value = String(state.volumePercent);
    }
    if (dom.volumeValue) {
        dom.volumeValue.textContent = state.volumePercent + '%';
    }

    if (persist) {
        try {
            localStorage.setItem('archeryTimer.volume', String(state.volumePercent));
        } catch (error) {
            // Ignore storage failures.
        }
    }
}

function setControlsHidden(hidden) {
    state.controlsHidden = hidden;
    if (!dom.body) {
        return;
    }
    dom.body.classList.toggle('controls-hidden', hidden);
}

function syncFlagsFromElapsed(elapsedMs) {
    var prepMs = getPrepMs();
    state.shootStarted = elapsedMs >= prepMs;
    state.lowTimeReached = elapsedMs >= (prepMs + Math.max(0, getShootMs() - 20000));
    state.prepCuePlayed = elapsedMs >= Math.max(0, prepMs - 2000);
}

function applyPhaseClass(element, phaseTone) {
    if (!element) {
        return;
    }
    element.classList.remove(PHASE_CLASS_MAP.prep, PHASE_CLASS_MAP.shoot, PHASE_CLASS_MAP.low);
    element.classList.add(PHASE_CLASS_MAP[phaseTone] || PHASE_CLASS_MAP.prep);
}

function renderTheme(phaseTone) {
    if (!dom.body || !dom.timer) {
        return;
    }

    dom.body.classList.toggle('theme-inversed', state.inversedColors);
    dom.body.classList.toggle('theme-normal', !state.inversedColors);

    applyPhaseClass(dom.body, phaseTone);
    applyPhaseClass(dom.timer, phaseTone);
}

function isFullscreenActive() {
    return !!document.fullscreenElement;
}

function setEmergencyStopLabel(label) {
    if (!dom.stopAction) {
        return;
    }

    var labels = dom.stopAction.querySelectorAll('.stop-label-layer');
    for (var i = 0; i < labels.length; i++) {
        labels[i].textContent = label;
    }

    dom.stopAction.setAttribute('aria-label', label);
    var banner = dom.stopAction.querySelector('.stop-banner');
    if (banner) {
        banner.setAttribute('aria-label', label);
    }
}

function renderActions() {
    if (dom.startAction) {
        dom.startAction.innerHTML = getPrimaryActionLabel();
        dom.startAction.dataset.actionState = getPrimaryActionState();
    }

    if (dom.stopAction) {
        var enabled = isRunning();
        setEmergencyStopLabel(getI18NEntry('controls.emergency_stop') || "Pause d'urgence");
        dom.stopAction.classList.toggle('disabled', !enabled);
        dom.stopAction.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    if (dom.fullscreenButton) {
        var fullscreenLabel = isFullscreenActive()
            ? (getI18NEntry('controls.exit_fullscreen') || 'Quitter le plein écran')
            : (getI18NEntry('controls.fullscreen') || 'Plein écran');
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
        dom.abcd.innerHTML = '<span class="abcd-hint">' + (getI18NEntry('hints.abcd_click') || 'AB/CD') + '</span>';
        return;
    }

    dom.abcd.innerHTML = getABCDLabel();
}

function renderTimer() {
    if (!dom.timer) {
        return;
    }

    if (!isRunning() && state.pausedElapsedMs === 0) {
        dom.timer.innerHTML = state.useDecimal
            ? state.totalSeconds + '<small>.0</small>'
            : String(state.totalSeconds);
        renderTheme('prep');
        return;
    }

    var elapsedMs = getElapsedMs(getNowMs());
    var phaseState = getPhaseState(elapsedMs);
    dom.timer.innerHTML = formatTimerValue(phaseState.phaseRemainingMs);
    renderTheme(getPhaseTone(phaseState));
}

function render() {
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

function startLoop() {
    if (isRunning()) {
        return;
    }
    state.intervalId = window.setInterval(tick, 100);
}

function stopLoop() {
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
    playSound(dom.beep2);
    render();
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
        playSound(dom.beep3);
    }

    render();
}

function tick() {
    var nowMs = getNowMs();
    var elapsedMs = nowMs - state.cycleStartMs;
    var phaseState = getPhaseState(elapsedMs);

    if (!state.prepCuePlayed && phaseState.phase === 'prep' && phaseState.phaseRemainingMs <= 3000 && phaseState.phaseRemainingMs > 2000) {
        state.prepCuePlayed = true;
        playSound(dom.startSound);
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

function startTimer() {
    updatePrepTimeFromInput(false);

    if (isRunning()) {
        if (state.useABCD && !state.onCD) {
            startNextLine();
        } else {
            resetRound(true, true);
        }
        return;
    }

    var resumed = isPaused();
    state.cycleStartMs = getNowMs() - state.pausedElapsedMs;
    syncFlagsFromElapsed(state.pausedElapsedMs);
    state.pausedElapsedMs = 0;

    startLoop();
    if (resumed) {
        playSound(dom.beep1);
    } else {
        playSound(dom.beep2);
    }
    render();
}

function ceaseFire() {
    if (!isRunning()) {
        return;
    }

    state.pausedElapsedMs = Math.max(0, getNowMs() - state.cycleStartMs);
    syncFlagsFromElapsed(state.pausedElapsedMs);
    stopLoop();
    playSound(dom.cease);
    render();
}

function pauseOrResumeTimer() {
    if (isRunning()) {
        ceaseFire();
    } else {
        startTimer();
    }
}

function toggleABCD() {
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

function toggleABCD2(mode) {
    if (isRunning()) {
        return;
    }

    if (mode === '1') {
        state.useABCD = true;
        state.flipCD = false;
    } else if (mode === '2') {
        state.useABCD = true;
        state.flipCD = true;
    } else if (mode === '3') {
        state.useABCD = false;
    }

    state.onCD = false;
    render();
}

function setABCD() {
    if (isRunning()) {
        return;
    }
    state.useABCD = !state.useABCD;
    if (!state.useABCD) {
        state.onCD = false;
    }
    render();
}

function setTime() {
    if (state.controlsHidden || isRunning()) {
        return;
    }

    switch (state.totalSeconds) {
        case 10:
            state.totalSeconds = 20;
            break;
        case 20:
        case 40:
        case 60:
        case 160:
        case 180:
            state.totalSeconds += 20;
            break;
        case 80:
        case 120:
        case 200:
            state.totalSeconds += 40;
            break;
        case 240:
            state.totalSeconds = 10;
            break;
    }

    state.pausedElapsedMs = 0;
    render();
}

function setTime2(time) {
    if (isRunning()) {
        return;
    }

    state.totalSeconds = safeInt(time, state.totalSeconds);
    state.pausedElapsedMs = 0;
    render();
}

function toggleDecimal() {
    if (isRunning()) {
        return;
    }

    state.useDecimal = !state.useDecimal;
    render();
}

function toggleControls() {
    if (isRunning() && state.shootStarted) {
        return;
    }
    setControlsHidden(!state.controlsHidden);
    render();
}

function toggleInversedColors() {
    if (!dom.toggleColors) {
        return;
    }

    state.inversedColors = !!dom.toggleColors.checked;
    try {
        localStorage.setItem('archeryTimer.themeInversed', state.inversedColors ? '1' : '0');
    } catch (error) {
        // Ignore storage failures.
    }

    render();
}

function getI18NEntry(key) {
    var languageArray = i18n[state.language] || i18n.frFR;
    var fr = i18n.frFR;
    return Object.prototype.hasOwnProperty.call(languageArray, key) ? languageArray[key] : fr[key];
}

function replaceI18NPlaceholders(str, node, languageArray, fallbackArray) {
    var replaced = str;
    var tags = replaced.match(/\{%\$?[\w.-]+\}/g);

    while (tags !== null) {
        for (var i = 0; i < tags.length; i++) {
            var naked = tags[i].slice(2, -1).toLowerCase();
            var value = '';

            if (naked.substr(0, 1) === '$') {
                var nestedKey = naked.substring(1);
                value = Object.prototype.hasOwnProperty.call(languageArray, nestedKey) ? languageArray[nestedKey] : fallbackArray[nestedKey];
            } else if (node) {
                value = node.getAttribute('data-i18n-' + naked);
            }

            if (typeof value !== 'string') {
                value = '';
            }
            replaced = replaced.replace(tags[i], value);
        }
        tags = replaced.match(/\{%\$?[\w.-]+\}/g);
    }

    return replaced;
}

function localizeAndContinue(lang) {
    state.language = lang;
    var languageArray = i18n[lang] || i18n.frFR;
    var fr = i18n.frFR;
    var elements = document.querySelectorAll('[data-i18n]');

    for (var i = 0; i < elements.length; i++) {
        var key = elements[i].dataset.i18n;
        var str = Object.prototype.hasOwnProperty.call(languageArray, key) ? languageArray[key] : fr[key];
        if (Array.isArray(str)) {
            str = str[0];
        }
        if (typeof str !== 'string') {
            continue;
        }

        elements[i].innerHTML = replaceI18NPlaceholders(str, elements[i], languageArray, fr);
    }

    try {
        localStorage.setItem('archeryTimer.language', state.language);
    } catch (error) {
        // Ignore storage failures.
    }
}

function getI18NArray() {
    return i18n;
}

function getLanguage() {
    return state.language;
}

function closeCtrlPanel() {
    if (state.ctrlPanelWindow && !state.ctrlPanelWindow.closed) {
        state.ctrlPanelWindow.close();
    }
}

function showCtrlPanel() {
    if (state.ctrlPanelWindow && !state.ctrlPanelWindow.closed) {
        state.ctrlPanelWindow.focus();
        return;
    }

    var opened = window.open('ctrlpanel.html', '_blank', 'height=280,width=650');
    if (!opened) {
        return;
    }

    state.ctrlPanelWindow = opened;

    if (!state.controlsHidden) {
        state.ctrlPanelAutoHidden = true;
        setControlsHidden(true);
    } else {
        state.ctrlPanelAutoHidden = false;
    }
    render();

    if (state.ctrlPanelWindow.addEventListener) {
        state.ctrlPanelWindow.addEventListener('blur', function() {
            closeCtrlPanel();
        });
    }

    var checkClosed = window.setInterval(function() {
        if (!state.ctrlPanelWindow || state.ctrlPanelWindow.closed) {
            window.clearInterval(checkClosed);
            if (state.ctrlPanelAutoHidden) {
                setControlsHidden(false);
                state.ctrlPanelAutoHidden = false;
                render();
            }
        }
    }, 250);
}

function toggleHelpPanel(forceOpen) {
    if (!dom.helpPanel) {
        return;
    }

    var shouldOpen = typeof forceOpen === 'boolean'
        ? forceOpen
        : dom.helpPanel.classList.contains('hidden');

    dom.helpPanel.classList.toggle('hidden', !shouldOpen);
    dom.helpPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
}

function setLanguage(lang) {
    if (!i18n[lang]) {
        return;
    }
    localizeAndContinue(lang);
    render();
}

function getUiSnapshot() {
    return {
        primaryActionState: getPrimaryActionState(),
        primaryActionLabel: getPrimaryActionLabel(),
        emergencyEnabled: isRunning(),
        inversedColors: state.inversedColors,
        language: state.language
    };
}

function toggleFullscreen() {
    var root = document.documentElement;
    if (!isFullscreenActive()) {
        if (root.requestFullscreen) {
            root.requestFullscreen();
        }
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

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

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && canHandleSpacebar(event)) {
        event.preventDefault();
        pauseOrResumeTimer();
        return;
    }

    if (event.code === 'Escape' && dom.helpPanel && !dom.helpPanel.classList.contains('hidden')) {
        toggleHelpPanel(false);
    }
});

window.addEventListener('beforeunload', function() {
    closeCtrlPanel();
});

window.addEventListener('unload', function() {
    closeCtrlPanel();
});

window.addEventListener('fullscreenchange', render);

window.addEventListener('load', function() {
    readDom();

    if (dom.prepTime) {
        if (!dom.prepTime.value) {
            dom.prepTime.value = String(state.prepSeconds);
        }
        updatePrepTimeFromInput(false);
        dom.prepTime.addEventListener('change', function() {
            var changed = updatePrepTimeFromInput(true);
            if (changed || isRunning()) {
                render();
            }
        });
    }

    if (dom.toggleColors) {
        dom.toggleColors.addEventListener('change', toggleInversedColors);
    }

    if (dom.volumeSlider) {
        dom.volumeSlider.addEventListener('input', function() {
            setVolumePercent(dom.volumeSlider.value, true);
        });
    }

    if (dom.fullscreenButton) {
        dom.fullscreenButton.addEventListener('click', function() {
            toggleFullscreen();
        });
    }

    if (dom.helpButton) {
        dom.helpButton.addEventListener('keydown', function(event) {
            if (event.code === 'Escape') {
                toggleHelpPanel(false);
            }
        });
    }

    try {
        var storedLang = localStorage.getItem('archeryTimer.language');
        if (storedLang && i18n[storedLang]) {
            state.language = storedLang;
        } else {
            var browserLang = (navigator.language || 'fr').slice(0, 2).toLowerCase();
            if (Object.prototype.hasOwnProperty.call(defaultLanguage, browserLang)) {
                state.language = defaultLanguage[browserLang];
            }
        }

        state.inversedColors = localStorage.getItem('archeryTimer.themeInversed') === '1';
        var storedVolume = safeInt(localStorage.getItem('archeryTimer.volume'), state.volumePercent);
        state.volumePercent = Math.max(0, Math.min(100, storedVolume));
    } catch (error) {
        // Ignore storage failures.
    }

    setVolumePercent(state.volumePercent, false);
    setControlsHidden(state.controlsHidden);
    localizeAndContinue(state.language);
    toggleABCD2('3');

    if (dom.toggleColors) {
        dom.toggleColors.checked = state.inversedColors;
    }

    render();
});

window.startTimer = startTimer;
window.ceaseFire = ceaseFire;
window.pauseOrResumeTimer = pauseOrResumeTimer;
window.toggleABCD = toggleABCD;
window.toggleABCD2 = toggleABCD2;
window.setABCD = setABCD;
window.setTime = setTime;
window.setTime2 = setTime2;
window.toggleDecimal = toggleDecimal;
window.toggleControls = toggleControls;
window.toggleInversedColors = toggleInversedColors;
window.localizeAndContinue = localizeAndContinue;
window.getI18NEntry = getI18NEntry;
window.getI18NArray = getI18NArray;
window.getLanguage = getLanguage;
window.showCtrlPanel = showCtrlPanel;
window.toggleHelpPanel = toggleHelpPanel;
window.setLanguage = setLanguage;
window.getUiSnapshot = getUiSnapshot;
window.toggleFullscreen = toggleFullscreen;
