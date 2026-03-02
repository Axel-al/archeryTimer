(function(window) {
    var app = window.ArcheryTimer;
    var state = app.state;
    var dom = app.dom;
    var audio = app.core.audio || {};

    function stop(sound) {
        if (!sound) {
            return;
        }
        sound.pause();
        sound.currentTime = 0;
    }

    function stopAll(exceptSound) {
        var sounds = [dom.beep1, dom.beep2, dom.beep3, dom.cease, dom.startSound];

        for (var i = 0; i < sounds.length; i++) {
            if (sounds[i] && sounds[i] !== exceptSound && !sounds[i].paused) {
                stop(sounds[i]);
            }
        }
    }

    function play(sound) {
        if (!sound) {
            return;
        }

        stopAll(sound);
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
        state.volumePercent = Math.max(0, Math.min(100, state.safeInt(value, state.volumePercent)));
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

    audio.stop = stop;
    audio.stopAll = stopAll;
    audio.play = play;
    audio.applyVolume = applyVolume;
    audio.setVolumePercent = setVolumePercent;

    app.core.audio = audio;
})(window);
