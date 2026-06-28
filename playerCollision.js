export function checkCollisions(player, chunks, moveAmount, verticalMoveAmount) {
    player.onGround = false;
    const startChunk = Math.floor((player.x - 100) / 800);
    const endChunk = Math.floor((player.x + 100) / 800);

    const playerBottom = player.y + player.height;
    const prevPlayerBottom = playerBottom - verticalMoveAmount;
    const prevPlayerTop = player.y - verticalMoveAmount;

    let correctedX = player.x;
    let correctedY = player.y;

    // --- Jump Pad Collision ---
    let onJumpPad = false;
    for (let i = startChunk; i <= endChunk; i++) {
        if (!chunks[i] || !chunks[i].jumpPads || chunks[i].jumpPads.length === 0) continue;

        for (const pad of chunks[i].jumpPads) {
            // Player must be falling onto the pad from above
            if (player.velocityY >= 0 &&
                prevPlayerBottom <= pad.y &&
                playerBottom >= pad.y &&
                player.x + player.width > pad.x && player.x < pad.x + pad.width)
            {
                player.velocityY = -25; // A powerful jump
                player.onGround = false;
                player.canDoubleJump = true;
                player.jumpSquash = 1.2;
                player.audio.play('jump_pad');
                player.particles.createJumpPadSmoke(player.x + player.width / 2, pad.y + 10, 30, player.palette.foreground);
                pad.squish = 1; // Start squish animation

                onJumpPad = true;
                correctedY = pad.y - player.height; // Snap to top of pad
                break;
            }
        }
        if (onJumpPad) break;
    }

    if (onJumpPad) {
        player.y = correctedY; // Apply Y correction from pad
        return; // Exit collision checks for this frame
    }

    for (let i = startChunk; i <= endChunk; i++) {
        if (!chunks[i]) continue;
        for (const p of chunks[i].platforms) {
            // Broad-phase check
            if (player.x + player.width > p.x && player.x < p.x + p.width &&
                player.y + player.height > p.y && player.y < p.y + p.height) {

                // Vertical collision (landing on top)
                if (player.velocityY >= 0 && prevPlayerBottom <= p.y + 0.1) { // 0.1 tolerance
                    if (!player.onGround && player.velocityY > 1) {
                        player.jumpSquash = Math.min(1.5, player.velocityY / 15);
                        player.audio.play('land');
                    }
                    correctedY = p.y - player.height;
                    player.velocityY = 0;
                    player.onGround = true;
                    player.canDoubleJump = true;
                }
                // Vertical collision (hitting bottom)
                else if (player.velocityY < 0 && prevPlayerTop >= p.y + p.height - 0.1) { // 0.1 tolerance
                    correctedY = p.y + p.height;
                    if (player.velocityY < -0.1) { // Only stop if moving up with some force
                        player.velocityY = 0;
                    }
                }
                // Horizontal collision
                else if (moveAmount !== 0) {
                    if (moveAmount > 0) { // Moving right
                        correctedX = p.x - player.width;
                    } else if (moveAmount < 0) { // Moving left
                        correctedX = p.x + p.width;
                    }
                    player.velocityX = 0;
                }
            }
        }
    }
    player.x = correctedX;
    player.y = correctedY;
}