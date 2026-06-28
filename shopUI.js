import { PALETTES, SONGS, DEATH_EFFECTS } from './constants.js';

export class ShopUI {
    static renderShopItems(container, game, popupManager) {
        if (!game || !game.userData) return;
        
        const { coins, owned_palettes, equipped_palette, owned_songs, equipped_song } = game.userData;
        const paletteConf = PALETTES[equipped_palette] || PALETTES.default;
        const currentPalette = paletteConf.colors;

        popupManager.updateShopCoins(coins);
        container.innerHTML = '';

        const palettesHeader = document.createElement('h3');
        palettesHeader.className = 'text-xl font-bold mb-2 text-left';
        palettesHeader.textContent = 'Color Palettes';
        container.appendChild(palettesHeader);

        // Sort palettes by price (ascending), then by name for stability
        const sortedPalettes = Object.entries(PALETTES)
            .sort(([, a], [, b]) => (a.price - b.price) || a.name.localeCompare(b.name));

        for (const [key, palette] of sortedPalettes) {
            const isOwned = owned_palettes.includes(key);
            const isEquipped = equipped_palette === key;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';

            const colorsDiv = document.createElement('div');
            colorsDiv.className = 'shop-item-colors';
            colorsDiv.innerHTML = `
                <div class="color-swatch" style="background-color: ${palette.colors.background};"></div>
                <div class="color-swatch" style="background-color: ${palette.colors.foreground};"></div>
            `;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'shop-item-details';
            detailsDiv.innerHTML = `<span class="shop-item-name">${palette.name}</span>`;

            const actionDiv = document.createElement('div');
            actionDiv.className = 'shop-item-action';
            
            const button = document.createElement('button');
            button.className = 'shop-item-button';
            // Reversed colors for shop item buttons
            button.style.setProperty('--button-bg', currentPalette.foreground);
            button.style.setProperty('--button-text', currentPalette.background);
            button.style.setProperty('--button-border', currentPalette.foreground);

            if (isEquipped) {
                button.textContent = 'Equipped';
                button.classList.add('equipped');
                button.disabled = true;
            } else if (isOwned) {
                button.textContent = 'Equip';
                button.dataset.paletteKey = key;
                button.onclick = () => game.equipPalette(key);
            } else {
                button.textContent = `${palette.price} Coins`;
                button.dataset.paletteKey = key;
                if (coins < palette.price) {
                    button.disabled = true;
                } else {
                    button.onclick = () => game.buyPalette(key);
                }
            }
            
            actionDiv.appendChild(button);

            itemDiv.appendChild(colorsDiv);
            itemDiv.appendChild(detailsDiv);
            itemDiv.appendChild(actionDiv);
            
            container.appendChild(itemDiv);
        }

        const songsHeader = document.createElement('h3');
        songsHeader.className = 'text-xl font-bold mt-6 mb-2 text-left';
        songsHeader.textContent = 'Music Tracks';
        container.appendChild(songsHeader);

        // Sort songs by price (ascending), then by name
        const sortedSongs = Object.entries(SONGS)
            .sort(([, a], [, b]) => (a.price - b.price) || a.name.localeCompare(b.name));

        for (const [key, song] of sortedSongs) {
            const isOwned = owned_songs.includes(key);

            // Hide song if it's hidden and not owned (Legacy items)
            if (song.hidden && !isOwned) continue;

            const isEquipped = equipped_song === key;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';

            const iconDiv = document.createElement('div');
            iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-music"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
            
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'shop-item-details';
            detailsDiv.innerHTML = `<span class="shop-item-name">${song.name}</span>`;
            
            const actionDiv = document.createElement('div');
            actionDiv.className = 'shop-item-action';
            
            const button = document.createElement('button');
            button.className = 'shop-item-button';
            // Reversed colors for shop item buttons
            button.style.setProperty('--button-bg', currentPalette.foreground);
            button.style.setProperty('--button-text', currentPalette.background);
            button.style.setProperty('--button-border', currentPalette.foreground);

            if (isEquipped) {
                button.textContent = 'Equipped';
                button.classList.add('equipped');
                button.disabled = true;
            } else if (isOwned) {
                button.textContent = 'Equip';
                button.dataset.songKey = key;
                button.onclick = () => game.equipSong(key);
            } else {
                button.textContent = `${song.price} Coins`;
                button.dataset.songKey = key;
                if (coins < song.price) {
                    button.disabled = true;
                } else {
                    button.onclick = () => game.buySong(key);
                }
            }

            actionDiv.appendChild(button);
            
            itemDiv.appendChild(iconDiv);
            itemDiv.appendChild(detailsDiv);
            itemDiv.appendChild(actionDiv);

            container.appendChild(itemDiv);
        }
    }

    static renderDeathOptions(container, game) {
        if (!game || !game.userData) return;

        const { equipped_death_effect } = game.userData;
        const paletteConf = PALETTES[game.userData.equipped_palette] || PALETTES.default;
        const currentPalette = paletteConf.colors;

        container.innerHTML = '';

        for (const [key, effect] of Object.entries(DEATH_EFFECTS)) {
            const isEquipped = equipped_death_effect === key;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'shop-item-details';
            detailsDiv.innerHTML = `<span class="shop-item-name">${effect.name}</span><div style="opacity:0.8; font-size: 14px;">${effect.description}</div>`;

            const actionDiv = document.createElement('div');
            actionDiv.className = 'shop-item-action';
            
            const button = document.createElement('button');
            button.className = 'shop-item-button';
            // Reversed colors for death effect buttons inside shop popup
            button.style.setProperty('--button-bg', currentPalette.foreground);
            button.style.setProperty('--button-text', currentPalette.background);
            button.style.setProperty('--button-border', currentPalette.foreground);

            if (isEquipped) {
                button.textContent = 'Equipped';
                button.classList.add('equipped');
                button.disabled = true;
            } else {
                button.textContent = 'Equip';
                button.dataset.effectKey = key;
                button.onclick = () => game.equipDeathEffect(key);
            }
            
            actionDiv.appendChild(button);
            
            itemDiv.appendChild(detailsDiv);
            itemDiv.appendChild(actionDiv);
            
            container.appendChild(itemDiv);
        }
    }
}