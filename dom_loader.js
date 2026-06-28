import { MENUS_HTML } from './ui_templates_menus.js';
import { POPUPS_HTML } from './ui_templates_popups.js';
import { HUD_HTML } from './ui_templates_hud.js';

export function injectDOM() {
    // Only inject if not already present (checking for a key element like mainMenu)
    if (document.getElementById('mainMenu')) return;

    const container = document.createElement('div');
    container.id = 'game-ui-container';
    container.innerHTML = MENUS_HTML + POPUPS_HTML + HUD_HTML;

    // Append all children to body
    while (container.firstChild) {
        document.body.appendChild(container.firstChild);
    }
}