import { mountCtrlPanel, unmountCtrlPanel } from '/js/ui/ctrlpanel.js';

document.addEventListener('DOMContentLoaded', () => {
    if (document.body?.dataset.ui === 'ctrlpanel') {
        mountCtrlPanel({ autoCloseOnBridgeLoss: true });
    }
});

window.addEventListener('beforeunload', () => {
    unmountCtrlPanel();
});
