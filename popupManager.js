import { PALETTES, SONGS } from './constants.js';
import { ShopUI } from './shopUI.js';

const DEFAULT_FAVICON = '/deadhead.svg';
const SHOP_FAVICON = '/costume2.svg';
const SETTINGS_FAVICON = '/costume1.svg';

function setFavicon(url) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = url;
    if (url.endsWith('.svg')) {
        link.type = 'image/svg+xml';
    }
}

export class PopupManager {
    constructor(audioManager) {
        this.audio = audioManager;
        this.game = null;

        // Cache all popup elements
        this.settingsMenu = document.getElementById('settingsMenu');
        this.closeSettingsButton = document.getElementById('closeSettingsButton');
        this.volumeSlider = document.getElementById('volume');
        this.musicVolumeSlider = document.getElementById('musicVolume');
        this.showTimerToggle = document.getElementById('showTimerToggle');
        this.performanceToggle = document.getElementById('performanceToggle');
        this.skipAnimationsToggle = document.getElementById('skipAnimationsToggle');
        this.saveDataButton = document.getElementById('saveDataButton');
        this.deleteDataButton = document.getElementById('deleteDataButton');

        // New: local save/load controls
        this.downloadDataButton = document.getElementById('downloadDataButton');
        this.loadDataButton = document.getElementById('loadDataButton');
        this.loadDataInput = document.getElementById('loadDataInput');

        this.howToPopup = document.getElementById('howToPopup');
        this.howToButton = document.getElementById('howToButton');
        this.closeHowToButton = document.getElementById('closeHowToButton');

        this.shopPopup = document.getElementById('shopPopup');
        this.closeShopButton = document.getElementById('closeShopButton');
        this.shopCoinCountSpan = document.getElementById('shopCoinCount');
        this.shopItemsContainer = document.getElementById('shopItemsContainer');

        this.leaderboardPopup = document.getElementById('leaderboardPopup');
        
        // New Death Options Popup
        this.deathOptionsPopup = document.getElementById('deathOptionsPopup');
        this.deathOptionsButton = document.getElementById('deathOptionsButton');
        this.closeDeathOptionsButton = document.getElementById('closeDeathOptionsButton');
        this.deathOptionsContainer = document.getElementById('deathOptionsContainer');

        this.gameOverPopup = document.getElementById('gameOverPopup');
        this.finalDistanceSpan = document.getElementById('finalDistance');
        this.finalTimeSpan = document.getElementById('finalTime');
        this.restartButton = document.getElementById('restartButton');
        this.backToMenuButton = document.getElementById('backToMenuButton');
        
        this.adminPanel = document.getElementById('adminPanel');
        this.adminPlayerList = document.getElementById('adminPlayerList');
        this.closeAdminButton = document.getElementById('closeAdminButton');
        this.adminSpawnGoomba = document.getElementById('adminSpawnGoomba');
        this.adminSpawnFlyer = document.getElementById('adminSpawnFlyer');
        this.adminSpawnAbility = document.getElementById('adminSpawnAbility');
        this.adminCoinInput = document.getElementById('adminCoinInput');

        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.presenceUnsubscribe = null;
        this.localDataUnsubscribe = null;
    }

    setGame(gameInstance) {
        this.game = gameInstance;
    }

    setPalette(palette) {
        const popups = [this.gameOverPopup, this.leaderboardPopup, this.howToPopup, this.settingsMenu, this.shopPopup, this.deathOptionsPopup];
        popups.forEach(popup => {
            if (!popup) return;
            popup.style.background = palette.background;
            popup.style.color = palette.foreground;
            popup.style.borderColor = palette.foreground;
            popup.querySelectorAll('button').forEach(button => {
                button.style.setProperty('--button-bg', palette.background);
                button.style.setProperty('--button-text', palette.foreground);
                button.style.setProperty('--button-border', palette.foreground);
            });
        });
    }

    setupEventListeners() {
        this.restartButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            document.dispatchEvent(new Event('restart-game'));
        });
        this.backToMenuButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            document.dispatchEvent(new Event('back-to-menu'));
        });

        this.closeSettingsButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.hideSettingsMenu();
        });

        this.saveDataButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            if (this.game) this.game.saveUserData();
        });

        // New: Download/Load save handlers
        this.downloadDataButton?.addEventListener('click', async () => {
            this.audio.play('button_click');
            try {
                const currentUser = await window.websim.getCurrentUser();
                const username = currentUser?.username || 'player';
                const payload = this.game?.dataManager?.exportUserData?.();
                if (!payload) return;
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const ts = new Date().toISOString().replace(/[:.]/g, '-');
                a.download = `jumpline-save-${username}-${ts}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Failed to export save:', e);
                alert('Failed to download save.');
            }
        });

        this.loadDataButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.loadDataInput?.click();
        });

        this.loadDataInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const json = JSON.parse(text);
                const ok = await this.game?.dataManager?.importUserData?.(json);
                if (ok) {
                    // Refresh UI to reflect new data
                    this.game.userData = this.game.dataManager.userData;
                    this.game.applyPalette();
                    this.game.hud.updateCoins(this.game.userData.coins);
                    this.updateShopCoins(this.game.userData.coins);
                    this.renderShopItems();
                    alert('Save loaded!');
                } else {
                    alert('Invalid or incompatible save file.');
                }
            } catch (err) {
                console.error('Failed to load save file:', err);
                alert('Failed to load save file.');
            } finally {
                // reset input so same file can be selected again later
                e.target.value = '';
            }
        });

        this.deleteDataButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            if (this.game) this.game.deleteUserDataWithConfirmation();
        });

        this.closeShopButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.hideShopPopup();
        });

        this.howToButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.showHowTo();
        });
        this.closeHowToButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.hideHowTo();
        });

        // New death options listeners
        this.deathOptionsButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.showDeathOptionsPopup();
        });
        this.closeDeathOptionsButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.hideDeathOptionsPopup();
        });

        // Admin Panel Listeners
        this.closeAdminButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.hideAdminPanel();
        });

        this.adminSpawnGoomba?.addEventListener('click', () => {
            if (this.game) this.game.powerupSystem.spawnGoombaInFront();
        });
        this.adminSpawnFlyer?.addEventListener('click', () => {
            if (this.game) this.game.powerupSystem.spawnFlyingEnemyInFront();
        });
        this.adminSpawnAbility?.addEventListener('click', () => {
            if (this.game) this.game.powerupSystem.spawnRandomPowerupInFront();
        });
    }

    toggleAdminPanel() {
        if (this.adminPanel.classList.contains('show')) {
            this.hideAdminPanel();
        } else {
            this.showAdminPanel();
        }
    }

    showAdminPanel() {
        this.renderAdminPeers();
        
        // Subscribe to live updates so we see coin counts change in real time
        if (this.game && this.game.dataManager && this.game.dataManager.room) {
             if (this.presenceUnsubscribe) this.presenceUnsubscribe();
             this.presenceUnsubscribe = this.game.dataManager.room.subscribePresence((presence) => {
                 this.renderAdminPeers();
             });
        }

        // Subscribe to local data changes to ensure self-updates render immediately
        if (this.game && this.game.dataManager) {
            if (this.localDataUnsubscribe) this.localDataUnsubscribe();
            this.localDataUnsubscribe = this.game.dataManager.subscribe(() => {
                this.renderAdminPeers();
            });
        }

        this.adminPanel.classList.add('show');
        if (this.modalBackdrop) {
            this.modalBackdrop.style.pointerEvents = 'auto';
            this.modalBackdrop.style.opacity = '1';
        }
    }

    hideAdminPanel() {
        if (this.presenceUnsubscribe) {
            this.presenceUnsubscribe();
            this.presenceUnsubscribe = null;
        }
        if (this.localDataUnsubscribe) {
            this.localDataUnsubscribe();
            this.localDataUnsubscribe = null;
        }
        this.adminPanel.classList.remove('show');
        if (this.modalBackdrop) {
            this.modalBackdrop.style.opacity = '0';
            this.modalBackdrop.style.pointerEvents = 'none';
        }
    }

    renderAdminPeers() {
        if (!this.game || !this.game.dataManager || !this.game.dataManager.room) return;
        
        const peers = this.game.dataManager.room.peers;
        this.adminPlayerList.innerHTML = '';
        
        if (!peers) {
            this.adminPlayerList.innerHTML = '<div>No peers connected</div>';
            return;
        }

        Object.values(peers).forEach(peer => {
            const row = document.createElement('div');
            row.className = 'player-row';
            
            // Get live coin data from presence
            const presence = this.game.dataManager.room.presence[peer.id] || {};
            const coins = presence.coins !== undefined ? presence.coins : '---';

            const info = document.createElement('div');
            info.className = 'player-info';
            info.innerHTML = `
                <img src="${peer.avatarUrl}" class="player-avatar" />
                <div style="display:flex; flex-direction:column; align-items:flex-start; text-align:left;">
                    <span style="font-weight:bold;">${peer.username}</span>
                    <span style="font-size:12px; color:#666;">Coins: ${coins}</span>
                </div>
            `;

            const actions = document.createElement('div');
            actions.className = 'coin-actions';

            const btnGive = document.createElement('button');
            btnGive.className = 'admin-button';
            btnGive.textContent = 'GIVE';
            btnGive.style.width = '100%';
            btnGive.onclick = () => {
                const amount = parseInt(this.adminCoinInput.value, 10);
                if (amount && amount > 0) {
                    this.game.dataManager.adminGiveCoins(peer.id, amount);
                    // Visual feedback
                    const originalText = btnGive.textContent;
                    btnGive.textContent = 'SENT!';
                    btnGive.style.backgroundColor = 'red';
                    btnGive.style.color = 'white';
                    setTimeout(() => {
                        btnGive.textContent = originalText;
                        btnGive.style.backgroundColor = '';
                        btnGive.style.color = '';
                    }, 1000);
                }
            };

            actions.appendChild(btnGive);
            
            row.appendChild(info);
            row.appendChild(actions);
            this.adminPlayerList.appendChild(row);
        });
    }

    updateShopCoins(coins) {
        if (this.shopCoinCountSpan) this.shopCoinCountSpan.textContent = coins;
    }

    renderShopItems() {
        ShopUI.renderShopItems(this.shopItemsContainer, this.game, this);
    }

    renderDeathOptions() {
        ShopUI.renderDeathOptions(this.deathOptionsContainer, this.game);
    }
    
    // --- Popup show/hide methods ---
    showPopup(element, showBackdrop = true) {
        element.style.display = 'block';
        requestAnimationFrame(() => element.classList.add('show'));
        if (showBackdrop && this.modalBackdrop) {
            const popupZ = window.getComputedStyle(element).zIndex;
            if (popupZ && !isNaN(parseInt(popupZ, 10))) {
                this.modalBackdrop.style.zIndex = parseInt(popupZ, 10) - 1;
            }
            this.modalBackdrop.style.pointerEvents = 'auto';
            requestAnimationFrame(() => (this.modalBackdrop.style.opacity = '1'));
        }
    }
    
    hidePopup(element, showBackdrop = true) {
        element.classList.remove('show');
        setTimeout(() => { element.style.display = 'none'; }, 300);
        if (showBackdrop && this.modalBackdrop) {
            this.modalBackdrop.style.opacity = '0';
            this.modalBackdrop.style.pointerEvents = 'none';
            setTimeout(() => {
                if (this.modalBackdrop) {
                    this.modalBackdrop.style.zIndex = '';
                }
            }, 300);
        }
    }

    showLeaderboard() {
        this.showPopup(this.leaderboardPopup);

        const paletteConf = PALETTES[this.game?.userData?.equipped_palette] || PALETTES.default;
        
        const event = new CustomEvent('show-leaderboard', { 
            detail: { 
                audioManager: this.audio,
                onClose: () => this.hideLeaderboard(),
                palette: paletteConf.colors
            } 
        });
        document.dispatchEvent(event);
    }
    hideLeaderboard() { this.hidePopup(this.leaderboardPopup); }
    showSettingsMenu() { 
        this.showPopup(this.settingsMenu, false); 
        setFavicon(SETTINGS_FAVICON);
    }
    hideSettingsMenu() { 
        this.hidePopup(this.settingsMenu, false); 
        setFavicon(DEFAULT_FAVICON);
    }
    showHowTo() { this.showPopup(this.howToPopup); }
    hideHowTo() { this.hidePopup(this.howToPopup); }

    showDeathOptionsPopup() {
        this.renderDeathOptions();
        this.showPopup(this.deathOptionsPopup, false);
    }
    hideDeathOptionsPopup() { this.hidePopup(this.deathOptionsPopup, false); }

    showShopPopup() {
        this.renderShopItems();
        this.showPopup(this.shopPopup, false);
        setFavicon(SHOP_FAVICON);
    }
    hideShopPopup() { 
        this.hidePopup(this.shopPopup, false); 
        setFavicon(DEFAULT_FAVICON);
    }

    showGameOver(distance, timeMs, rank) {
        this.finalDistanceSpan.textContent = distance;
        this.finalTimeSpan.textContent = (timeMs / 1000).toFixed(2);
        
        const rankContainer = document.getElementById('leaderboardRankContainer');
        const rankSpan = document.getElementById('leaderboardRank');
        
        if (rank && rankContainer && rankSpan) {
            rankSpan.textContent = `#${rank}`;
            rankContainer.style.display = 'block';
        } else if (rankContainer) {
            rankContainer.style.display = 'none';
        }
        
        this.showPopup(this.gameOverPopup);
    }
    hideGameOver() { this.hidePopup(this.gameOverPopup); }
}