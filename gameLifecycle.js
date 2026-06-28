import { SONGS } from './constants.js';

export class GameLifecycle {
    constructor(controller) {
        this.controller = controller;
        
        this.deathSlowmoActive = false;
        this.deathSlowmoFactor = 0.15; 
        this.deathSlowmoElapsed = 0;
        this.deathSlowmoDuration = 1600;
        this.forcedGameOverTimeout = null;
    }

    startGame() {
        this.controller.menus.hideMainMenu();
        this.controller.easterEgg.deactivate();
        this.controller.gameState = 'playing';
        this.restartGame();
    }

    restartGame() {
        this.controller.menus.hideGameOver();
        this.controller.isGameOver = false;
        this.controller.gameOverPending = false;
        this.endDeathSlowMo();
        this.controller.gameState = 'playing';
        this.controller.timer = 0;
        this.controller.lastFrameTime = performance.now();
        this.controller.currentRunMilestones = [];
        if (this.forcedGameOverTimeout) {
            clearTimeout(this.forcedGameOverTimeout);
            this.forcedGameOverTimeout = null;
        }

        this.controller.world.reset();
        this.controller.player.reset();
        this.controller.hud.updateLives(this.controller.player.lives);
        this.controller.hud.updateDistance(0);
        this.controller.hud.updateTimer(0);
        this.controller.hud.updatePowerupUI(this.controller.player);

        this.controller.hud.updateCoinBoostUI(this.controller.dataManager.getDisplayRankForCurrentUser?.());

        if (this.controller.dataManager.isSpecialUser?.()) {
            this.controller.hud.setDevBadge(this.controller.dataManager.getCoinMultiplierForCurrentUser?.());
        } else {
            this.controller.hud.setDevBadge(null);
        }

        const equippedSongKey = this.controller.userData.equipped_song || 'default_song';
        const songPath = (SONGS[equippedSongKey]?.path || SONGS.default_song.path).replace(/\.(mp3|wav|ogg)$/, '');
        this.controller.audio.playBGM(songPath);

        this.controller.camera.reset();
        this.controller.powerupSystem.reset();
    }

    backToMenu() {
        this.controller.menus.hideGameOver();
        this.controller.menus.hidePauseMenu();
        this.controller.isGameOver = false;
        this.controller.gameOverPending = false;
        this.endDeathSlowMo();
        this.controller.gameState = 'menu';
        this.controller.easterEgg.deactivate();
        if (this.forcedGameOverTimeout) {
            clearTimeout(this.forcedGameOverTimeout);
            this.forcedGameOverTimeout = null;
        }
        this.controller.menus.showMainMenu();
        this.controller.hud.setDevBadge(null);
        
        this.startMenuMenuMusic();
    }

    async gameOver() {
        if (this.controller.isGameOver || this.controller.gameOverPending) return;
        this.controller.gameOverPending = true;
        if (this.forcedGameOverTimeout) {
            clearTimeout(this.forcedGameOverTimeout);
            this.forcedGameOverTimeout = null;
        }

        this.controller.audio.stopBGM();

        const distance = Math.max(0, Math.floor((this.controller.player.x - 100) / 10));
        const timeMs = Math.floor(this.controller.timer);

        let rank = null;
        (async () => {
            try {
                await this.controller.dataManager.submitScore(distance, timeMs);
                rank = await this.controller.dataManager.getUserRank();
                await this.controller.dataManager.updateUserRank();
                await this.controller.dataManager.updateTopInfo?.();

                this.controller.hud.updateCoinBoostUI(this.controller.dataManager.getDisplayRankForCurrentUser?.());
                if (this.controller.dataManager.isSpecialUser?.()) {
                    this.controller.hud.setDevBadge(this.controller.dataManager.getCoinMultiplierForCurrentUser?.());
                } else {
                    this.controller.hud.setDevBadge(null);
                }

                await this.controller.dataManager.saveUserData();
            } catch (e) {
                console.error("Error finalizing score data:", e);
            }
            setTimeout(() => {
                this.controller.isGameOver = true;
                this.controller.gameState = 'gameOver';
                this.endDeathSlowMo();
                this.controller.audio.stopAllLoops(0.6);
                this.controller.menus.showGameOver(distance, timeMs, rank);
                this.controller.menus.hidePauseMenu();
            }, 180);
        })();
    }
    
    togglePause() {
        if (this.controller.gameState === 'playing') {
            this.controller.gameState = 'paused';
            this.controller.menus.showPauseMenu();
        } else if (this.controller.gameState === 'paused') {
            this.controller.gameState = 'playing';
            this.controller.lastFrameTime = performance.now(); 
            this.controller.menus.hidePauseMenu();
            this.controller.menus.hideSettingsMenu(); 
            this.controller.menus.hideShopPopup();
        }
    }

    startMenuMenuMusic() {
        const equippedSongKey = this.controller.userData?.equipped_song || 'default_song';
        const fallbackKey = SONGS[equippedSongKey] ? equippedSongKey : 'default_song';
        const songPath = (SONGS[fallbackKey]?.path || SONGS.default_song.path).replace(/\.(mp3|wav|ogg)$/, '');
        this.controller.audio.playBGM(songPath);
    }
    
    startDeathSlowMo() {
        if (this.deathSlowmoActive) return;
        this.deathSlowmoActive = true;
        this.deathSlowmoElapsed = 0;
        this.controller.audio.enableSlowMoAudio(this.deathSlowmoFactor);
    }

    endDeathSlowMo() {
        if (!this.deathSlowmoActive) return;
        this.deathSlowmoActive = false;
        this.controller.audio.disableSlowMoAudio();
    }
    
    handleDeath(deltaTime) {
        // Handle fallback logic for death animation sequence if needed
        if (this.deathSlowmoActive) {
            this.deathSlowmoElapsed += deltaTime;
            if (this.deathSlowmoElapsed >= this.deathSlowmoDuration) {
                this.gameOver();
            }
        }
    }

    triggerDeathSequence() {
        if (this.controller.menus.isSkipAnimations) {
            this.controller.particles.clearAllParticles();
            this.controller.audio.stopAllLoops(0.1);
            if (this.controller.player.lives <= 0) {
                this.gameOver();
            } else {
                const spawnPoint = this.controller.world.findSafeSpawnPoint(this.controller.player.x);
                this.controller.player.respawn(spawnPoint.x, spawnPoint.y);
            }
        } else {
            if (this.controller.player.lives <= 0) {
                this.startDeathSlowMo();
                if (this.forcedGameOverTimeout) clearTimeout(this.forcedGameOverTimeout);
                this.forcedGameOverTimeout = setTimeout(() => {
                    this.gameOver();
                }, this.deathSlowmoDuration + 500);
            }
        }
    }
}