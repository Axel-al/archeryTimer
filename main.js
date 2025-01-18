var beep1;
var beep2;
var beep3;
var cease;
var startSound; // Ajoutez cette ligne

var body;
var timer;
var abcd;

var ival = -1;
var start = -1;
var total = 120;
var started = false;
var lowtime = false;
var timediff = 0;

var useabcd = true;
var oncd = false;
var flipcd = false;
var usedecimal = false;
var overlayhidden = true;

var ctrlhidden = false;
var language = "frFR";

var inversedColors = false;
var ctrlPanelWindow = null;

window.addEventListener('load', function(e) {
    if (typeof window.applicationCache != 'undefined') {
        window.applicationCache.addEventListener('updateready', function(e2) {
            if (window.applicationCache.status == window.applicationCache.UPDATEREADY && !overlayhidden) {
                if (confirm('The archery timer software has been updated! Open latest version?')) {
                    window.location.reload();
                }
            }
        }, false);
    }
}, false);

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        pauseOrResumeTimer();
    }
});

function localizeAndContinue(lang) {
    language = lang;
    var larr = i18n[lang];
    var enus = i18n["frFR"];
    var earr = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < earr.length; i++) {
        var uuid = earr[i].dataset.i18n;
        var str = (larr.hasOwnProperty(uuid) ? larr[uuid] : enus[uuid]);
        var tag = str.match(/\{%\$?[\w\-]+\}/g);
        while (tag != null) {
            for (var j = 0; j < tag.length; j++) {
                var tagnaked = tag[j].slice(2, -1).toLowerCase();
                str = str.replace(tag[j], (tagnaked.substr(0, 1) == "$" ? (larr.hasOwnProperty(tagnaked.substring(1)) ? larr[tagnaked.substring(1)] : enus[tagnaked.substring(1)]) : earr[i].getAttribute("data-i18n-" + tagnaked)));
            }
            tag = str.match(/\{%\$?[\w\-]+\}/g);
        }
        earr[i].innerHTML = str;
    }
    hideOverlay('welcome');
}

function getI18NEntry(uuid) {
    var larr = i18n[language];
    var enus = i18n["frFR"];
    return (larr.hasOwnProperty(uuid) ? larr[uuid] : enus[uuid]);
}

function getI18NArray() {
    return i18n;
}

function getLanguage() {
    return language;
}

function hideOverlay(eid) {
    overlayhidden = true;
    var opacity = 1;
    var overlay = document.getElementById(eid);
    var hidetimer = setInterval(function () {
        if (opacity <= 0.0){
            clearInterval(hidetimer);
            overlay.style.display = 'none';
        }
        overlay.style.opacity = opacity;
        overlay.style.filter = 'alpha(opacity=' + opacity * 100 + ")";
        opacity -= 0.05;
    }, 25);
}

function showCtrlPanel() {
    if (ctrlPanelWindow == null || ctrlPanelWindow.closed) {
        ctrlPanelWindow = window.open('ctrlpanel.html', '_blank', 'height=280,width=650');
        hideOverlay('overlay');
        hideOverlay('github-fork');
        toggleControls();
        
        // Ajouter un intervalle pour vérifier si la fenêtre est fermée
        var checkCtrlPanelClosed = setInterval(function() {
            if (ctrlPanelWindow.closed) {
                clearInterval(checkCtrlPanelClosed);
                toggleControls();
            }
        }, 250);
    } else {
        ctrlPanelWindow.focus();
    }
}

// Fermer le popup ctrlpanel si la page principale est actualisée ou fermée
window.addEventListener('beforeunload', function() {
    if (ctrlPanelWindow && !ctrlPanelWindow.closed) {
        ctrlPanelWindow.close();
    }
});

window.addEventListener('unload', function() {
    if (ctrlPanelWindow && !ctrlPanelWindow.closed) {
        ctrlPanelWindow.close();
    }
});

function toggleControls() {
    if (started) return;
    if (ctrlhidden) {
        ctrlhidden = false;
        document.getElementById("osccontrols").style.display = "block";
        var maintimer = document.getElementById("maintimer");
        maintimer.style.position = "relative";
        maintimer.style.top = "";
        maintimer.style.transform = "";
    } else {
        ctrlhidden = true;
        document.getElementById("osccontrols").style.display = "none";
        var maintimer = document.getElementById("maintimer");
        maintimer.style.position = "fixed";
        maintimer.style.top = "50%";
        maintimer.style.transform = "translateY(-50%)";
    }
}

function stopSound(sound) {
    sound.pause();
    sound.currentTime = 0;
}

function stopAllSounds(sound) {
    if (sound != beep1 && !beep1.paused) {
        stopSound(beep1);
    }
    if (sound != beep2 && !beep2.paused) {
        stopSound(beep2);
    }
    if (sound != beep3 && !beep3.paused) {
        stopSound(beep3);
    }
    if (sound != cease && !cease.paused) {
        stopSound(cease);
    }
    if (sound != startSound && !startSound.paused) {
        stopSound(startSound);
    }
}

function startTimer() {
    if (ival == -1) {
        start = new Date().getTime() - timediff;
        var resumed = timediff != 0;
        timediff = 0;
        ival = setInterval(function() {
            var prepTime = document.getElementById('prepTime').value;
            prepTime = (prepTime == "" ? 20 : parseInt(prepTime));
            var now = new Date().getTime();
            var timeRemaining = (prepTime * 1000) - (now - start);

            if (timeRemaining <= 3000 && timeRemaining > 2000 && !started) {
                stopAllSounds(startSound);
                startSound.play(); // Joue le son start.mp3
            }

            if (now - start >= (1000 * prepTime) && !started) {
                started = true;
                if (!inversedColors) {
                    timer.style.color = '#0F0';
                } else {
                    body.style.backgroundColor = '#0F0';
                }
                beep1.play();
            }
            if (started && now - start >= (total * 1000) - 20000 && !lowtime) {
                lowtime = true;
                if (!inversedColors) {
                    timer.style.color = '#ffa500';
                } else {
                    body.style.backgroundColor = '#ffa500';
                }
            }
            var tds = (now - start < (prepTime * 1000) ? (prepTime - 1) : total + (prepTime - 1)) - Math.floor((now - start) / 1000);
            var tdd = 9 - Math.floor(((now - start) / 100) % 10);
            timer.innerHTML = (usedecimal ? tds + '<small>.' + tdd + '</small>' : (tds + 1));
            if (now - start >= (total * 1000) + (prepTime * 1000)) {
                if (useabcd && !oncd) {
                    started = false;
                    lowtime = false;
                    oncd = true;
                    start = new Date().getTime() - 100;
                    if (!inversedColors) {
                        timer.style.color = '#f00';
                    } else {
                        body.style.backgroundColor = '#f00';
                    }
                    timer.innerHTML = (usedecimal ? '9<small>.9</small>' : '10');
                    abcd.innerHTML = (flipcd ? 'A<br />B' : 'C<br />D');
                    stopAllSounds(beep2);
                    beep2.play();
                } else {
                    reset(true);
                }
            }
        }, 100);
        if (!resumed) {
            stopAllSounds(beep2);
            beep2.play();
        }
    } else {
        if (useabcd && !oncd) {
            started = false;
            lowtime = false;
            oncd = true;
            start = new Date().getTime() - 100;
            if (!inversedColors) {
                timer.style.color = '#f00';
            } else {
                body.style.backgroundColor = '#f00';
            }
            timer.innerHTML = (usedecimal ? '9<small>.9</small>' : '10');
            abcd.innerHTML = (flipcd ? 'A<br />B' : 'C<br />D');
            stopAllSounds(beep2);
            beep2.play();
        } else {
            reset(true);
        }
    }
}

function reset(play) {
    clearInterval(ival);
    ival = -1;
    started = false;
    lowtime = false;
    oncd = false;
    if (!inversedColors) {
        timer.style.color = '#f00';
    } else {
        body.style.backgroundColor = '#f00';
    }
    flipcd = !flipcd;
    if (play) {
        timer.innerHTML = (usedecimal ? total + '<small>.0</small>' : total);
        stopAllSounds(beep3);
        beep3.play();
    }
}

function toggleABCD() {
    if (ctrlhidden) return;
    if (ival == -1) {
        if (useabcd && !flipcd) {
            flipcd = true;
            abcd.innerHTML = 'C<br />D';
        } else if (!useabcd) {
            setABCD();
            flipcd = false;
            abcd.innerHTML = 'A<br />B';
        } else {
            setABCD();
        }
    }
}

function toggleABCD2(mode) {
    if (ival == -1) {
        if (mode == '1') {
            useabcd = true;
            flipcd = false;
            abcd.innerHTML = 'A<br />B';
            abcd.style.display = 'block';
        } else if (mode == '2') {
            useabcd = true;
            flipcd = true;
            abcd.innerHTML = 'C<br />D';
            abcd.style.display = 'block';
        } else if (mode == '3') {
            useabcd = false;
            abcd.style.display = 'none';
        }
    }
}

function setABCD() {
    if (ival == -1) {
        useabcd = !useabcd;
        abcd.style.display = (useabcd ? 'block' : 'none');
    }
}

function setTime() {
    if (ctrlhidden) return;
    if (ival == -1) {
        switch (total) {
            case 10:
                total = 20;
                break;
            case 20:
            case 40:
            case 60:
            case 160:
            case 180:
                total += 20;
                break;
            case 80:
            case 120:
            case 200:
                total += 40;
                break;
            case 240:
                total = 10;
                break;
        }
        timer.innerHTML = (usedecimal ? total + '<small>.0</small>' : total);
    }
}

function setTime2(time) {
    if (ival == -1) {
        timediff = 0;
        total = time;
        timer.innerHTML = (usedecimal ? total + '<small>.0</small>' : total);
    }
}

function toggleDecimal() {
    if (ival == -1) {
        usedecimal = !usedecimal;
        timer.innerHTML = (usedecimal ? total + '<small>.0</small>' : total);
    }
}

function ceaseFire() {
    if (timediff == 0) {
        reset(false);
        timediff = new Date().getTime() - start;
        stopAllSounds(cease);
        cease.play();
    }
}

function pauseOrResumeTimer() {
    if (ival === -1) {
        startTimer();
    } else {
        ceaseFire();
    }
}

function toggleInversedColors() {
    inversedColors = document.getElementById('toggleColors').checked;
    body = document.getElementsByTagName('body')[0];
    if (inversedColors) {
        body.style.backgroundColor = "red";
        timer.style.color = "black";
        document.getElementsByClassName('config')[0].getElementsByTagName('a')[0].style.color = "#AAA";
        document.getElementsByClassName('egcy')[0].style.color = "#333";
        
    } else {
        body.style.backgroundColor = "black";
        timer.style.color = "red";
        document.getElementsByClassName('config')[0].getElementsByTagName('a')[0].style.color = "";
        document.getElementsByClassName('egcy')[0].style.color = "";
    }
    document.getElementsByClassName('egcy')[0].addEventListener('mouseover', function() {
        if (inversedColors) {
            this.style.cssText = "color: black !important";
        }
    });
    document.getElementsByClassName('egcy')[0].addEventListener('mouseout', function() {
        if (inversedColors) {
            this.style.color = "#333";
        }
    });
}

window.addEventListener("load", () => {
    console.log("loaded");
    localizeAndContinue('frFR');
    hideOverlay('audsyncwarn');
    hideOverlay('overlay');
    hideOverlay('github-fork');
    toggleABCD2(3);
    startSound = document.getElementById('start'); // Ajoutez cette ligne
});