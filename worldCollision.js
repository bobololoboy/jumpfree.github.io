export function checkPowerupCollisions(world, player) {
    const checkRect = (r1, r2) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    
    for (let i = world.powerups.length - 1; i >= 0; i--) {
        let p = world.powerups[i];
        if (Math.abs(p.x - player.x) > 100) continue;

        if (!p.collected && checkRect(player, p)) {
            p.collected = true;
            if (p.type === 'life') world.lifePowerupPresent = false;
            player.collectPowerup(p.type);
        }
    }
}

export function checkJumpPadCollisions(world, player) {
    if (!player || player.isDead) return false;

    const checkRect = (r1, r2) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    
    const playerBottom = player.y + player.height;

    const pChunk = Math.floor(player.x / world.chunkWidth);
    const checkIndices = [pChunk - 1, pChunk, pChunk + 1];

    for (let idx of checkIndices) {
        let chunk = world.chunks[idx];
        if (!chunk || !chunk.jumpPads || chunk.jumpPads.length === 0) continue;

        for (let pad of chunk.jumpPads) {
            const padRect = { x: pad.x, y: pad.y, width: pad.width, height: pad.height };

            if (player.velocityY >= 0 && checkRect(player, padRect) && (playerBottom - (player.velocityY || 0)) <= pad.y) {
                player.velocityY = -25;
                player.onGround = false; 
                player.jumpSquash = 1.2; 
                
                if (player.audio) player.audio.play('jump_pad');
                if (player.particles) player.particles.createBurst(player.x + player.width / 2, player.y + player.height, 20, '#88FF88', true);
                
                return true; 
            }
        }
    }
    return false;
}

export function checkHazardCollisions(world, player) {
    const checkRect = (r1, r2) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    
    const checkCircleRect = (circle, rect) => {
        const testX = circle.x < rect.x ? rect.x : (circle.x > rect.x + rect.width ? rect.x + rect.width : circle.x);
        const testY = circle.y < rect.y ? rect.y : (circle.y > rect.y + rect.height ? rect.y + rect.height : circle.y);
        const distX = circle.x - testX;
        const distY = circle.y - testY;
        return (distX * distX + distY * distY) <= (circle.radius * circle.radius);
    };
    
    const pChunk = Math.floor(player.x / world.chunkWidth);
    const checkIndices = [pChunk - 1, pChunk, pChunk + 1];

    for (let idx of checkIndices) {
        let chunk = world.chunks[idx];
        if (!chunk) continue;

        const margin = 2;
        for (let spike of chunk.spikes) {
            const spikeRect = {
                x: spike.x - margin,
                y: spike.y - margin,
                width: spike.width + margin * 2,
                height: spike.height + margin * 2
            };
            if (checkRect(player, spikeRect)) return true;
        }
        for (let spinner of chunk.spinners) {
            const spinnerCircle = { x: spinner.x, y: spinner.y, radius: spinner.size / 2 };
            if (checkCircleRect(spinnerCircle, player)) return true;
        }
    }

    for (let goomba of world.goombas) {
        if (goomba.dead) continue;
        if (Math.abs(goomba.x - player.x) > 200) continue;
        
        if (checkRect(player, goomba)) {
            const playerBottom = player.y + player.height;
            const goombaTop = goomba.y;
            const isJumpingOnTop = player.velocityY > 0 && playerBottom - 10 < goombaTop && playerBottom > goombaTop - 5;
            
            if (isJumpingOnTop && goomba.type !== 'triangle') {
                goomba.dead = true;
                goomba.deathTimer = 1000;
                player.velocityY = -8; 
                world.particles.createBurst(goomba.x + goomba.width/2, goomba.y + goomba.height/2, 8, world.palette.foreground);
                
                if (world.playerRef && world.playerRef.onCollectPowerup) {
                    world.playerRef.onCollectPowerup('goomba_kill');
                }
                return false; 
            } else {
                return true;
            }
        }
    }

    for (let enemy of world.flyingEnemies) {
        if (enemy.dead) continue;
        if (Math.abs(enemy.x - player.x) > 200) continue;
        
        if (checkRect(player, enemy)) {
            const playerBottom = player.y + player.height;
            const enemyTop = enemy.y;
            const isJumpingOnTop = player.velocityY > 0 && playerBottom - 10 < enemyTop && playerBottom > enemyTop - 5;
            
            if (isJumpingOnTop) {
                if (enemy.type === 'reinhardt') {
                    enemy.dead = true;
                    enemy.deathTimer = 1500;
                    enemy.fallSpeed = 0;
                    player.velocityY = -15; 
                    world.particles.createBurst(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 12, world.palette.foreground);
                    
                    if (world.playerRef && world.playerRef.onCollectPowerup) {
                        world.playerRef.onCollectPowerup('reinhardt_kill');
                    }
                    return false;
                } else {
                    enemy.dead = true;
                    enemy.deathTimer = 1000;
                    player.velocityY = -8;
                    world.particles.createBurst(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 8, world.palette.foreground);
                    
                    if (world.playerRef && world.playerRef.onCollectPowerup) {
                        world.playerRef.onCollectPowerup('flying_enemy_kill');
                    }
                    return false;
                }
            } else {
                return true; 
            }
        }
    }

    return false;
}

export function rectOverlapsSpikes(world, rect, chunk, margin = 0) {
    if (!chunk) return false;
    for (const s of chunk.spikes) {
        const spikeRect = {
            x: s.x - margin,
            y: s.y - margin,
            width: s.width + margin * 2,
            height: s.height + margin * 2
        };
        if (rect.x < spikeRect.x + spikeRect.width &&
            rect.x + rect.width > spikeRect.x &&
            rect.y < spikeRect.y + spikeRect.height &&
            rect.y + rect.height > spikeRect.y) {
            return true;
        }
    }
    return false;
}

export function circleRectIntersect(circle, rect) {
    const testX = circle.x < rect.x ? rect.x : (circle.x > rect.x + rect.width ? rect.x + rect.width : circle.x);
    const testY = circle.y < rect.y ? rect.y : (circle.y > rect.y + rect.height ? rect.y + rect.height : circle.y);
    const distX = circle.x - testX;
    const distY = circle.y - testY;
    return (distX * distX + distY * distY) <= (circle.radius * circle.radius);
}

export function rectOverlapsSpinners(world, rect, chunk, extraRadius = 0) {
    if (!chunk) return false;
    for (const sp of chunk.spinners) {
        const c = { x: sp.x, y: sp.y, radius: sp.size / 2 + extraRadius };
        if (circleRectIntersect(c, rect)) return true;
    }
    return false;
}

export function isPlatformSafeForSpawn(world, platform, chunk, playerWidth, playerHeight) {
    const spawnX = platform.x + platform.width / 2 - playerWidth / 2;
    const spawnY = platform.y - playerHeight;
    const rect = { x: spawnX, y: spawnY, width: playerWidth, height: playerHeight };

    const minMargin = 12;
    if (platform.width < playerWidth + minMargin * 2) return false;

    const spikeMargin = 8;
    if (rectOverlapsSpikes(world, rect, chunk, spikeMargin)) return false;

    const headClear = { x: rect.x, y: rect.y - 8, width: rect.width, height: rect.height + 8 };
    if (rectOverlapsSpikes(world, headClear, chunk, spikeMargin)) return false;

    if (rectOverlapsSpinners(world, rect, chunk, 6)) return false;

    return true;
}

export function findSafeSpawnPoint(world, playerX) {
    const pW = world.playerRef?.width || 24;
    const pH = world.playerRef?.height || 48;

    const targetX = Math.max(100, playerX - 200);
    const baseChunkIndex = Math.floor(targetX / world.chunkWidth);

    const searchOffsets = [0, 1, -1, 2, -2, 3, -3];
    for (const off of searchOffsets) {
        const idx = baseChunkIndex + off;
        const chunk = world.chunks[idx];
        if (!chunk) continue;

        const platforms = chunk.platforms
            .slice()
            .sort((a, b) => Math.abs((a.x + a.width / 2) - playerX) - Math.abs((b.x + b.width / 2) - playerX));

        for (const plat of platforms) {
            if (plat.y > world.canvas.height - 2) continue;

            if (isPlatformSafeForSpawn(world, plat, chunk, pW, pH)) {
                return { x: plat.x + plat.width / 2, y: plat.y - pH };
            }
        }
    }

    const groundIdx = baseChunkIndex;
    const groundChunk = world.chunks[groundIdx];
    if (groundChunk) {
        const groundY = world.canvas.height - world.groundHeight;
        const fallbackX = Math.max(groundIdx * world.chunkWidth + 50, Math.min(playerX, (groundIdx + 1) * world.chunkWidth - 50));
        const rect = { x: fallbackX - pW / 2, y: groundY - pH, width: pW, height: pH };
        if (!rectOverlapsSpikes(world, rect, groundChunk, 8) && !rectOverlapsSpinners(world, rect, groundChunk, 6)) {
            return { x: fallbackX, y: groundY - pH };
        }
    }

    return { x: targetX, y: 200 };
}