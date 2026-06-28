import { AssetLoader } from './assets.js';
import { Controls } from './controls.js';
import { Player } from './player.js';
import { World } from './world.js';
import { MenuManager } from './menuManager.js';
import { HUDManager } from './hudManager.js';
import { ParticleManager } from './particles.js';
import { EasterEgg } from './easter_egg.js';
import { AudioManager } from './audio.js';
import { DataManager } from './dataManager.js';
import { GameController } from './gameController.js';
import { Visualizer } from './visualizer.js';
import { SplashScreenManager } from './splashScreen.js';
import { injectDOM } from './dom_loader.js';

class JumpLine {
    constructor() {
        // Ensure UI elements are present in the DOM before we start grabbing references
        injectDOM();

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingStatus = document.getElementById('loadingStatus');
        this.progressBar = document.getElementById('progressBar');
        this.loadingPercentage = document.getElementById('loadingPercentage');
        this.loadingTips = document.getElementById('loadingTips');
        this.detailedStatus = document.getElementById('detailedStatus');

        this.assets = new AssetLoader();
        this.controls = new Controls();
        this.audio = new AudioManager();
        this.particles = new ParticleManager();
        this.visualizer = new Visualizer(this.audio);
        this.dataManager = new DataManager();
        this.hud = new HUDManager();

        // Dependencies needed for GameController
        // We pass a callback for powerups that delegates to the controller (which isn't created yet, so we use a wrapper)
        this.player = new Player(100, 300, this.particles, this.audio, (type) => this.gameController?.onCollectPowerup(type));
        this.world = new World(this.canvas, this.particles);
        this.menus = new MenuManager(this.particles, this.audio, this.visualizer);
        this.easterEgg = new EasterEgg(this.menus.menuCanvas, this.assets, this.particles);
        this.splashScreen = new SplashScreenManager(this.audio, this.dataManager);

        // The Controller manages the game loop and logic
        this.gameController = new GameController(this);
        this.menus.setGame(this.gameController);

        this.init();
    }

    updateLoadingProgress(progress, status) {
        const totalProgress = Math.min(100, Math.floor(progress * 100));
        this.progressBar.style.width = `${totalProgress}%`;
        this.loadingPercentage.textContent = `${totalProgress}%`;
        
        // Keep the main status simpler, move details to detailedStatus
        if (status.includes('sprite')) {
            this.loadingStatus.textContent = 'Loading Visuals...';
            this.detailedStatus.textContent = status;
        } else if (status.includes('sound')) {
            this.loadingStatus.textContent = 'Loading Audio...';
            this.detailedStatus.textContent = status;
        } else if (status.includes('profile')) {
            this.loadingStatus.textContent = 'Syncing Profile...';
            this.detailedStatus.textContent = status;
        } else {
            this.loadingStatus.textContent = status;
        }
    }

    startTipCycle() {
        const tips = [
            "Tip: Jump on enemies to defeat them!",
            "Tip: Collect coins to buy new colors and music!",
            "Tip: Double jump to reach higher platforms.",
            "Tip: Look out for rare powerups!",
            "Tip: Spikes will instantly defeat you.",
            "Tip: Hold jump to use the Fly powerup.",
            "Tip: Goombas walk back and forth on platforms.",
            "Tip: Speed powerup makes you move super fast!",
            "Tip: Invincibility protects you from everything."
        ];
        
        // Set random initial tip
        this.loadingTips.textContent = tips[Math.floor(Math.random() * tips.length)];
        
        this.tipInterval = setInterval(() => {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            this.loadingTips.textContent = randomTip;
        }, 3000);
    }

    stopTipCycle() {
        if (this.tipInterval) clearInterval(this.tipInterval);
    }

    async init() {
        this.loadingScreen.style.display = 'flex';
        this.startTipCycle();
        
        // One-time audio unlock listener
        const unlockOnce = async () => {
            try {
                await this.audio.unlock(); 
            } catch (e) {
                console.error("Audio unlock failed", e);
            }
        };
        window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true, capture: true });
        window.addEventListener('keydown', unlockOnce, { once: true, passive: true, capture: true });

        try {
            await this.initLoading();
        } catch (e) {
            console.error("Critical loading error:", e);
            // Emergency fallback: force game start even if error
            this.finishLoading();
        }
    }

    async initLoading() {
        const totalSprites = this.assets.spriteFiles.length;
        const totalSounds = this.audio.soundFiles.length;
        const totalItems = totalSprites + totalSounds + 1; // +1 for data init
        let loadedItems = 0;

        const onProgress = (status) => {
            loadedItems++;
            const progress = Math.min(1, loadedItems / totalItems);
            this.updateLoadingProgress(progress, status);
        };

        this.menus.playButton.textContent = 'LOADING...';
        this.menus.playButton.disabled = true;

        // Wrap promises with safety timeouts to prevent hanging
        const safeAssetLoad = Promise.race([
            this.assets.load((name) => onProgress(`Loading sprite: ${name}...`)),
            new Promise(resolve => setTimeout(() => {
                console.warn("Asset loading timed out, proceeding anyway.");
                resolve();
            }, 8000))
        ]);

        const safeAudioLoad = Promise.race([
            this.audio.init((name) => onProgress(`Loading sound: ${name}...`)),
            new Promise(resolve => setTimeout(() => {
                console.warn("Audio loading timed out, proceeding anyway.");
                resolve();
            }, 15000))
        ]);

        const safeDataLoad = this.dataManager.initialize().then(() => onProgress('Player profile loaded!'));

        await Promise.all([safeAssetLoad, safeAudioLoad, safeDataLoad]);

        await this.finishLoading();
    }

    async finishLoading() {
        this.stopTipCycle();

        // Inject data into controller
        if (this.gameController && this.dataManager) {
            this.gameController.userData = this.dataManager.userData;
            
            // Initial UI update
            if (this.hud) {
                this.hud.updateCoins(this.gameController.userData.coins);
                this.hud.updateCoinBoostUI(this.dataManager.getDisplayRankForCurrentUser?.());
            }
            if (this.menus) {
                this.menus.updateShopCoins(this.gameController.userData.coins);
                this.menus.playButton.textContent = 'PLAY';
                this.menus.playButton.disabled = false;
            }
            
            // Apply theme
            this.gameController.applyPalette();
        }

        if (this.easterEgg) this.easterEgg.spritesLoaded = true;
        
        if (this.loadingScreen) this.loadingScreen.style.display = 'none';

        if (this.splashScreen) await this.splashScreen.run();

        if (this.gameController) {
            this.gameController.gameLoop();
            this.gameController.startMenuMenuMusic(); 
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new JumpLine();
});