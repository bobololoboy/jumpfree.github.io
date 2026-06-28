import { PLAYER_DEFAULTS, PHYSICS, POWERUP_DURATION } from './constants.js';
import { checkCollisions } from './playerCollision.js';
import { renderPlayer } from './playerRender.js';

export class Player {
    constructor(x, y, particleManager, audioManager, onCollectPowerup) {
        this.startX = x;
        this.startY = y;
        this.particles = particleManager;
        this.audio = audioManager;
        this.onCollectPowerup = onCollectPowerup;
        this.palette = { background: 'white', foreground: 'black' };
        this.deathEffect = 'default';
        this.reset();
    }

    setPalette(palette, deathEffect = 'default') {
        this.palette = palette;
        this.deathEffect = deathEffect;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.baseWidth = PLAYER_DEFAULTS.WIDTH;
        this.baseHeight = PLAYER_DEFAULTS.HEIGHT;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.direction = 1;
        this.jumpSquash = 0;

        this.speed = PLAYER_DEFAULTS.SPEED;
        this.jumpPower = PLAYER_DEFAULTS.JUMP_POWER;
        
        this.doubleJumpCharges = 0;
        this.canDoubleJump = false;
        this.slowFalling = false;
        this.slowFallTimer = 0;
        this.flying = false;
        this.flyTimer = 0;

        this.shrunk = false;
        this.shrinkTimer = 0;

        // UI hook for Speed power timer (managed by GameController)
        this.speedTimer = 0;

        this.lives = PLAYER_DEFAULTS.LIVES;
        this.isDead = false;
        this.deathParts = [];
        this.deathTimer = 0;

        // Short invincibility window to prevent immediate re-death on respawn
        this.invincibleTimer = 0;

        this.audio.stopAllLoops(0); // Stop any lingering sounds
    }

    jump() {
        if (this.onGround) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
            this.canDoubleJump = true;
            this.jumpSquash = 1;
            this.particles.createBurst(this.x + this.width / 2, this.y + this.height, 12, this.palette.foreground);
            this.audio.play('jump');
        } else if (this.canDoubleJump && this.doubleJumpCharges > 0) {
            this.velocityY = -this.jumpPower;
            this.doubleJumpCharges--;
            this.canDoubleJump = false;
            this.jumpSquash = 1;
            this.particles.createBurst(this.x + this.width / 2, this.y + this.height, 12, this.palette.foreground, true);
            this.audio.play('double_jump');
        }
    }

    collectPowerup(type) {
        this.audio.play('collect_powerup');
        if (type === 'doubleJump') {
            this.doubleJumpCharges++;
        } else if (type === 'slowFall') {
            this.slowFalling = true;
            this.slowFallTimer += POWERUP_DURATION.SLOW_FALL;
        } else if (type === 'fly') {
            if (!this.flying) {
                this.audio.playLoop('fly_hover');
            }
            this.flying = true;
            this.flyTimer += POWERUP_DURATION.FLY;
        } else if (type === 'life') {
            this.lives = Math.min(this.lives + 1, PLAYER_DEFAULTS.LIVES);
        } else if (type === 'shrink') {
            // Apply shrink immediately
            const factor = 0.6;
            if (!this.shrunk) {
                // Anchor from bottom-center
                const bottom = this.y + this.height;
                const centerX = this.x + this.width / 2;
                this.width = Math.max(8, Math.floor(this.baseWidth * factor));
                this.height = Math.max(8, Math.floor(this.baseHeight * factor));
                this.x = centerX - this.width / 2;
                this.y = bottom - this.height;
                this.shrunk = true;
            }
            this.shrinkTimer += POWERUP_DURATION.SHRINK;
        } else if (type === 'invincibility') {
            this.invincibleTimer += POWERUP_DURATION.INVINCIBILITY;
        } else if (type === 'speed') {
            // Speed (time dilation) is handled by GameController; no direct player state change here
        }
        // Notify after state is updated so HUD reflects the new values (e.g., lives)
        this.onCollectPowerup(type);
    }

    die() {
        if(this.isDead) return;
        this.isDead = true;
        this.deathTimer = 0;
        this.lives = Math.max(0, this.lives - 1);
        const playerVx = this.velocityX;

        if (this.flying) {
            this.audio.stopLoop('fly_hover', 0.1);
        }

        this.particles.createDeathBurst(this.x + this.width / 2, this.y + 24);
        this.audio.play('player_die');
        
        const partSize = 20;

        // NEW: Check for crumble effect first
        if (this.deathEffect === 'crumble') {
            const count = 12 + Math.floor(Math.random() * 8);
            this.deathParts = [];
            for (let i = 0; i < count; i++) {
                // Directional burst based on player's last velocity
                const horizontalMomentum = playerVx * 0.8 + (Math.random() - 0.5) * 4;
                this.deathParts.push({
                    type: 'crumble',
                    x: this.x + (this.width / 2) + (Math.random() - 0.5) * this.width,
                    y: this.y + (Math.random() * this.height * 0.8),
                    radius: (Math.random() * 2 + 1.5),
                    w: 0, // for collision compatibility
                    h: 0,
                    vx: horizontalMomentum,
                    vy: -2 - Math.random() * 4,
                    rot: 0,
                    rotSpd: (Math.random() - 0.5) * 0.08,
                    life: 1500 + Math.random() * 500,
                });
            }
            return;
        }

        // If water death effect is active, start the melt animation
        if (this.deathEffect === 'water') {
            // Create two parts representing head and torso that will animate
            this.deathParts = [
                { 
                    type: 'melting_part', 
                    sprite: 'deadhead', 
                    x: this.x + (this.width - partSize) / 2, 
                    y: this.y, 
                    w: partSize, 
                    h: partSize, 
                    meltTimer: 0,
                    meltDuration: 500, // ms to flatten
                    melted: false,
                },
                { 
                    type: 'melting_part', 
                    sprite: 'deadtorso', 
                    x: this.x + (this.width - partSize) / 2, 
                    y: this.y + 24, 
                    w: partSize, 
                    h: partSize, 
                    meltTimer: 0,
                    meltDuration: 500,
                    melted: false,
                }
            ];
            return;
        }

        // If hacker death effect is active, crumble into MATRIX letters instead of SVG parts
        if (this.deathEffect === 'matrix') {
            const HACKER_CHARS = '01';
            const count = 10 + Math.floor(Math.random() * 6);
            this.deathParts = [];
            for (let i = 0; i < count; i++) {
                this.deathParts.push({
                    type: 'matrix',
                    char: HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)],
                    x: this.x + (this.width - partSize) / 2 + (Math.random() - 0.5) * 12,
                    y: this.y + (Math.random() * this.height * 0.8),
                    w: partSize,
                    h: partSize,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -3 - Math.random() * 3,
                    rot: 0,
                    rotSpd: (Math.random() - 0.5) * 0.1,
                    life: 1200 + Math.random() * 600,
                });
            }
            return;
        }

        // Default crumble into head/torso sprites
        this.deathParts = [
            { sprite: 'deadhead', x: this.x + (this.width - partSize) / 2, y: this.y, w: partSize, h: partSize, vx: playerVx * 0.5 + (Math.random() - 0.5) * 8, vy: -5 - Math.random() * 3, rot: 0, rotSpd: (Math.random() - 0.5) * 0.1 },
            { sprite: 'deadtorso', x: this.x + (this.width - partSize) / 2, y: this.y + 24, w: partSize, h: partSize, vx: playerVx * 0.5 + (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 2, rot: 0, rotSpd: (Math.random() - 0.5) * 0.08 }
        ];
    }

    respawn(x, y) {
        this.isDead = false;
        this.deathParts = [];
        this.deathTimer = 0;
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.canDoubleJump = false;
        // Grant brief invulnerability after respawn to avoid stacked deaths
        this.invincibleTimer = 3000; // ms
        // Clear temporary effects on respawn
        if (this.shrunk) {
            const bottom = this.y + this.height;
            const centerX = this.x + this.width / 2;
            this.width = this.baseWidth;
            this.height = this.baseHeight;
            this.x = centerX - this.width / 2;
            this.y = bottom - this.height;
            this.shrunk = false;
            this.shrinkTimer = 0;
        }
    }
    
    update(keys, chunks, deltaTime, timeScale = 1) {
        if (!deltaTime) return; // Don't update if deltaTime is not valid

        // Tick down invincibility
        if (this.invincibleTimer > 0) {
            this.invincibleTimer = Math.max(0, this.invincibleTimer - deltaTime * timeScale);
        }

        // Normalize per-frame movement to 60 FPS baseline
        const dt = Math.max(0.25, Math.min(2, deltaTime / (1000 / 60))); // clamp to avoid large spikes

        if (this.isDead) {
            this.updateDeathAnimation(chunks, deltaTime, timeScale);
            this.deathTimer += deltaTime * timeScale;
            return;
        }
        
        // Horizontal movement
        if (keys['a'] || keys['arrowleft']) {
            this.velocityX = -this.speed;
            this.direction = -1;
        } else if (keys['d'] || keys['arrowright']) {
            this.velocityX = this.speed;
            this.direction = 1;
        } else {
            this.velocityX *= PHYSICS.FRICTION;
        }

        // Apply movement scaled by time and normalized dt
        const moveAmount = this.velocityX * timeScale * dt;
        this.x += moveAmount;

        // Power-up timers
        if (this.flying) {
            if (keys['w'] || keys['arrowup'] || keys[' ']) this.velocityY = -this.speed;
            this.flyTimer -= deltaTime;
            if (this.flyTimer <= 0) { 
                this.flying = false; 
                this.flyTimer = 0; 
                this.audio.stopLoop('fly_hover');
            }
        }
        if (this.slowFalling) {
            this.slowFallTimer -= deltaTime;
            if (this.slowFallTimer <= 0) { this.slowFalling = false; this.slowFallTimer = 0; }
        }
        if (this.shrunk) {
            this.shrinkTimer -= deltaTime;
            if (this.shrinkTimer <= 0) {
                // Restore size, keep anchored at bottom-center
                const bottom = this.y + this.height;
                const centerX = this.x + this.width / 2;
                this.width = this.baseWidth;
                this.height = this.baseHeight;
                this.x = centerX - this.width / 2;
                this.y = bottom - this.height;
                this.shrunk = false;
                this.shrinkTimer = 0;
            }
        }

        // Gravity (normalized by dt)
        let gravity = this.slowFalling ? PHYSICS.SLOW_FALL_GRAVITY : PHYSICS.GRAVITY;
        if (!this.flying) {
            this.velocityY += gravity * timeScale * dt;
        }

        // Position update - vertical only, horizontal is done above.
        const verticalMoveAmount = this.velocityY * timeScale * dt;
        this.y += verticalMoveAmount;

        if (this.jumpSquash > 0) this.jumpSquash -= 0.08 * timeScale * dt;

        this.checkCollisions(chunks, moveAmount, verticalMoveAmount);
    }

    updateDeathAnimation(chunks, deltaTime, timeScale = 1) {
        // Normalize per-frame motion to 60 FPS baseline
        const dt = Math.max(0.25, Math.min(2, deltaTime / (1000 / 60)));

        for (let part of this.deathParts) {
            // New logic for the melting animation
            if (part.type === 'melting_part') {
                if (!part.melted) {
                    part.meltTimer += deltaTime * timeScale;
                    if (part.meltTimer >= part.meltDuration) {
                        part.melted = true;
                        // When melt completes, spawn goo particles
                        for (let i = 0; i < 8; i++) {
                            this.particles.particles.push({
                                type: 'goo_drop',
                                x: part.x + part.w / 2 + (Math.random() - 0.5) * 20,
                                y: part.y + part.h * 0.8,
                                velocityX: (Math.random() - 0.5) * 3,
                                velocityY: -Math.random() * 2,
                                size: Math.random() * 8 + 6,
                                life: 60 + Math.random() * 40,
                                color: '#222222'
                            });
                        }
                    }
                }
                continue; // Skip physics for melting parts
            }
            
            part.vy += PHYSICS.GRAVITY * timeScale * dt;
            part.x += part.vx * timeScale * dt;
            part.y += part.vy * timeScale * dt;
            part.rot += part.rotSpd * timeScale * dt;

            if (part.type === 'matrix') {
                part.life -= deltaTime * timeScale;
                if (Math.random() < 0.3) { // Change character occasionally
                    const HACKER_CHARS = '01';
                    part.char = HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)];
                }
            }

            const partHeight = part.type === 'crumble' ? part.radius * 2 : part.h;
            const partWidth = part.type === 'crumble' ? part.radius * 2 : part.w;

            for (let chunk of Object.values(chunks)) {
                for (let platform of chunk.platforms) {
                    if (part.x + partWidth > platform.x && part.x < platform.x + platform.width &&
                        part.y + partHeight > platform.y && part.y < platform.y + platform.height) {
                        
                        if (part.vy > 0 && part.y < platform.y - partHeight/2) {
                            part.y = platform.y - partHeight;
                            part.vy = -part.vy * 0.5; // bounce
                            part.vx *= 0.8; // friction
                            if (Math.abs(part.vy) < 1) part.vy = 0;
                        }
                    }
                }
            }
        }
    }

    // Delegated collision check
    checkCollisions(chunks, moveAmount, verticalMoveAmount = 0) {
        checkCollisions(this, chunks, moveAmount, verticalMoveAmount);
    }
    
    // Delegated render
    render(ctx, assets, isPerformanceMode = false) {
        renderPlayer(ctx, this, assets, isPerformanceMode);
    }
}