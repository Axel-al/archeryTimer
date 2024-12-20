/*
A faire :
    enlever abcd par défaut
    proposer d'inverser les couleurs
    essayer de centrer temps
    controler avec barre espace pour faire pause ou reprende depuis écran classique et depuis advance panel
    mettre un bouton un bas a gauche ou a droite pour acceder a advance panel si pas affiché
*/

var beep1;
var beep2;
var beep3;
var cease;

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
var usedecimal = true;
var overlayhidden = false;

var ctrlhidden = false;
var language = getNavigatorLanguage();

let ctrlPanelWindow = null;

document.addEventListener("DOMContentLoaded", () => {
    var tempLanguage = localStorage.getItem("language");
    if (i18n.hasOwnProperty(tempLanguage)) {
        localizeAndContinue(tempLanguage);
    } else {
        return;
    } if (localStorage.getItem("audsyncwarn") == "true") {
        hideOverlay('audsyncwarn');
    } else {
        return;
    } if (localStorage.getItem("sowCtrlPanel") == "true") {
        showCtrlPanel();
    } else if (localStorage.getItem("overlay") == "true") {
        hideOverlay('overlay');
    }
});

window.addEventListener("beforeunload", () => {
    if (ctrlPanelWindow && !ctrlPanelWindow.closed) {
        ctrlPanelWindow.close();
    }
});

function getNavigatorLanguage() {
    const navigatorLanguageArray = navigator.language.split("-");
    const navigatorLanguage = navigatorLanguageArray.join("");
    if (defaultLanguage.hasOwnProperty(navigatorLanguageArray[0])) {
        if ((navigatorLanguageArray.length == 2) && getI18NArray().hasOwnProperty(navigatorLanguage)) {
            return navigatorLanguage;
        }
        else {
            return defaultLanguage[navigatorLanguage];
        }
    }
    else {
        return "enUS";
    }
}

function localizeAndContinue(lang) {
    language = lang;
    localStorage.setItem("language", language);
    var earr = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < earr.length; i++) {
        var uuid = earr[i].dataset.i18n;
        var str = getI18NEntry(uuid);
        var tag = str.match(/\{%\$?[\w\-]+\}/g);
        while (tag != null) {
            for (var j = 0; j < tag.length; j++) {
                var tagnaked = tag[j].slice(2, -1).toLowerCase();
                str = str.replace(tag[j], (tagnaked.substring(0, 1) == "$" ? getI18NEntry(tagnaked.substring(1)) : earr[i].getAttribute("data-i18n-" + tagnaked)));
            }
            tag = str.match(/\{%\$?[\w\-]+\}/g);
        }
        earr[i].innerHTML = str;
    }
    hideOverlay('welcome');
}

function getI18NEntry(uuid) {
    var larr = getI18NArray()[getLanguage()];
    var enus = getI18NArray()["enUS"];
    return (larr.hasOwnProperty(uuid) ? larr[uuid] : enus[uuid]);
}

function getI18NArray() {
    return i18n;
}

function getLanguage() {
    return language;
}

function getCtrlHidden() {
    return ctrlhidden;
}

function hideOverlay(eid) {
    localStorage.setItem(eid, "true");
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
    ctrlPanelWindow = window.open('ctrlpanel.html', '_blank', 'height=290,width=650');
    hideOverlay('overlay');
    toggleControls();
}

function toggleControls() {
    if (started) return;
    if (ctrlhidden) {
        localStorage.setItem("sowCtrlPanel", "false");
        localStorage.setItem("overlay", "true");
        ctrlhidden = false;
        document.getElementById("osccontrols").style.display = "block";
        var maintimer = document.getElementById("maintimer");
        maintimer.style.position = "relative";
        maintimer.style.top = "";
        maintimer.style.transform = "";
    } else {
        localStorage.setItem("sowCtrlPanel", "true");
        localStorage.setItem("overlay", "false");
        ctrlhidden = true;
        document.getElementById("osccontrols").style.display = "none";
        var maintimer = document.getElementById("maintimer");
        maintimer.style.position = "fixed";
        maintimer.style.top = "50%";
        maintimer.style.transform = "translateY(-50%)";
    }
}

function startTimer() {
    if (ival == -1) {
        start = new Date().getTime() - timediff;
        var resumed = timediff != 0;
        timediff = 0;
        ival = setInterval(function() {
            var now = new Date().getTime();
            if (now - start >= 10000 && !started) {
                started = true;
                timer.style.color = '#0F0';
                beep1.play();
            }
            if (started && now - start >= (total * 1000) - 20000 && !lowtime) {
                lowtime = true;
                timer.style.color = '#ffa500';
            }
            var tds = (now - start < 10000 ? 9 : total + 9) - Math.floor((now - start) / 1000);
            var tdd = 9 - Math.floor(((now - start) / 100) % 10);
            timer.innerHTML = (usedecimal ? tds + '<small>.' + tdd + '</small>' : (tds + 1));
            if (now - start >= (total * 1000) + 10000) {
                if (useabcd && !oncd) {
                    started = false;
                    lowtime = false;
                    oncd = true;
                    start = new Date().getTime() - 100;
                    timer.style.color = '#f00';
                    timer.innerHTML = (usedecimal ? '9<small>.9</small>' : '10');
                    abcd.innerHTML = (flipcd ? 'A<br />B' : 'C<br />D');
                    beep2.play();
                } else {
                    reset(true);
                }
            }
        }, 100);
        if (!resumed) {
            beep2.play();
        }
    } else {
        if (useabcd && !oncd) {
            started = false;
            lowtime = false;
            oncd = true;
            start = new Date().getTime() - 100;
            timer.style.color = '#f00';
            timer.innerHTML = (usedecimal ? '9<small>.9</small>' : '10');
            abcd.innerHTML = (flipcd ? 'A<br />B' : 'C<br />D');
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
    timer.style.color = '#f00';
    flipcd = !flipcd;
    if (play) {
        timer.innerHTML = (usedecimal ? total + '<small>.0</small>' : total);
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
        cease.play();
    }
}
