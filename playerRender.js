export function renderPlayer(ctx, player, assets, isPerformanceMode = false) {
    ctx.save();
    if (player.isDead) {
        if (player.deathEffect === 'crumble') {
             for (let part of player.deathParts) {
                ctx.beginPath();
                ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.stroke();
             }
        } else if (player.deathEffect === 'water') {
            for (let part of player.deathParts) {
                if (part.type !== 'melting_part' || part.melted) continue;
                
                const img = assets.get(part.sprite);
                if (!img) continue;

                const progress = Math.min(1, part.meltTimer / part.meltDuration);
                const scaleY = 1 - progress; // Squashes vertically
                const scaleX = 1 + progress; // Expands horizontally
                const alpha = 1 - progress; // Fades out

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(part.x + part.w / 2, part.y + part.h); // Anchor to bottom center
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(img, -part.w / 2, -part.h, part.w, part.h);
                ctx.restore();
            }
        } else if (player.deathEffect === 'matrix') {
             for (let part of player.deathParts) {
                if (part.life <= 0) continue;
                const alpha = Math.max(0, part.life / 1000);
                ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                ctx.font = `${part.h}px 'Space Mono', monospace`;
                ctx.fillText(part.char, part.x, part.y);
             }
        } else {
            for (let part of player.deathParts) {
                const img = assets.get(part.sprite);
                if(!img) continue;
                
                const aspectRatio = img.aspectRatio || (img.naturalWidth / img.naturalHeight);
                let drawWidth, drawHeight;

                drawWidth = part.w;
                drawHeight = part.w / aspectRatio;

                ctx.save();
                ctx.translate(part.x + part.w/2, part.y + part.h/2);
                ctx.rotate(part.rot);
                ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            }
        }
    } else {
        const img = assets.get('normal');
        if(!img) { ctx.restore(); return; }

        // Flash if invincible
        if (player.invincibleTimer > 0) {
            if (Math.floor(player.invincibleTimer / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
        }

        const baseWidth = player.shrunk ? 14 : 20;
        const aspectRatio = img.aspectRatio || (img.naturalWidth / img.naturalHeight);
        const baseHeight = baseWidth / aspectRatio;

        let scaleX = 1;
        let scaleY = 1;

        if (!isPerformanceMode) {
            if (player.jumpSquash > 0) {
                const squash = player.jumpSquash * 0.4;
                scaleX = 1 + squash;
                scaleY = 1 / scaleX;
            } else if (!player.onGround) {
                const stretch = Math.min(0.4, Math.abs(player.velocityY) / 30);
                scaleY = 1 + stretch;
                scaleX = 1 / scaleY;
            }
        }

        let drawWidth = baseWidth * scaleX;
        let drawHeight = baseHeight * scaleY;

        ctx.translate(player.x + player.width / 2, player.y + player.height);
        if (player.direction === -1) ctx.scale(-1, 1);
        ctx.drawImage(img, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    }
    ctx.restore();
}