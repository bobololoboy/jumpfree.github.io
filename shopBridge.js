import { PALETTES, SONGS, DEATH_EFFECTS } from './constants.js';

export class ShopBridge {
    constructor(controller) {
        this.controller = controller;
    }

    buyPalette(key) {
        if (this.controller.dataManager.buyPalette(key)) {
            this.controller.userData = this.controller.dataManager.userData;
            this.controller.menus.renderShopItems();
            this.controller.hud.updateCoins(this.controller.userData.coins);
            this.controller.menus.updateShopCoins(this.controller.userData.coins);
            this.controller.audio.play('collect_powerup');
        }
    }

    equipPalette(key) {
        if (this.controller.dataManager.equipPalette(key)) {
            this.controller.userData = this.controller.dataManager.userData;
            // Re-apply palette to update the player's death effect setting
            this.applyPalette();
            // Re-render the options popup to show the new "Equipped" state
            this.controller.menus.popups.renderDeathOptions();
            // Re-render shop items to update the "Equipped" button state in the shop
            this.controller.menus.renderShopItems();
            this.controller.audio.play('button_click');
        }
    }

    buySong(key) {
        if (this.controller.dataManager.buySong(key)) {
            this.controller.userData = this.controller.dataManager.userData;
            this.controller.menus.renderShopItems();
            this.controller.hud.updateCoins(this.controller.userData.coins);
            this.controller.menus.updateShopCoins(this.controller.userData.coins);
            this.controller.audio.play('collect_powerup');
        }
    }

    async equipSong(key) {
        if (this.controller.dataManager.equipSong(key)) {
            this.controller.userData = this.controller.dataManager.userData;
            this.controller.menus.renderShopItems();
            this.controller.audio.play('button_click');
            // Immediately switch the music to the newly equipped song
            const songPath = (SONGS[key]?.path || SONGS.default_song.path).replace(/\.(mp3|wav|ogg)$/, '');
            await this.controller.audio.playBGM(songPath);
        }
    }

    equipDeathEffect(key) {
        if (this.controller.dataManager.equipDeathEffect(key)) {
            this.controller.userData = this.controller.dataManager.userData;
            // Re-apply palette to update the player's death effect setting
            this.applyPalette();
            // Re-render the options popup to show the new "Equipped" state
            this.controller.menus.popups.renderDeathOptions();
            this.controller.audio.play('button_click');
        }
    }

    applyPalette() {
        const userData = this.controller.userData;
        const paletteConf = PALETTES[userData.equipped_palette] || PALETTES.default;
        const colors = paletteConf.colors;
        const textureUrl = paletteConf.texture || 'none';

        // Global CSS vars for theming controls too
        document.documentElement.style.setProperty('--background-image', textureUrl === 'none' ? 'none' : `url(${textureUrl})`);
        document.documentElement.style.setProperty('--corner-icon-color', colors.foreground);
        document.documentElement.style.setProperty('--foreground-color', colors.foreground);
        document.documentElement.style.setProperty('--background-color', colors.background);

        document.body.style.background = colors.background; // Fallback for canvas bg
        this.controller.world.setPalette(colors, paletteConf.texture);

        // Priority: User's choice > Palette's effect > Default 'normal'
        const deathEffect = userData.equipped_death_effect || paletteConf.death_effect || 'normal';
        this.controller.player.setPalette(colors, deathEffect);

        this.controller.particles.setPalette(colors, paletteConf.particle_effect || 'default');
        this.controller.hud.setPalette(colors);
        this.controller.menus.setPalette(colors);
        this.controller.visualizer?.setPalette(colors);

        // Audio Effects
        if (paletteConf.audio_effect === 'super_bitcrusher') {
            this.controller.audio.enableSuperRetroFX?.();
        } else if ((paletteConf.particle_effect === 'matrix') || (paletteConf.death_effect === 'matrix')) {
            this.controller.audio.enableRetroFX?.();
        } else {
            this.controller.audio.disableRetroFX?.();
        }

        if (paletteConf.audio_effect === 'bass_boost') {
            this.controller.audio.enableBassBoostFX?.();
        } else {
            this.controller.audio.disableBassBoostFX?.();
        }
        
        // Pixelation / Resolution Scale
        if (paletteConf.pixel_scale) {
            this.controller.resolutionScale = paletteConf.pixel_scale;
        } else {
            this.controller.resolutionScale = 1;
        }
        this.controller.resizeCanvas();

        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.style.color = colors.foreground;
            // Add a data attribute to control the texture's visibility via CSS
            if (textureUrl !== 'none') {
                mainMenu.dataset.textured = 'true';
            } else {
                delete mainMenu.dataset.textured;
            }
            const h1 = mainMenu.querySelector('h1');
            if (h1) h1.style.color = colors.foreground;
            const buttons = mainMenu.querySelectorAll('.main-menu-button, #playButton');
            buttons.forEach(button => {
                button.style.borderColor = colors.foreground;
                button.style.color = colors.foreground;
            });
        }
    }

    deleteUserDataWithConfirmation() {
        const confirmation = window.confirm(
            "Are you sure you want to delete all your progress?\nThis will reset your coins and purchased items.\nThis action cannot be undone."
        );
        if (confirmation) {
            this.deleteUserData();
        }
    }
    
    async deleteUserData() {
        await this.controller.dataManager.deleteUserData();
        this.controller.userData = this.controller.dataManager.userData;
        this.applyPalette();
        this.controller.menus.hideSettingsMenu();
        this.controller.hud.updateCoins(this.controller.userData.coins);
        this.controller.menus.updateShopCoins(this.controller.userData.coins);
        console.log("User data reset locally.");
    }
}