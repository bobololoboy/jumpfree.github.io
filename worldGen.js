import { WORLD_DEFAULTS } from './constants.js';
import { SeededRandom } from './utils.js';

export function generateInitialChunks(world) {
    for (let i = 0; i < 5; i++) {
        world.generateChunk(i);
    }
    world.ensureStartPowerup();
}

export function generateChunk(world, chunkIndex) {
    // 1. Initialize PRNG with chunk index as seed
    // Using a large prime multiplier to spread seeds for consecutive indices
    const seed = (chunkIndex * 1664525) + 1013904223; 
    const rng = new SeededRandom(seed);

    const chunk = {
        x: chunkIndex * world.chunkWidth,
        platforms: [],
        spikes: [],
        jumpPads: [],
        powerups: [],
        spinners: [],
    };
    const groundY = world.canvas.height - world.groundHeight;
    let x = chunk.x;
    
    // 2. Resolve Starting Height
    // If we have cached the previous chunk's end height, use it.
    // If not, we would technically need to generate previous chunks. 
    // Optimization: Just default to groundY or use a noise-like function if continuity breaks.
    // For now, we assume sequential generation is mostly preserved, but if we warp, we reset.
    let currentY = world.chunkEndHeights[chunkIndex - 1] !== undefined 
        ? world.chunkEndHeights[chunkIndex - 1] 
        : (world.lastPlatformY || groundY);

    if (chunkIndex > 0 && rng.chance(0.2)) {
        x += 50 + rng.range(0, 100);
    }

    // 3. Main Ground Generation
    while (x < chunk.x + world.chunkWidth) {
        let segmentWidth = 100 + rng.range(0, 200);
        if (x + segmentWidth > chunk.x + world.chunkWidth) {
            segmentWidth = chunk.x + world.chunkWidth - x;
        }
        if (segmentWidth < 50) break;

        if (chunkIndex > 1) {
            const distance = chunkIndex * world.chunkWidth / 10;
            let maxVerticalChangeFactor = 0;

            if (distance < 500) {
                maxVerticalChangeFactor = 0.25;
            } else if (distance >= 500 && distance <= 1000) {
                const progress = (distance - 500) / 500;
                maxVerticalChangeFactor = 0.25 + 0.75 * progress;
            } else {
                maxVerticalChangeFactor = 1.0;
            }
            const yChangeRange = 280 * maxVerticalChangeFactor;
            const yChange = (rng.range(0, yChangeRange) - yChangeRange / 2);
            currentY += yChange;

            const maxVerticality = 250 + 200 * maxVerticalChangeFactor;
            currentY = Math.max(groundY - maxVerticality, Math.min(groundY + 250, currentY));
        }
        
        let platformY = currentY; 

        let platform = { x, y: platformY, width: segmentWidth, height: world.groundHeight };
        chunk.platforms.push(platform);
        
        // Ground Hazards
        if (chunkIndex > 1 && rng.chance(0.7)) { 
           const count = Math.floor(segmentWidth / 40);
           for (let i = 0; i < count; i++) {
               if (rng.chance(0.6)) continue; // skip chance
               const hazardX = x + i * 40 + 10 + rng.range(0, 10);
               const hazardY = platformY - 20;

               if (rng.chance(0.15)) { 
                   chunk.jumpPads.push({ x: hazardX, y: hazardY, width: 20, height: 20, squish: 0 });
               } else {
                   chunk.spikes.push({ x: hazardX, y: hazardY, width: 20, height: 20 });
               }
           }
        }
        x += segmentWidth;

        // Gaps
        if (x < chunk.x + world.chunkWidth) {
            const gapWidth = 70 + rng.range(0, 80);

            if (gapWidth > 120 && chunkIndex > 1) {
                const types = ['doubleJump', 'fly'];
                const type = types[Math.floor(rng.next() * types.length)];
                const px = platform.x + platform.width / 2 - 15;
                const py = platform.y - 35;
                // Simple collision check against existing powerups (though new chunk implies empty)
                const tooClose = world.powerups.some(existing => {
                    const dx = existing.x - px;
                    const dy = existing.y - py;
                    return (dx * dx + dy * dy) < 3600;
                });
                if (!tooClose) {
                    world.powerups.push({ x: px, y: py, width: 30, height: 30, type, collected: false });
                }
            }

            if (chunkIndex > 5 && gapWidth > 150 && rng.chance(0.5 + Math.min(0.4, chunkIndex * 0.01))) {
                const spinnerX = x + gapWidth / 2;
                chunk.spinners.push({
                    x: spinnerX,
                    y: platformY - 100,
                    size: 40,
                    angle: rng.next() * Math.PI * 2,
                    angleSpeed: (rng.chance(0.5) ? 1 : -1) * 0.05,
                    patrolStartY: platformY - 150,
                    patrolEndY: platformY - 50,
                    speed: 1 + rng.next(),
                    direction: rng.chance(0.5) ? 1 : -1,
                });
            }
            x += gapWidth;
        }
    }
    
    // Save end height for next chunk
    world.chunkEndHeights[chunkIndex] = currentY;
    world.lastPlatformY = currentY; // Legacy update

    // 4. Floating Platforms
    const floatPlatCount = 6 + Math.floor(rng.next() * 7);
    for (let i = 0; i < floatPlatCount; i++) {
        let attempts = 0;
        let platform;
        do {
            platform = {
                x: chunk.x + rng.range(0, world.chunkWidth - 150),
                y: groundY - 120 - rng.range(0, 500),
                width: 80 + rng.range(0, 120),
                height: 20,
            };
            attempts++;
        } while (attempts < 10 && platformOverlaps(platform, chunk.platforms));
        
        if (attempts < 10) {
            chunk.platforms.push(platform);
            if (chunkIndex > 1 && rng.chance(0.6)) {
                const hazardX = platform.x + rng.range(0, platform.width - 20);
                const hazardY = platform.y - 20;
                if (rng.chance(0.20)) {
                    chunk.jumpPads.push({ x: hazardX, y: hazardY, width: 20, height: 20, squish: 0 });
                } else {
                    chunk.spikes.push({ x: hazardX, y: hazardY, width: 20, height: 20 });
                }
            }
        }
    }
    
    // 5. Enemy Spawning
    // Iterate platforms to spawn enemies more reliably
    if (chunkIndex >= 1) {
        const potentialPlatforms = chunk.platforms.filter(p => p.width >= 60); 
        let enemiesSpawnedInChunk = 0;
        const maxEnemies = 2; // Allow up to 2 per chunk

        // Shuffle platforms deterministically to randomize spawn locations
        for (let i = potentialPlatforms.length - 1; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [potentialPlatforms[i], potentialPlatforms[j]] = [potentialPlatforms[j], potentialPlatforms[i]];
        }

        for (const platform of potentialPlatforms) {
            if (enemiesSpawnedInChunk >= maxEnemies) break;

            // Spawn chance per platform
            const spawnChance = chunkIndex < 4 ? 0.6 : 0.35;

            if (rng.chance(spawnChance)) {
                const spawnX = platform.x + platform.width / 2;
                
                // Check overlaps
                const spikeOverlap = chunk.spikes.some(s => Math.abs(s.x - spawnX) < 40);
                if (spikeOverlap) continue;

                const spinnerOverlap = chunk.spinners.some(s => Math.abs(s.x - spawnX) < 60);
                if (spinnerOverlap) continue;

                const isTooCloseToPowerup = world.powerups.some(p => Math.abs(p.x - spawnX) < 50 && Math.abs(p.y - platform.y) < 100);
                if (isTooCloseToPowerup) continue;

                // Attempt spawn
                const success = world.spawnGoombaOnPlatform(platform);
                if (success) {
                    enemiesSpawnedInChunk++;
                }
            }
        }
    }

    // 6. Floating Powerups
    const safePlatforms = getSafePlatforms(chunk);
    if (safePlatforms.length > 0) {
        const baseChance = 0.75;
        const maxPerChunk = chunkIndex === 0 ? 1 : (3 + Math.floor(rng.next() * 2));
        for (let i = 0; i < maxPerChunk; i++) {
            if (rng.chance(baseChance)) {
                const p = safePlatforms[Math.floor(rng.next() * safePlatforms.length)];
                const types = ['doubleJump', 'slowFall', 'fly'];
                const type = types[Math.floor(rng.next() * types.length)];
                const px = p.x + p.width / 2 - 15;
                const py = p.y - 35;
                const tooClose = world.powerups.some(existing => {
                    const dx = existing.x - px;
                    const dy = existing.y - py;
                    return (dx * dx + dy * dy) < 3600;
                });
                if (!tooClose) {
                    world.powerups.push({ x: px, y: py, width: 30, height: 30, type, collected: false });
                }
            }
        }
        if (rng.chance(0.03)) {
            const p = safePlatforms[Math.floor(rng.next() * safePlatforms.length)];
            const px = p.x + p.width / 2 - 15;
            const py = p.y - 35;
            const tooClose = world.powerups.some(existing => Math.hypot(existing.x - px, existing.y - py) < 80);
            if (!tooClose) {
                world.powerups.push({ x: px, y: py, width: 30, height: 30, type: 'shrink', collected: false });
            }
        }
        if (rng.chance(0.01)) {
            const p = safePlatforms[Math.floor(rng.next() * safePlatforms.length)];
            const px = p.x + p.width / 2 - 15;
            const py = p.y - 35;
            const tooClose = world.powerups.some(existing => Math.hypot(existing.x - px, existing.y - py) < 120);
            if (!tooClose) {
                world.powerups.push({ x: px, y: py, width: 30, height: 30, type: 'speed', collected: false });
            }
        }
        if (chunkIndex > 2 && rng.chance(0.015)) {
            const p = safePlatforms[Math.floor(rng.next() * safePlatforms.length)];
            const px = p.x + p.width / 2 - 15;
            const py = p.y - 35;
            const tooClose = world.powerups.some(existing => Math.hypot(existing.x - px, existing.y - py) < 120);
            if (!tooClose) {
                world.powerups.push({ x: px, y: py, width: 30, height: 30, type: 'invincibility', collected: false });
            }
        }
    }
    
    world.chunks[chunkIndex] = chunk;
}

export function getSafePlatforms(chunk) {
    return chunk.platforms.filter(p => !chunk.spikes.some(s => s.x >= p.x - 50 && s.x <= p.x + p.width + 50));
}

export function ensureStartPowerup(world) {
    // We can use a fixed seed here or just random, it's run once.
    const rng = new SeededRandom(12345);
    const hasStartPowerup = world.powerups.some(p => p.x < world.chunkWidth * 0.75);
    if (hasStartPowerup) return;

    const startChunks = [0, 1].map(i => world.chunks[i]).filter(Boolean);
    for (const chunk of startChunks) {
        const safe = getSafePlatforms(chunk);
        if (safe.length === 0) continue;
        const p = safe[Math.floor(rng.next() * safe.length)];
        const px = p.x + p.width / 2 - 15;
        const py = p.y - 35;
        const tooClose = world.powerups.some(existing => Math.hypot(existing.x - px, existing.y - py) < 120);
        if (!tooClose) {
            world.powerups.push({ x: px, y: py, width: 30, height: 30, type: 'life', collected: false });
            world.lifePowerupPresent = true;
            return;
        }
    }
}

export function platformOverlaps(newPlatform, existingPlatforms) {
    const buffer = 30;
    for (let existing of existingPlatforms) {
        if (newPlatform.x < existing.x + existing.width + buffer &&
            newPlatform.x + newPlatform.width + buffer > existing.x &&
            newPlatform.y < existing.y + existing.height + buffer &&
            newPlatform.y + newPlatform.height + buffer > existing.y) {
            return true;
        }
    }
    return false;
}

export function generateMoreChunks(world, playerX) {
    const playerChunk = Math.floor(playerX / world.chunkWidth);
    
    // Generate forward AND backward if missing (buffer of 3 chunks ahead, 2 behind)
    for (let i = playerChunk - 2; i <= playerChunk + 3; i++) {
        // Prevent negative chunks unless desired, usually standard start is 0
        if (i >= 0 && !world.chunks[i]) {
             world.generateChunk(i);
        }
    }
    
    // Aggressive culling: Delete anything outside this range
    for (let i in world.chunks) {
        const idx = parseInt(i);
        if (idx < playerChunk - 3 || idx > playerChunk + 5) {
            delete world.chunks[i];
        }
    }

    // Cleanup powerups (less aggressive to prevent flickering powerups on edges)
    const cutoffMin = (playerChunk - 3) * world.chunkWidth;
    const cutoffMax = (playerChunk + 4) * world.chunkWidth;
    world.powerups = world.powerups.filter(p => (p.x >= cutoffMin && p.x <= cutoffMax) && !p.collected);
    world.lifePowerupPresent = world.powerups.some(p => !p.collected && p.type === 'life');

    // Emergency life spawn logic
    if (world.playerRef && world.playerRef.lives < 2 && !world.lifePowerupPresent) {
        for (let i = playerChunk; i <= playerChunk + 2; i++) {
            const chunk = world.chunks[i];
            if (!chunk) continue;
            const safe = getSafePlatforms(chunk);
            if (safe.length === 0) continue;
            const rng = new SeededRandom(Date.now()); // random for emergency spawn
            const p = safe[Math.floor(rng.next() * safe.length)];
            const px = p.x + p.width / 2 - 15;
            const py = p.y - 35;
            const tooClose = world.powerups.some(existing => Math.hypot(existing.x - px, existing.y - py) < 120);
            if (!tooClose) {
                world.powerups.push({ x: px, y: py, width: 30, height: 30, type: 'life', collected: false });
                world.lifePowerupPresent = true;
                break;
            }
        }
    }
}

export function spawnGoombaOnPlatform(world, platform) {
    if (!platform) return false;
    const rng = new SeededRandom(platform.x + platform.y); // Deterministic spawn
    const rand = rng.next();
    
    if (rand < 0.1) {
        const patterns = ['vertical', 'horizontal', 'figure8', 'square'];
        const pattern = patterns[Math.floor(rng.next() * patterns.length)];
        
        const enemy = {
            x: platform.x + platform.width/2 - 20,
            y: platform.y - 120, // Spawn higher so they don't clip immediately
            width: 40,
            height: 40,
            centerX: platform.x + platform.width/2,
            centerY: platform.y - 80,
            amplitude: 60 + rng.next() * 40,
            pattern: pattern,
            patternTimer: 0,
            dead: false,
            deathTimer: 0,
            type: 'reinhardt'
        };
        
        world.flyingEnemies.push(enemy);
        return true;
    } else {
        let enemyType;
        let speed = 1.5;
        if (rand < 0.4) {
            enemyType = 'block';
            speed = 3.5; // Squares are faster
        } else if (rand < 0.7) {
            enemyType = 'triangle';
            speed = 2.0;
        } else {
            enemyType = 'circle';
            speed = 2.0;
        }
        
        const goomba = {
            x: platform.x + platform.width/2 - 15,
            y: platform.y - 45, // Spawn slightly higher to ensure gravity catches them (avoids stuck-in-floor)
            width: 30,
            height: 30,
            speed: speed,
            vx: 0,
            vy: 0,
            direction: rng.chance(0.5) ? 1 : -1,
            dead: false,
            deathTimer: 0,
            type: enemyType
        };

        world.goombas.push(goomba);
        return true;
    }
}