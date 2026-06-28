import { COIN_VALUES } from './constants.js';
import { GameInput } from './gameInput.js';
import { GameLifecycle } from './gameLifecycle.js';
import { PowerupSystem } from './powerupSystem.js';
import { ShopBridge } from './shopBridge.js';
import { CameraController } from './cameraController.js';

export class GameController {
    constructor(app) {
        this.app = app; 
        this.resolutionScale = 1;
        this.dataManager = app.dataManager;
        this.player = app.player;
        this.world = app.world;
        this.menus = app.menus;
        this.hud = app.hud;
        this.audio = app.audio;
        this.controls = app.controls;
        this.particles = app.particles;
        this.easterEgg = app.easterEgg;
        this.canvas = app.canvas;
        this.ctx = app.ctx;
        this.assets = app.assets;
        this.visualizer = app.visualizer;

        this.gameState = 'menu';
        this.isGameOver = false;
        this.gameOverPending = false;
        this.timer = 0;
        this.lastFrameTime = 0;
        this.currentRunMilestones = [];
        
        this.userData = this.dataManager.userData;

        this.world.setPlayerRef(this.player);

        // Initialize sub-controllers
        this.camera = new CameraController(this.canvas, this.player);
        this.powerupSystem = new PowerupSystem(this);
        this.shopBridge = new ShopBridge(this);
        this.lifecycle = new GameLifecycle(this);
        this.input = new GameInput(this);
        
        this.input.setupEventListeners();

        // Subscribe to data changes (coins, etc.) to keep HUD/UI in sync automatically
        this.dataManager.subscribe((data) => {
            // Keep local reference updated if object reference changed
            this.userData = data; 
            
            // Update HUD
            this.hud.updateCoins(data.coins);
            
            // Update Shop UI if open (this might be redundant if shop polls, but good for safety)
            this.menus.updateShopCoins(data.coins);
            
            // Check rank updates if coins changed (rank bonus multiplier might change visually)
            if (this.hud.devBadge) {
                 const mult = this.dataManager.getCoinMultiplierForCurrentUser();
                 this.hud.setDevBadge(mult > 1 ? mult : null);
            }
        });

        // Special visual effects state
        this.blackKnifeTimer = 0;
        this.blackKnifeTrail = [];
        
        this.resolutionScale = 1;
    }

    resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Apply resolution scaling (pixelation effect)
        this.canvas.width = Math.ceil(width * this.resolutionScale);
        this.canvas.height = Math.ceil(height * this.resolutionScale);
        
        // Ensure CSS stretches it back to full screen
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        // Pass the FULL (virtual) window size to the camera so it centers correctly
        if (this.camera) {
            this.camera.setViewport(width, height);
        }

        if (this.menus && this.menus.menuCanvas) {
            this.menus.menuCanvas.width = width;
            this.menus.menuCanvas.height = height;
        }
    }

    onCollectPowerup(type) {
        this.powerupSystem.onCollectPowerup(type);
    }
    
    // Bridge methods called by input/lifecycle
    startGame() { this.lifecycle.startGame(); }
    restartGame() { this.lifecycle.restartGame(); }
    backToMenu() { this.lifecycle.backToMenu(); }
    togglePause() { this.lifecycle.togglePause(); }
    saveUserData() { this.dataManager.saveUserData(); }
    
    // Bridge methods for shop UI
    buyPalette(key) { this.shopBridge.buyPalette(key); }
    equipPalette(key) { this.shopBridge.equipPalette(key); }
    buySong(key) { this.shopBridge.buySong(key); }
    equipSong(key) { this.shopBridge.equipSong(key); }
    equipDeathEffect(key) { this.shopBridge.equipDeathEffect(key); }
    applyPalette() { this.shopBridge.applyPalette(); }
    deleteUserDataWithConfirmation() { this.shopBridge.deleteUserDataWithConfirmation(); }

    startMenuMenuMusic() { this.lifecycle.startMenuMenuMusic(); }

    updateTimerAndHUD(deltaTime) {
        if (!deltaTime || deltaTime <= 0) return;
        if (!this.player.isDead) {
            this.timer += deltaTime;
        }
        const distance = Math.max(0, Math.floor((this.player.x - 100) / 10));
        this.hud.updateDistance(distance);
        this.hud.updateTimer(this.timer);
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime);
        this.lastFrameTime = now;
        
        if (deltaTime <= 0) return;

        // Normalize to 60 FPS baseline
        const dt = Math.max(0.25, Math.min(2, deltaTime / (1000 / 60)));

        // Determine active global time scale
        const baseTimeScale = this.lifecycle.deathSlowmoActive ? this.lifecycle.deathSlowmoFactor : 1;

        // Progress Speed stacks
        this.powerupSystem.tickSpeedStacks(deltaTime);
        this.updateTimerAndHUD(deltaTime);

        // Update Black Knife special effect
        if (this.userData.equipped_song === 'black_knife_song') {
            this.blackKnifeTimer += deltaTime * 0.003;
            // Update trails
            const img = this.assets.get('YOUR DEAD');
            if (img) {
                // Determine target position (screen space)
                const targetX = this.canvas.width - 200 + Math.cos(this.blackKnifeTimer * 0.8) * 50;
                const targetY = this.canvas.height / 2 - 150 + Math.sin(this.blackKnifeTimer) * 100;

                // Base scale respects resolutionScale so it doesn't blow up on pixelated modes
                const trailBaseScale = 1.5 * this.resolutionScale;
                
                // Add to trail periodically
                if (Math.random() < 0.3 * dt) { // Density control
                    this.blackKnifeTrail.push({
                        x: targetX,
                        y: targetY,
                        alpha: 0.6,
                        scale: trailBaseScale
                    });
                }
            }
            
            // Update trail particles
            for (let i = this.blackKnifeTrail.length - 1; i >= 0; i--) {
                const t = this.blackKnifeTrail[i];
                t.alpha -= 0.01 * dt;
                t.scale -= 0.005 * dt * this.resolutionScale;
                if (t.alpha <= 0 || t.scale <= 0) {
                    this.blackKnifeTrail.splice(i, 1);
                }
            }
        } else {
            // Clear if switched away
            if (this.blackKnifeTrail.length > 0) this.blackKnifeTrail = [];
        }

        if (this.gameState !== 'playing') {
            if (this.gameState === 'paused') {
                this.particles.update(baseTimeScale, dt);
            }
            return;
        }

        const playerTimeScale = baseTimeScale;
        const worldTimeScale = baseTimeScale;
        const particlesTimeScale = baseTimeScale;

        this.player.update(this.controls.keys, this.world.chunks, deltaTime, playerTimeScale);
        this.world.update(worldTimeScale, dt);
        this.world.generateMoreChunks(this.player.x);
        this.particles.update(particlesTimeScale, dt);
        
        const distance = Math.max(0, Math.floor((this.player.x - 100) / 10));
        this.checkDistanceMilestones(distance);
        this.hud.updatePowerupUI(this.player);
        
        this.world.checkPowerupCollisions(this.player);

        let hitHazard = false;
        if (this.player.invincibleTimer <= 0) {
            hitHazard = this.world.checkHazardCollisions(this.player);
        }

        // Death logic
        if ((hitHazard || this.player.y > this.canvas.height + 100) && !this.player.isDead) {
            this.player.die();
            this.hud.updateLives(this.player.lives);
            this.lifecycle.triggerDeathSequence();
        }
        
        // Respawn delay check
        if (!this.menus.isSkipAnimations && this.player.isDead && this.player.lives > 0 && this.player.deathTimer > 3000) {
            if (this.gameState !== 'gameOver') {
                const spawnPoint = this.world.findSafeSpawnPoint(this.player.x);
                this.player.respawn(spawnPoint.x, spawnPoint.y);
            }
        }

        this.lifecycle.handleDeath(deltaTime);
        this.camera.update();
    }

    checkDistanceMilestones(distance) {
        for (const milestone of COIN_VALUES.MILESTONES) {
            if (distance >= milestone.distance && !this.currentRunMilestones.includes(milestone.distance)) {
                this.currentRunMilestones.push(milestone.distance);
                this.addCoins(milestone.coins);
            }
        }
        
        const { start, interval, coins } = COIN_VALUES.REPEATING_MILESTONE;
        if (distance >= start) {
            const times = Math.floor((distance - start) / interval) + 1;
            const milestoneId = `repeating_${times}`;
            if (!this.currentRunMilestones.includes(milestoneId)) {
                this.currentRunMilestones.push(milestoneId);
                this.addCoins(coins);
            }
        }
    }

    addCoins(amount) {
        // Delegate to DataManager. The subscription will handle UI updates.
        this.dataManager.addCoins(amount);
        
        // If shop is open, refresh items (to update button states)
        if (this.menus.shopPopup && this.menus.shopPopup.classList.contains('show')) {
            this.menus.renderShopItems();
        }
    }

    render() {
        const paletteConf = this.shopBridge.controller.userData && this.shopBridge.controller.userData.equipped_palette 
            ? null // handled inside applyPalette / global CSS generally, but here we need background for clear
            : null; 
        
        // Background clearing is simple, colors are managed by shopBridge.applyPalette mostly via DOM/CSS vars
        // But canvas still needs a clear.
        const color = getComputedStyle(document.body).getPropertyValue('--background-color').trim() || 'white';
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.assets.spritesLoaded) return;
        
        this.ctx.save();

        // Apply resolution scaling to the context so game units map to the smaller canvas correctly
        if (this.resolutionScale && this.resolutionScale !== 1) {
             this.ctx.scale(this.resolutionScale, this.resolutionScale);
        }
        
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.world.render(this.ctx, this.camera);
        this.particles.render(this.ctx);
        this.player.render(this.ctx, this.assets, this.menus.isPerformanceMode);
        
        this.ctx.restore();

        // Screen-space effects
        if (this.userData.equipped_song === 'black_knife_song') {
            const img = this.assets.get('YOUR DEAD');
            if (img) {
                this.ctx.save();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen coords
                
                // Draw trails
                for (const t of this.blackKnifeTrail) {
                    this.ctx.globalAlpha = t.alpha;
                    const w = img.width * t.scale * 0.5; 
                    const h = img.height * t.scale * 0.5;
                    this.ctx.drawImage(img, t.x - w/2, t.y - h/2, w, h);
                }

                // Draw main image
                const targetX = this.canvas.width - 200 + Math.cos(this.blackKnifeTimer * 0.8) * 50;
                const targetY = this.canvas.height / 2 - 150 + Math.sin(this.blackKnifeTimer) * 100;
                this.ctx.globalAlpha = 1.0;
                // Scale with resolution so Gameboy / pixelated modes don't over-zoom the graphic
                const mainScale = 0.75 * this.resolutionScale;
                const mw = img.width * mainScale;
                const mh = img.height * mainScale;
                this.ctx.drawImage(img, targetX - mw/2, targetY - mh/2, mw, mh);

                this.ctx.restore();
            }
        }
    }

    gameLoop() {
        if (this.gameState === 'playing' || this.gameState === 'paused') {
             if (!this.isGameOver) {
                this.update();
                this.render();
            }
        } else if (this.gameState === 'menu') {
            this.menus.updateMenu();
            this.easterEgg.update();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}