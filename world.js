import { WORLD_DEFAULTS } from './constants.js';
import * as WorldGen from './worldGen.js';
import * as WorldCollision from './worldCollision.js';
import * as WorldRender from './worldRender.js';
import * as EnemyUpdate from './enemyUpdate.js';

export class World {
    constructor(canvas, particleManager) {
        this.canvas = canvas;
        this.particles = particleManager;
        this.chunkWidth = WORLD_DEFAULTS.CHUNK_WIDTH;
        this.groundHeight = WORLD_DEFAULTS.GROUND_HEIGHT;
        this.palette = { background: 'white', foreground: 'black' };
        this.textureUrl = null;
        this.texturePattern = null;
        this.textureLoading = false;
        this.playerRef = null;
        this.lifePowerupPresent = false;
        this.goombas = []; 
        this.flyingEnemies = []; 
        this.chunkEndHeights = {}; // Cache for deterministic generation continuity
        this.lastPlatformY = 0; 
        this.reset();
    }

    setPlayerRef(player) {
        this.playerRef = player;
    }

    setPalette(palette, textureUrl = null) {
        this.palette = palette;
        this.textureUrl = textureUrl;
        this.texturePattern = null; 
        this.textureLoading = false;
    }

    reset() {
        this.chunks = {};
        this.powerups = [];
        this.goombas = []; 
        this.flyingEnemies = []; 
        this.lifePowerupPresent = false;
        this.chunkEndHeights = {};
        this.lastPlatformY = this.canvas.height - this.groundHeight;
        // Seed initial height
        this.chunkEndHeights[-1] = this.lastPlatformY;
        this.generateInitialChunks();
    }

    // --- DELEGATED GENERATION METHODS ---

    generateInitialChunks() {
        WorldGen.generateInitialChunks(this);
    }
    
    generateChunk(chunkIndex) {
        WorldGen.generateChunk(this, chunkIndex);
    }

    generateMoreChunks(playerX) {
        WorldGen.generateMoreChunks(this, playerX);
    }

    ensureStartPowerup() {
        WorldGen.ensureStartPowerup(this);
    }
    
    spawnGoombaOnPlatform(platform) {
        return WorldGen.spawnGoombaOnPlatform(this, platform);
    }

    // --- DELEGATED COLLISION METHODS ---

    checkPowerupCollisions(player) {
        WorldCollision.checkPowerupCollisions(this, player);
    }

    checkJumpPadCollisions(player) {
        return WorldCollision.checkJumpPadCollisions(this, player);
    }

    checkHazardCollisions(player) {
        return WorldCollision.checkHazardCollisions(this, player);
    }

    findSafeSpawnPoint(playerX) {
        return WorldCollision.findSafeSpawnPoint(this, playerX);
    }
    
    isPlatformSafeForSpawn(platform, chunk, w, h) {
        return WorldCollision.isPlatformSafeForSpawn(this, platform, chunk, w, h);
    }

    // --- UPDATE LOOP ---

    update(timeScale = 1, dt = 1) {
        if (isNaN(timeScale) || timeScale <= 0) return;

        for (let chunk of Object.values(this.chunks)) {
            for (let spinner of chunk.spinners) {
                spinner.angle += spinner.angleSpeed * timeScale * dt;

                spinner.y += spinner.speed * spinner.direction * timeScale * dt;
                if (spinner.y > spinner.patrolEndY) {
                    spinner.y = spinner.patrolEndY;
                    spinner.direction = -1;
                } else if (spinner.y < spinner.patrolStartY) {
                    spinner.y = spinner.patrolStartY;
                    spinner.direction = 1;
                }
            }
            for (let pad of chunk.jumpPads) {
                if (pad.squish > 0) {
                    pad.squish -= 0.08 * dt * timeScale;
                }
            }
        }

        EnemyUpdate.updateGoombas(this, timeScale, dt);
        EnemyUpdate.updateFlyingEnemies(this, timeScale, dt);
    }

    // --- RENDER ---
    
    render(ctx, camera) {
        WorldRender.renderWorld(this, ctx, camera);
    }
}