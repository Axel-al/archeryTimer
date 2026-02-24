/*
GUIDE FOR TRANSLATORS:
-----------------------------------
Lines starting with double forward slashes are COMMENTS. These are there to
aid you as a translator, and are not displayed on any part of the timer,
hence they should not be translated.

All translatable lines use human-readable keys in dot notation
(example: "controls.primary.start"). These keys are used by the timer software
and must not be altered.

Some lines contain placeholders. Placeholders take the form {%Something} or
{%$some.translation.key}. Keep placeholders intact and only translate the
surrounding text.
*/

var i18n = {
    enUS: {
        // Main controls on the timer display
        "controls.primary.start": "Start",
        "controls.primary.resume": "Resume",
        "controls.primary.finish_round": "Finish round",
        "controls.emergency_stop": "Emergency stop",
        "controls.invert_colors": "Invert colors",
        "controls.volume": "Volume",
        "controls.help_language": "Help / language",
        "controls.options": "Options",
        "controls.close": "Close",
        "controls.preparation_seconds": "Preparation time (s):",
        "controls.fullscreen": "Fullscreen",
        "controls.exit_fullscreen": "Exit fullscreen",

        // Help panel
        "help.title": "How to use the timer",
        "help.usage.abcd_order_line": "Click {%AB} / {%CD} to choose the alternating shooting order for the current volley.",
        "help.usage.single_line_hint": "If everyone shoots on one line, leave the default AB/CD hint (all archers together).",
        "help.usage.timer_limit_line": "The central {%RemainingTime} display shows the active timer (preparation, then shooting).",
        "help.usage.start_continue_line": "Use {%Start} / {%Resume} / {%Finish} to start, resume after an emergency pause, or finish the current volley immediately.",
        "help.usage.emergency_stop_line": "Use {%EmergencyStop} to pause the timer immediately and keep the current remaining time.",
        "help.usage.control_panel_line": "Open the {%ControlPanel} to set round duration buttons (10-240s), AB/CD mode, tenths display, and main control visibility.",
        "help.usage.control_panel_label": "advanced control panel",
        "help.tokens.remaining_time": "remaining time",
        "help.language_label": "Change language:",

        // Feedback and hints
        "feedback.prep_applied": "Preparation: {value}s (applied)",
        "feedback.prep_invalid": "Invalid value: minimum 3 seconds.",
        "hints.abcd_click": "AB/CD",

        // Control panel popup labels
        "misc.seconds_short": "{%Seconds}s",
        "misc.all": "All",
        "misc.toggle_tenths": "Show/hide tenths of seconds",
        "misc.toggle_main_controls": "Toggle main display controls"
    },
    frFR: {
        // Contrôles principaux sur l"écran du timer
        "controls.primary.start": "Démarrer",
        "controls.primary.resume": "Reprendre",
        "controls.primary.finish_round": "Finir la volée",
        "controls.emergency_stop": "Pause d'urgence",
        "controls.invert_colors": "Inverser les couleurs",
        "controls.volume": "Volume",
        "controls.help_language": "Aide / langue",
        "controls.options": "Options",
        "controls.close": "Fermer",
        "controls.preparation_seconds": "Temps de préparation (s) :",
        "controls.fullscreen": "Plein écran",
        "controls.exit_fullscreen": "Quitter le plein écran",

        // Panneau d"aide
        "help.title": "Comment utiliser le timer",
        "help.usage.abcd_order_line": "Cliquez sur {%AB} / {%CD} pour choisir l'ordre alterné des tireurs pour la volée en cours.",
        "help.usage.single_line_hint": "S'il n'y a qu'une seule ligne de tir, laissez l'indication AB/CD par défaut (tous les archers ensemble).",
        "help.usage.timer_limit_line": "L'affichage central {%RemainingTime} montre le timer actif (préparation puis tir).",
        "help.usage.start_continue_line": "Utilisez {%Start} / {%Resume} / {%Finish} pour démarrer, reprendre après une pause d'urgence ou terminer immédiatement la volée en cours.",
        "help.usage.emergency_stop_line": "Utilisez {%EmergencyStop} pour mettre en pause le timer immédiatement en conservant le temps restant.",
        "help.usage.control_panel_line": "Ouvrez le {%ControlPanel} pour régler les durées de volée (10-240 s), le mode AB/CD, l'affichage des dixièmes et la visibilité des contrôles principaux.",
        "help.usage.control_panel_label": "panneau de contrôle avancé",
        "help.tokens.remaining_time": "temps restant",
        "help.language_label": "Changer la langue :",

        // Feedback et indices
        "feedback.prep_applied": "Préparation : {value}s (appliqué)",
        "feedback.prep_invalid": "Valeur invalide : minimum 3 secondes.",
        "hints.abcd_click": "AB/CD",

        // Libellés du panneau de contrôle popup
        "misc.seconds_short": "{%Seconds}s",
        "misc.all": "Tous",
        "misc.toggle_tenths": "Afficher/masquer les dixièmes de seconde",
        "misc.toggle_main_controls": "Afficher/masquer les contrôles de l'écran principal"
    },
    nbNO: {
        // Hovedkontroller på timeren
        "controls.primary.start": "Start",
        "controls.primary.resume": "Fortsett",
        "controls.primary.finish_round": "Avslutt serie",
        "controls.emergency_stop": "Nødstopp",
        "controls.invert_colors": "Inverter farger",
        "controls.volume": "Volum",
        "controls.help_language": "Hjelp / språk",
        "controls.options": "Alternativer",
        "controls.close": "Lukk",
        "controls.preparation_seconds": "Forberedelsestid (s):",
        "controls.fullscreen": "Fullskjerm",
        "controls.exit_fullscreen": "Avslutt fullskjerm",

        // Hjelpepanelet
        "help.title": "Slik bruker du timeren",
        "help.usage.abcd_order_line": "Klikk {%AB} / {%CD} for å velge vekslende skyterekkefølge for aktiv serie.",
        "help.usage.single_line_hint": "Hvis alle skyter på en linje, behold standard AB/CD-hint (alle skyttere samlet).",
        "help.usage.timer_limit_line": "Det sentrale {%RemainingTime}-feltet viser timeren som er i gang (forberedelse, deretter skyting).",
        "help.usage.start_continue_line": "Bruk {%Start} / {%Resume} / {%Finish} for å starte, fortsette etter nødstopp eller avslutte serien umiddelbart.",
        "help.usage.emergency_stop_line": "Bruk {%EmergencyStop} for å stoppe timeren umiddelbart og beholde gjenværende tid.",
        "help.usage.control_panel_line": "Åpne {%ControlPanel} for å sette serietider (10-240 s), AB/CD-modus, tideler-visning og synlighet for hovedkontroller.",
        "help.usage.control_panel_label": "avansert kontrollpanel",
        "help.tokens.remaining_time": "gjenværende tid",
        "help.language_label": "Bytt språk:",

        // Tilbakemelding og hint
        "feedback.prep_applied": "Forberedelse: {value}s (oppdatert)",
        "feedback.prep_invalid": "Ugyldig verdi: minst 3 sekunder.",
        "hints.abcd_click": "AB/CD",

        // Etiketter i popup-kontrollpanelet
        "misc.seconds_short": "{%Seconds}s",
        "misc.all": "Alle",
        "misc.toggle_tenths": "Vis/skjul tideler",
        "misc.toggle_main_controls": "Vis/skjul hovedkontroller"
    }
};

// Set default language by language type
var defaultLanguage = {
    en: "enUS",
    fr: "frFR",
    nb: "nbNO"
};
