export function renderWorld(world, ctx, camera) {
    if (world.textureUrl && !world.texturePattern && !world.textureLoading) {
        world.textureLoading = true;
        const textureImg = document.createElement('img');
        textureImg.onload = () => {
            if (ctx) {
                world.texturePattern = ctx.createPattern(textureImg, 'repeat');
            }
            world.textureLoading = false;
        };
        textureImg.onerror = () => {
            world.textureLoading = false;
            world.textureUrl = null; // Stop retrying
        };
        textureImg.src = world.textureUrl;
    }

    const viewX = camera ? camera.x : 0;
    const viewW = ctx.canvas ? ctx.canvas.width : 1000;
    const renderStart = viewX - 200;
    const renderEnd = viewX + viewW + 200;

    for (let chunk of Object.values(world.chunks)) {
        if (chunk.x + world.chunkWidth < renderStart || chunk.x > renderEnd) {
            continue;
        }

        ctx.strokeStyle = world.palette.foreground;
        ctx.lineWidth = 3;
        for (let p of chunk.platforms) {
            ctx.fillStyle = world.texturePattern || world.palette.background;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.strokeRect(p.x, p.y, p.width, p.height);
        }
        for (let s of chunk.spikes) {
            ctx.fillStyle = world.palette.background;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y + s.height);
            ctx.lineTo(s.x + s.width, s.y + s.height);
            ctx.lineTo(s.x + s.width/2, s.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        for (let pad of chunk.jumpPads) {
            const isHackerPalette = world.palette.background === 'black' && world.palette.foreground === '#00FF00';
            const isPadActive = pad.squish > 0;

            if (isHackerPalette && isPadActive) {
                ctx.fillStyle = world.palette.background;
                ctx.strokeStyle = world.palette.foreground;
                ctx.lineWidth = 2;
                ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
                ctx.strokeRect(pad.x, pad.y, pad.width, pad.height);
                
                renderJumpPadText(ctx, pad, pad.x, pad.y, pad.width, pad.height);
            } else {
                ctx.fillStyle = world.palette.background;
                ctx.strokeStyle = world.palette.foreground;
                ctx.lineWidth = 2;

                const squishFactor = Math.sin(pad.squish * Math.PI); 
                const squishHeight = 5 * squishFactor;
                const squishWidth = 3 * squishFactor;
                const padY = pad.y + squishHeight / 2;
                const padH = pad.height - squishHeight;
                const padX = pad.x - squishWidth / 2;
                const padW = pad.width + squishWidth;

                ctx.fillRect(padX, padY, padW, padH);
                ctx.strokeRect(padX, padY, padW, padH);

                ctx.fillStyle = world.palette.foreground; 
                ctx.beginPath();
                const centerX = padX + padW / 2;
                const centerY = padY + padH / 2;
                ctx.moveTo(centerX, centerY - 5);
                ctx.lineTo(centerX + 5, centerY);
                ctx.lineTo(centerX - 5, centerY);
                ctx.closePath();
                ctx.fill();
            }
        }
        for (let spinner of chunk.spinners) {
            ctx.save();
            ctx.translate(spinner.x, spinner.y);
            ctx.rotate(spinner.angle);
            
            ctx.fillStyle = world.palette.background;
            ctx.strokeStyle = world.palette.foreground;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(0, 0, spinner.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const spikeCount = 8;
            for (let i = 0; i < spikeCount; i++) {
                const angle = (i / spikeCount) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * (spinner.size / 2), Math.sin(angle) * (spinner.size / 2));
                ctx.lineTo(Math.cos(angle) * (spinner.size / 2 + 8), Math.sin(angle) * (spinner.size / 2 + 8));
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    for (let p of world.powerups) {
        if (!p.collected) {
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = world.palette.foreground;
            ctx.fillStyle = world.palette.background;
            ctx.strokeRect(p.x, p.y, p.width, p.height);
            ctx.fillRect(p.x, p.y, p.width, p.height);

            if (p.type === 'life') {
                ctx.save();
                ctx.strokeStyle = world.palette.foreground;
                ctx.fillStyle = world.palette.foreground;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                const w = p.width * 0.8;
                const h = p.height * 0.8;
                const left = p.x + p.width * 0.1;
                const top = p.y + p.height * 0.1;

                ctx.moveTo(left + w/2, top + h/4);
                ctx.quadraticCurveTo(left, top, left, top + h/2.5);
                ctx.quadraticCurveTo(left, top + h/1.5, left + w/2, top + h);
                ctx.quadraticCurveTo(left + w, top + h/1.5, left + w, top + h/2.5);
                ctx.quadraticCurveTo(left + w, top, left + w/2, top + h/4);
                
                ctx.fill();
                ctx.restore();
            } else if (p.type === 'invincibility') {
                ctx.save();
                ctx.strokeStyle = world.palette.foreground;
                ctx.fillStyle = world.palette.foreground;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                const w = p.width * 0.7;
                const h = p.height * 0.8;
                const left = p.x + p.width * 0.15;
                const top = p.y + p.height * 0.1;

                ctx.moveTo(left + w / 2, top);
                ctx.quadraticCurveTo(left + w, top, left + w, top + h * 0.3);
                ctx.lineTo(left + w, top + h * 0.8);
                ctx.quadraticCurveTo(left + w, top + h, left + w / 2, top + h);
                ctx.quadraticCurveTo(left, top + h, left, top + h * 0.8);
                ctx.lineTo(left, top + h * 0.3);
                ctx.quadraticCurveTo(left, top, left + w / 2, top);

                ctx.fill();
                ctx.restore();
            } else {
                ctx.fillStyle = world.palette.foreground;
                ctx.font = 'bold 16px Space Mono';
                ctx.textAlign = 'center';
                const text = p.type === 'doubleJump' ? '2J'
                            : p.type === 'slowFall' ? 'SF'
                            : p.type === 'fly' ? 'FLY'
                            : p.type === 'shrink' ? 'SM'
                            : p.type === 'speed' ? 'SPD'
                            : p.type === 'invincibility' ? 'INV' : '';
                ctx.fillText(text, p.x + p.width/2, p.y + p.height/2 + 6);
            }
            ctx.restore();
        }
    }

    for (let goomba of world.goombas) {
        ctx.save();
        
        if (goomba.dead) {
            ctx.globalAlpha = Math.max(0, goomba.deathTimer / 1000);
        }

        ctx.fillStyle = world.palette.background;
        ctx.strokeStyle = world.palette.foreground;
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (goomba.type === 'circle') {
            ctx.arc(goomba.x + goomba.width/2, goomba.y + goomba.height/2, goomba.width/2, 0, Math.PI * 2);
        } else if (goomba.type === 'block') {
            ctx.rect(goomba.x, goomba.y, goomba.width, goomba.height);
        } else {
            ctx.moveTo(goomba.x + goomba.width/2, goomba.y);
            ctx.lineTo(goomba.x, goomba.y + goomba.height);
            ctx.lineTo(goomba.x + goomba.width, goomba.y + goomba.height);
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();

        const centerX = goomba.x + goomba.width/2;
        const centerY = goomba.y + goomba.height/2;
        
        ctx.fillStyle = world.palette.foreground;
        ctx.beginPath();
        ctx.arc(centerX - 6, centerY - 4, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 6, centerY - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Only draw mouth for non-triangle (star) types
        if (goomba.type !== 'triangle') {
            ctx.beginPath();
            ctx.arc(centerX, centerY + 6, 4, 0, Math.PI);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }

    for (let enemy of world.flyingEnemies) {
        ctx.save();
        
        if (enemy.dead) {
            ctx.globalAlpha = Math.max(0, enemy.deathTimer / 1500);
            if (enemy.type === 'reinhardt' && enemy.fallSpeed !== undefined) {
                enemy.y += enemy.fallSpeed;
                enemy.fallSpeed += 0.5; 
            }
        }

        ctx.fillStyle = world.palette.background;
        ctx.strokeStyle = world.palette.foreground;
        ctx.lineWidth = 2;

        if (enemy.type === 'reinhardt') {
            ctx.save();
            ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            ctx.rotate(enemy.patternTimer * 0.01); 
            
            const spikes = 5;
            const outerRadius = enemy.width / 2;
            const innerRadius = outerRadius * 0.5;
            
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / spikes;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = world.palette.foreground;
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.ellipse(enemy.x + enemy.width/4, enemy.y + enemy.height/2, 8, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(enemy.x + 3*enemy.width/4, enemy.y + enemy.height/2, 8, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        const centerX = enemy.x + enemy.width/2;
        const centerY = enemy.y + enemy.height/2;
        
        ctx.fillStyle = world.palette.foreground;
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + 4, centerY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function renderJumpPadText(ctx, pad, x, y, w, h) {
    const squishFactor = Math.sin(pad.squish * Math.PI);
    const alpha = Math.min(1, squishFactor * 2); 

    ctx.save();
    ctx.font = 'bold 12px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
    ctx.fillText('JUMP', x + w / 2, y + h / 2);
    ctx.restore();
}