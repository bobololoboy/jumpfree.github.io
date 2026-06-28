import { PALETTES, SONGS } from './constants.js';
import { PopupManager } from './popupManager.js';

export class MenuManager {
    constructor(particleManager, audioManager, visualizer) {
        this.particleManager = particleManager;
        this.audio = audioManager;
        this.visualizer = visualizer;
        this.game = null; 

        this.mainMenu = document.getElementById('mainMenu');
        this.playButton = document.getElementById('playButton');
        this.leaderboardButton = document.getElementById('leaderboardButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.shopButton = document.getElementById('shopButton');
        this.menuCanvas = document.getElementById('menuCanvas');
        this.menuCtx = this.menuCanvas.getContext('2d');
        
        this.pauseMenu = document.getElementById('pauseMenu');
        this.resumeButton = document.getElementById('resumeButton');
        this.pauseSettingsButton = document.getElementById('pauseSettingsButton');
        this.pauseShopButton = document.getElementById('pauseShopButton');
        this.pauseQuitButton = document.getElementById('pauseQuitButton');

        this.popups = new PopupManager(audioManager);

        this.isPerformanceMode = false;
        this.isSkipAnimations = false;
        
        this.gameUI = document.getElementById('ui');

        this.loadSettings();
        this.setupEventListeners();
        this.popups.setupEventListeners();
        this.resizeMenuCanvas();
    }

    setGame(gameInstance) {
        this.game = gameInstance;
        this.popups.setGame(gameInstance);
    }

    setPalette(palette) {
        this.popups.setPalette(palette);
        // also pass to visualizer for theme coherence
        this.visualizer?.setPalette(palette);
        if (this.pauseMenu) {
            this.pauseMenu.style.color = palette.foreground;
            this.pauseMenu.style.background = palette.background;
            this.pauseMenu.style.borderColor = palette.foreground;
        }
    }

    setupEventListeners() {
        this.playButton.addEventListener('click', () => {
            this.audio.play('button_click');
            document.dispatchEvent(new Event('start-game'));
        });

        this.leaderboardButton.addEventListener('click', () => {
            this.audio.play('button_click');
            this.popups.showLeaderboard();
        });

        this.settingsButton.addEventListener('click', () => {
            this.audio.play('button_click');
            this.popups.showSettingsMenu();
        });
        
        this.shopButton.addEventListener('click', () => {
            this.audio.play('button_click');
            this.popups.showShopPopup();
        });
        
        this.resumeButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.game.togglePause();
        });

        this.pauseSettingsButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.popups.showSettingsMenu();
        });
        
        this.pauseShopButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.popups.showShopPopup();
        });

        this.pauseQuitButton?.addEventListener('click', () => {
            this.audio.play('button_click');
            this.game.backToMenu();
        });

        // Settings controls are delegated to PopupManager for listeners, but changes affect MenuManager state
        const settings = this.popups;

        settings.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            this.audio.setVolume(volume);
            localStorage.setItem('jumpline_volume', volume);
        });
        settings.volumeSlider.addEventListener('change', () => this.audio.play('button_click'));
        
        settings.musicVolumeSlider?.addEventListener('input', (e) => {
            const volume = e.target.value;
            this.audio.setMusicVolume(volume);
            localStorage.setItem('jumpline_musicVolume', volume);
        });
        settings.musicVolumeSlider?.addEventListener('change', () => this.audio.play('button_click'));

        settings.showTimerToggle.addEventListener('change', (e) => {
            document.getElementById('timerContainer').style.display = e.target.checked ? 'block' : 'none';
            localStorage.setItem('jumpline_showTimer', e.target.checked);
        });

        settings.performanceToggle.addEventListener('change', (e) => {
            this.isPerformanceMode = e.target.checked;
            this.particleManager.setEnabled(!this.isPerformanceMode);
            if (this.isPerformanceMode) {
                this.particleManager.clearAllParticles();
            }
            // Optimization: Performance Mode now DISABLES the visualizer to save resources
            this.visualizer?.setEnabled(false);
            
            localStorage.setItem('jumpline_performanceMode', e.target.checked);
        });

        settings.skipAnimationsToggle?.addEventListener('change', (e) => {
            this.isSkipAnimations = e.target.checked;
            localStorage.setItem('jumpline_skipAnimations', e.target.checked);
        });
    }
    
    loadSettings() {
        const settings = this.popups;

        const savedVolume = localStorage.getItem('jumpline_volume');
        if (savedVolume !== null) {
            settings.volumeSlider.value = savedVolume;
            this.audio.setVolume(savedVolume);
        }

        const savedMusicVolume = localStorage.getItem('jumpline_musicVolume');
        if (settings.musicVolumeSlider && savedMusicVolume !== null) {
            settings.musicVolumeSlider.value = savedMusicVolume;
            this.audio.setMusicVolume(savedMusicVolume);
        }

        const savedShowTimer = localStorage.getItem('jumpline_showTimer');
        settings.showTimerToggle.checked = savedShowTimer === null || savedShowTimer === 'true';
        document.getElementById('timerContainer').style.display = settings.showTimerToggle.checked ? 'block' : 'none';

        const savedPerformance = localStorage.getItem('jumpline_performanceMode');
        settings.performanceToggle.checked = savedPerformance === 'true';
        this.isPerformanceMode = settings.performanceToggle.checked;
        this.particleManager.setEnabled(!this.isPerformanceMode);
        if (this.isPerformanceMode) this.particleManager.clearAllParticles();
        
        // Optimization: Ensure visualizer is OFF in performance mode
        if (this.isPerformanceMode) {
            this.visualizer?.setEnabled(false);
        } else {
            // Optional: reset visualizer state if needed, but default off is safer
            this.visualizer?.setEnabled(false); 
        }
        
        const savedSkipAnimations = localStorage.getItem('jumpline_skipAnimations');
        if (settings.skipAnimationsToggle) {
            settings.skipAnimationsToggle.checked = savedSkipAnimations === 'true';
            this.isSkipAnimations = settings.skipAnimationsToggle.checked;
        }
    }

    resizeMenuCanvas() {
        this.menuCanvas.width = window.innerWidth;
        this.menuCanvas.height = window.innerHeight;
    }
    
    showGameOver(distance, timeMs, rank) { this.popups.showGameOver(distance, timeMs, rank); }
    hideGameOver() { this.popups.hideGameOver(); }
    hideSettingsMenu() { this.popups.hideSettingsMenu(); }
    showShopPopup() { this.popups.showShopPopup(); }
    hideShopPopup() { this.popups.hideShopPopup(); }
    renderShopItems() { this.popups.renderShopItems(); }
    updateShopCoins(coins) { this.popups.updateShopCoins(coins); }

    showPauseMenu() {
        this.pauseMenu.style.display = 'block';
        requestAnimationFrame(() => this.pauseMenu.classList.add('show'));
    }

    hidePauseMenu() {
        this.pauseMenu.classList.remove('show');
        setTimeout(() => { this.pauseMenu.style.display = 'none'; }, 200);
    }

    toggleAdminPanel() {
        this.popups.toggleAdminPanel();
    }

    hideMainMenu() {
        this.mainMenu.style.display = 'none';
        this.gameUI.style.display = 'block';
        document.getElementById('gameCanvas').style.display = 'block';
    }

    showMainMenu() {
        this.mainMenu.style.display = 'flex';
        this.gameUI.style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'none';
    }

    updateMenu() {
        this.menuCtx.clearRect(0, 0, this.menuCanvas.width, this.menuCanvas.height);
        if (!this.isPerformanceMode) {
            this.particleManager.updateMenuParticles(this.menuCanvas);
            this.particleManager.renderMenu(this.menuCtx);
        }
        // When performance mode is ON, visualizer is driving the background, so we skip menu particles.
    }
}