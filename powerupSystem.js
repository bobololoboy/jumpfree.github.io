import { COIN_VALUES, POWERUP_DURATION, GOOMBA_DEFAULTS } from './constants.js';

export class PowerupSystem {
    constructor(controller) {
        this.controller = controller;
        // Speed power (stacking) state
        this.speedStacks = [];      // array of remaining ms for each stack
        this.speedMultiplier = 1;   // 2x per stack
    }

    onCollectPowerup(type) {
        if (type === 'goomba_kill') {
            this.controller.addCoins(5);
            this.controller.audio.play('collect_powerup');
            return;
        }
        
        if (type === 'flying_enemy_kill') {
            this.controller.addCoins(8);
            this.controller.audio.play('collect_powerup');
            return;
        }
        
        if (type === 'reinhardt_kill') {
            this.controller.addCoins(15);
            this.controller.audio.play('collect_powerup');
            return;
        }

        this.controller.addCoins(COIN_VALUES.POWERUP);
        if (type === 'life') {
            this.controller.hud.updateLives(this.controller.player.lives);
        }
        
        if (type === 'speed') {
            // Stacking: each pickup adds a 2x stack with its own timer
            // Limit stacks to prevent absurdity/lag
            if (this.speedStacks.length < 5) {
                this.speedStacks.push(POWERUP_DURATION.SPEED);
                this.updateSpeedMultiplier();
                this.updateSpeedHUDTimer();
            } else {
                 // Refresh oldest stack instead of adding new one
                 this.speedStacks[0] = POWERUP_DURATION.SPEED;
                 this.updateSpeedHUDTimer();
            }
        }
    }

    reset() {
        this.speedStacks = [];
        this.speedMultiplier = 1;
        this.updateSpeedMultiplier(); // Resets player speed
        this.updateSpeedHUDTimer();
    }

    // --- Speed stacking helpers ---
    updateSpeedMultiplier() {
        // 2^stacks, minimum 1
        const stacks = this.speedStacks.length;
        const newMult = Math.max(1, Math.pow(2, stacks));
        this.speedMultiplier = newMult;
        // Update player's move speed relative to default
        const baseSpeed = 5;
        if (this.controller.player) {
            this.controller.player.speed = baseSpeed * this.speedMultiplier;
        }
    }

    tickSpeedStacks(deltaMs) {
        if (!this.speedStacks.length) {
            this.updateSpeedHUDTimer();
            return;
        }
        // Decrease each stack; remove expired ones
        for (let i = this.speedStacks.length - 1; i >= 0; i--) {
            this.speedStacks[i] -= deltaMs;
            if (this.speedStacks[i] <= 0) {
                this.speedStacks.splice(i, 1);
            }
        }
        this.updateSpeedMultiplier();
        this.updateSpeedHUDTimer();
    }

    updateSpeedHUDTimer() {
        // HUD shows total remaining time across all stacks
        const total = this.speedStacks.reduce((a, b) => a + Math.max(0, b), 0);
        if (this.controller.player) {
            this.controller.player.speedTimer = total;
        }
    }

    // Spawn a random ability directly ahead of the player
    spawnRandomPowerupInFront() {
        const types = ['doubleJump', 'slowFall', 'fly', 'shrink', 'speed', 'invincibility'];
        // Spawn life separately if conditions are met
        if (this.controller.player.lives < 2 && !this.controller.world.lifePowerupPresent) {
            types.push('life');
        }
        const type = types[Math.floor(Math.random() * types.length)];

        const player = this.controller.player;
        const world = this.controller.world;
        const aheadOffset = 120; // pixels in front of player
        const desiredX = player.x + aheadOffset;

        // Find a safe platform near desiredX within a small chunk range
        const baseChunk = Math.floor(desiredX / world.chunkWidth);
        const searchOffsets = [0, 1, -1, 2, -2];
        let spawnPos = null;

        for (const off of searchOffsets) {
            const idx = baseChunk + off;
            const chunk = world.chunks[idx];
            if (!chunk) continue;

            const platforms = chunk.platforms
                .slice()
                .sort((a, b) => {
                    const ca = Math.abs((a.x + a.width / 2) - desiredX);
                    const cb = Math.abs((b.x + b.width / 2) - desiredX);
                    return ca - cb;
                });

            for (const plat of platforms) {
                if (world.isPlatformSafeForSpawn(plat, chunk, player.width, player.height)) {
                    const px = plat.x + plat.width / 2 - 15;
                    const py = plat.y - 35;

                    const tooClose = world.powerups.some(p => !p.collected && Math.hypot((p.x) - px, (p.y) - py) < 60);
                    if (tooClose) continue;

                    spawnPos = { x: px, y: py, chunk };
                    break;
                }
            }
            if (spawnPos) break;
        }

        if (!spawnPos) return;

        world.powerups.push({
            x: spawnPos.x,
            y: spawnPos.y,
            width: 30,
            height: 30,
            type,
            collected: false
        });

        if (type === 'life') {
            world.lifePowerupPresent = true;
        }

        this.controller.particles.createMenuBurst(spawnPos.x + 15, spawnPos.y + 15, 10, this.controller.particles.palette.foreground);
    }

    spawnGoombaInFront() {
        const player = this.controller.player;
        const world = this.controller.world;
        const aheadOffset = 150;
        const desiredX = player.x + aheadOffset;

        const baseChunk = Math.floor(desiredX / world.chunkWidth);
        const searchOffsets = [0, 1, -1, 2, -2];
        let targetPlatform = null;

        for (const off of searchOffsets) {
            const idx = baseChunk + off;
            const chunk = world.chunks[idx];
            if (!chunk) continue;

            const platforms = chunk.platforms
                .filter(p => p.width >= 80)
                .slice()
                .sort((a, b) => Math.abs((a.x + a.width / 2) - desiredX) - Math.abs((b.x + b.width / 2) - desiredX));

            for (const plat of platforms) {
                if (world.isPlatformSafeForSpawn(plat, chunk, 30, 30)) {
                    targetPlatform = plat;
                    break;
                }
            }
            if (targetPlatform) break;
        }

        if (targetPlatform) {
            const success = world.spawnGoombaOnPlatform(targetPlatform);
            if (success) {
                this.controller.particles.createMenuBurst(targetPlatform.x + targetPlatform.width / 2, targetPlatform.y, 8, this.controller.particles.palette.foreground);
            }
        }
    }

    spawnFlyingEnemyInFront() {
        const player = this.controller.player;
        const world = this.controller.world;
        const spawnX = player.x + 200;
        const spawnY = player.y - 100;
        
        world.flyingEnemies.push({
            x: spawnX,
            y: spawnY,
            width: 40,
            height: 40,
            centerX: spawnX,
            centerY: spawnY,
            amplitude: 80,
            pattern: 'vertical',
            patternTimer: 0,
            dead: false,
            deathTimer: 0,
            type: 'reinhardt'
        });
        
        this.controller.particles.createMenuBurst(spawnX, spawnY, 8, this.controller.particles.palette.foreground);
    }
}