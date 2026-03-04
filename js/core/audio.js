import { state, dom, safeInt } from '/js/core/state.js';

function sounds() {
    return [dom.beep1, dom.beep2, dom.beep3, dom.cease, dom.startSound];
}

export function stop(sound) {
    if (!sound) {
        return;
    }

    sound.pause();
    sound.currentTime = 0;
}

export function stopAll(exceptSound) {
    for (const sound of sounds()) {
        if (sound && sound !== exceptSound && !sound.paused) {
            stop(sound);
        }
    }
}

export function play(sound) {
    if (!sound) {
        return;
    }

    stopAll(sound);
    sound.play();
}

export function applyVolume() {
    const level = Math.max(0, Math.min(100, state.volumePercent)) / 100;

    for (const sound of sounds()) {
        if (sound) {
            sound.volume = level;
        }
    }
}

export function setVolumePercent(value, persist) {
    state.volumePercent = Math.max(0, Math.min(100, safeInt(value, state.volumePercent)));
    applyVolume();

    if (dom.volumeSlider) {
        dom.volumeSlider.value = String(state.volumePercent);
    }
    if (dom.volumeValue) {
        dom.volumeValue.textContent = `${state.volumePercent}%`;
    }

    if (persist) {
        try {
            localStorage.setItem('archeryTimer.volume', String(state.volumePercent));
        } catch {
            // Ignore storage failures.
        }
    }
}
