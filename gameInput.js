export class GameInput {
    constructor(controller) {
        this.controller = controller;
    }

    setupEventListeners() {
        const { canvas, menus } = this.controller;

        window.addEventListener('resize', () => {
            this.controller.resizeCanvas();
        });

        window.addEventListener('beforeunload', () => {
            if (this.controller.gameState === 'playing' || this.controller.gameState === 'gameOver') {
                this.controller.saveUserData();
            }
        });

        this.controller.controls.on('jump', () => {
            if (this.controller.gameState === 'playing' && !this.controller.player.isDead) {
                this.controller.player.jump();
            }
        });

        this.controller.controls.on('back-to-menu', () => {
            if (this.controller.gameState === 'playing') {
                this.controller.audio.play('button_click');
                this.controller.lifecycle.backToMenu();
            }
        });

        this.controller.controls.on('keySequence', (sequence) => {
            if (this.controller.gameState === 'menu') {
                this.controller.easterEgg.check(sequence);
            }
        });

        this.controller.controls.on('pause-toggle', () => {
            if (this.controller.gameState === 'playing' || this.controller.gameState === 'paused') {
                this.controller.lifecycle.togglePause();
            }
        });

        // SPECIAL: Only allow @Absolutely_Aaden123 to spawn a random powerup with backslash
        this.controller.controls.on('spawn-ability', () => {
            if (this.controller.gameState !== 'playing') return;
            const username = this.controller.dataManager?.currentUsername;
            if (username === 'Absolutely_Aaden123') {
                this.controller.powerupSystem.spawnRandomPowerupInFront();
            }
        });

        // NEW: Admin Panel Toggle
        this.controller.controls.on('spawn-goomba', () => { // '/' key mapped to this event name in controls.js
            const username = this.controller.dataManager?.currentUsername;
            if (username === 'Absolutely_Aaden123') {
                this.controller.menus.toggleAdminPanel();
            }
        });

        document.addEventListener('start-game', () => this.controller.lifecycle.startGame());
        document.addEventListener('restart-game', () => this.controller.lifecycle.restartGame());
        document.addEventListener('back-to-menu', () => this.controller.lifecycle.backToMenu());
    }
}