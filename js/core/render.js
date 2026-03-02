(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var dom = app.dom;
    var i18nRuntime = app.core.i18n;
    var render = app.core.render || {};

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
            showPrepFeedback(i18nRuntime.getEntry('feedback.prep_invalid') || 'Valeur invalide: minimum 3 secondes.', true);
            dom.prepTime.value = String(state.prepSeconds);
            return false;
        }

        var next = state.clampPrepSeconds(parsed);
        var changed = next !== state.prepSeconds;
        state.prepSeconds = next;
        dom.prepTime.value = String(state.prepSeconds);

        if (showFeedback) {
            var template = i18nRuntime.getEntry('feedback.prep_applied') || 'Préparation: {value}s (appliqué)';
            showPrepFeedback(template.replace('{value}', state.prepSeconds), false);
        }

        return changed;
    }

    function setControlsHidden(hidden) {
        state.controlsHidden = !!hidden;

        if (!dom.body) {
            return;
        }

        dom.body.classList.toggle('controls-hidden', state.controlsHidden);
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

    function applyPhaseClass(element, phaseTone) {
        if (!element) {
            return;
        }

        element.classList.remove(state.PHASE_CLASS_MAP.prep, state.PHASE_CLASS_MAP.shoot, state.PHASE_CLASS_MAP.low);
        element.classList.add(state.PHASE_CLASS_MAP[phaseTone] || state.PHASE_CLASS_MAP.prep);
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

    function toggleFullscreen() {
        var root = document.documentElement;

        if (!isFullscreenActive()) {
            if (root.requestFullscreen) {
                root.requestFullscreen();
            }
            return;
        }

        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
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

    function getPrimaryActionState() {
        if (state.isRunning()) {
            return 'finish_round';
        }
        if (state.isPaused()) {
            return 'resume';
        }
        return 'start';
    }

    function getPrimaryActionLabel() {
        var actionState = getPrimaryActionState();

        if (actionState === 'resume') {
            return i18nRuntime.getEntry('controls.primary.resume') || 'Reprendre';
        }
        if (actionState === 'finish_round') {
            return i18nRuntime.getEntry('controls.primary.finish_round') || 'Finir la volée';
        }
        return i18nRuntime.getEntry('controls.primary.start') || 'Démarrer';
    }

    function renderActions() {
        if (dom.startAction) {
            dom.startAction.innerHTML = getPrimaryActionLabel();
            dom.startAction.dataset.actionState = getPrimaryActionState();
        }

        if (dom.stopAction) {
            var enabled = state.isRunning();
            setEmergencyStopLabel(i18nRuntime.getEntry('controls.emergency_stop') || "Pause d'urgence");
            dom.stopAction.classList.toggle('disabled', !enabled);
            dom.stopAction.setAttribute('aria-disabled', enabled ? 'false' : 'true');
        }

        if (dom.fullscreenButton) {
            var fullscreenLabel = isFullscreenActive()
                ? (i18nRuntime.getEntry('controls.exit_fullscreen') || 'Quitter le plein écran')
                : (i18nRuntime.getEntry('controls.fullscreen') || 'Plein écran');

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
            dom.abcd.innerHTML = '<span class="abcd-hint">' + (i18nRuntime.getEntry('hints.abcd_click') || 'AB/CD') + '</span>';
            return;
        }

        dom.abcd.innerHTML = state.getABCDLabel();
    }

    function renderTimer() {
        if (!dom.timer) {
            return;
        }

        if (!state.isRunning() && state.pausedElapsedMs === 0) {
            dom.timer.innerHTML = state.useDecimal
                ? state.totalSeconds + '<small>.0</small>'
                : String(state.totalSeconds);
            renderTheme('prep');
            return;
        }

        var elapsedMs = state.getElapsedMs(state.getNowMs());
        var phaseState = state.getPhaseState(elapsedMs);
        dom.timer.innerHTML = formatTimerValue(phaseState.phaseRemainingMs);
        renderTheme(state.getPhaseTone(phaseState));
    }

    function renderAll() {
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

    function getSnapshot() {
        return {
            primaryActionState: getPrimaryActionState(),
            primaryActionLabel: getPrimaryActionLabel(),
            emergencyEnabled: state.isRunning(),
            inversedColors: state.inversedColors,
            language: state.language,
            controlsHidden: state.controlsHidden,
            roundSeconds: state.totalSeconds,
            prepSeconds: state.prepSeconds,
            abcdMode: state.getABCDMode()
        };
    }

    render.showPrepFeedback = showPrepFeedback;
    render.updatePrepTimeFromInput = updatePrepTimeFromInput;
    render.setControlsHidden = setControlsHidden;
    render.renderTheme = renderTheme;
    render.getPrimaryActionState = getPrimaryActionState;
    render.getPrimaryActionLabel = getPrimaryActionLabel;
    render.render = renderAll;
    render.getSnapshot = getSnapshot;
    render.isFullscreenActive = isFullscreenActive;
    render.toggleFullscreen = toggleFullscreen;

    app.core.render = render;
})(window);
