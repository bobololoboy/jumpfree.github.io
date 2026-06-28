export function updateGoombas(world, timeScale = 1, dt = 1) {
    const GRAVITY = 0.6;
    const player = world.playerRef;

    for (let i = world.goombas.length - 1; i >= 0; i--) {
        const goomba = world.goombas[i];
        if (goomba.dead) {
            goomba.deathTimer -= timeScale * dt * 16.67; 
            if (goomba.deathTimer <= 0) {
                world.goombas.splice(i, 1);
            }
            continue;
        }

        // Behavior Logic
        if (goomba.type === 'block') {
            // Block: Patrols, turns at edges, fast
            goomba.vx = goomba.direction * goomba.speed;
        } else if (goomba.type === 'circle' || goomba.type === 'triangle') {
            // Circle/Triangle: Chases player, ignores edges
            if (player && !player.isDead) {
                const dx = player.x - goomba.x;
                // Simple AI: Move towards player if within range
                if (Math.abs(dx) < 800) {
                    goomba.direction = dx > 0 ? 1 : -1;
                }
            }
            goomba.vx = goomba.direction * goomba.speed;
        }

        // Apply Velocity
        const moveStep = goomba.vx * timeScale * dt;
        goomba.x += moveStep;

        // Apply Gravity
        goomba.vy = (goomba.vy || 0) + GRAVITY * timeScale * dt;
        goomba.y += goomba.vy * timeScale * dt;

        // Clean up fell-off enemies
        if (goomba.y > world.canvas.height + 200) {
            world.goombas.splice(i, 1);
            continue;
        }

        // Collision & Floor Detection
        const goombaBottom = goomba.y + goomba.height;
        const goombaCenter = goomba.x + goomba.width / 2;
        let onPlatform = null;
        
        // Optimization: Only check relevant chunks
        const pChunk = Math.floor(goombaCenter / world.chunkWidth);
        const checkIndices = [pChunk - 1, pChunk, pChunk + 1];

        for (let idx of checkIndices) {
            const chunk = world.chunks[idx];
            if (!chunk) continue;
            for (let platform of chunk.platforms) {
                // Check if landing on platform
                if (goomba.vy >= 0 && 
                    goombaBottom >= platform.y && 
                    goombaBottom <= platform.y + 20 && // Tolerance
                    (goomba.y + goomba.height - (goomba.vy * timeScale * dt)) <= platform.y + 5 && // Was above/at
                    goombaCenter > platform.x && 
                    goombaCenter < platform.x + platform.width) {
                    
                    onPlatform = platform;
                    break;
                }
            }
            if (onPlatform) break;
        }

        if (onPlatform) {
            goomba.y = onPlatform.y - goomba.height;
            goomba.vy = 0;

            // Platform Edge Logic for 'block' type
            if (goomba.type === 'block') {
                const buffer = 10;
                const leftEdge = onPlatform.x;
                const rightEdge = onPlatform.x + onPlatform.width;

                // Predict next position
                const nextX = goomba.x + moveStep + (goomba.direction > 0 ? goomba.width : 0);
                
                if (nextX > rightEdge - buffer || goomba.x < leftEdge + buffer) {
                    goomba.direction *= -1;
                    // Bump back
                    goomba.x += goomba.direction * Math.abs(moveStep) * 2;
                }
            }
            // Circle/Triangle just walk off (no edge logic needed)
        }
    }
}

export function updateFlyingEnemies(world, timeScale = 1, dt = 1) {
    for (let i = world.flyingEnemies.length - 1; i >= 0; i--) {
        const enemy = world.flyingEnemies[i];
        
        if (!enemy.dead && world.playerRef && Math.abs(enemy.x - world.playerRef.x) > 1500) continue;

        if (enemy.dead) {
            enemy.deathTimer -= timeScale * dt * 16.67;
            if (enemy.deathTimer <= 0) {
                world.flyingEnemies.splice(i, 1);
            }
            continue;
        }

        enemy.patternTimer += timeScale * dt * 16.67;
        const cycle = enemy.patternTimer / 1000; 

        switch (enemy.pattern) {
            case 'vertical':
                enemy.y = enemy.centerY + Math.sin(cycle * 2) * enemy.amplitude;
                break;
            case 'horizontal':
                enemy.x = enemy.centerX + Math.sin(cycle * 1.5) * enemy.amplitude;
                break;
            case 'figure8':
                enemy.x = enemy.centerX + Math.sin(cycle) * enemy.amplitude;
                enemy.y = enemy.centerY + Math.sin(cycle * 2) * (enemy.amplitude * 0.5);
                break;
            case 'square':
                const phase = (cycle * 0.8) % 4;
                const amp = enemy.amplitude;
                if (phase < 1) {
                    enemy.x = enemy.centerX + (phase * amp * 2 - amp);
                    enemy.y = enemy.centerY - amp;
                } else if (phase < 2) {
                    enemy.x = enemy.centerX + amp;
                    enemy.y = enemy.centerY + ((phase - 1) * amp * 2 - amp);
                } else if (phase < 3) {
                    enemy.x = enemy.centerX + (amp - (phase - 2) * amp * 2);
                    enemy.y = enemy.centerY + amp;
                } else {
                    enemy.x = enemy.centerX - amp;
                    enemy.y = enemy.centerY + (amp - (phase - 3) * amp * 2);
                }
                break;
        }

        enemy.x = Math.max(enemy.centerX - 200, Math.min(enemy.centerX + 200, enemy.x));
        enemy.y = Math.max(100, Math.min(world.canvas.height - 100, enemy.y));
    }
}