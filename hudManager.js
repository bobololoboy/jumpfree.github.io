export class HUDManager {
    constructor() {
        // Game UI
        this.gameUI = document.getElementById('ui');
        this.distanceSpan = document.getElementById('distance');
        this.timerContainer = document.getElementById('timerContainer');
        this.timerSpan = document.getElementById('timer');
        this.livesSpan = document.getElementById('lives');
        this.activePowersDiv = document.getElementById('active-powers');
        this.coinCountSpan = null; // will be created dynamically
        this.coinBoostIndicator = document.getElementById('coinBoostIndicator');
        
        this.createCoinUI();
        this.createDevBadge();
    }

    hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }

    setPalette(palette) {
        this.gameUI.style.color = palette.foreground;
        this.gameUI.style.setProperty('--foreground-color', palette.foreground);
        this.gameUI.style.setProperty('--background-color', palette.background);
        this.gameUI.style.setProperty('--powerup-bg-color', this.hexToRgba(palette.foreground, 0.15));

        // special handling for coin boost indicator to ensure it's always readable
        this.coinBoostIndicator.style.textShadow = `1px 1px 0px ${palette.background}, -1px -1px 0px ${palette.background}, 1px -1px 0px ${palette.background}, -1px 1px 0px ${palette.background}, 2px 2px 2px rgba(0,0,0,0.5)`;
    }

    updateCoinBoostUI(rank) {
        if (this.coinBoostIndicator) {
            if (rank === 1) {
                this.coinBoostIndicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" class="inline-block -mt-1 mr-1" style="color: #FFD700;"><path d="M2 13.3718C2 13.3718 6.36818 16.6868 12 16.6868C17.6318 16.6868 22 13.3718 22 13.3718L19.7273 4L15.3636 8.31313L12 4L8.63636 8.31313L4.27273 4L2 13.3718Z" stroke-linejoin="round" stroke-linecap="round"/></svg> 5x Coins!`;
                this.coinBoostIndicator.style.display = 'block';
            } else if (rank === 2) {
                this.coinBoostIndicator.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" class="inline-block -mt-1 mr-1"><circle cx="12" cy="12" r="10" fill="#C0C0C0" stroke="currentColor" stroke-width="1"/></svg> 2x Coins!`;
                this.coinBoostIndicator.style.display = 'block';
            } else if (rank === 0) {
                // Special "0th" display (no coin boost banner since special has its own dev badge)
                this.coinBoostIndicator.textContent = '0th';
                this.coinBoostIndicator.style.display = 'block';
            } else {
                this.coinBoostIndicator.style.display = 'none';
            }
        }
    }

    createCoinUI() {
        const coinDiv = document.createElement('div');
        coinDiv.innerHTML = `Coins: <span id="coinCount">0</span>`;
        this.gameUI.insertBefore(coinDiv, this.livesSpan.parentElement);
        this.coinCountSpan = document.getElementById('coinCount');
    }

    createDevBadge() {
        this.devBadge = document.createElement('div');
        this.devBadge.id = 'devBadge';
        this.devBadge.style.cssText = `
            position: absolute;
            top: 15px;
            right: 20px;
            z-index: 120;
            font-weight: 800;
            padding: 6px 10px;
            border: 2px solid var(--foreground-color, black);
            background: var(--background-color, white);
            color: var(--foreground-color, black);
            font-size: 14px;
            display: none;
        `;
        this.devBadge.textContent = 'DEV x10';
        document.body.appendChild(this.devBadge);
    }

    setDevBadge(multiplierOrText) {
        if (!this.devBadge) return;
        if (multiplierOrText === null) {
            this.devBadge.style.display = 'none';
        } else {
            const text = typeof multiplierOrText === 'number' ? `DEV x${multiplierOrText}` : String(multiplierOrText);
            this.devBadge.textContent = text;
            this.devBadge.style.display = 'block';
        }
    }

    updateDistance(distance) { 
        if (this.lastDistance !== distance) {
            this.distanceSpan.textContent = distance; 
            this.lastDistance = distance;
        }
    }
    updateTimer(timeMs) { 
        // Throttle timer updates to every ~100ms to reduce layout thrashing
        if (!this.lastTimerUpdate || timeMs - this.lastTimerUpdate > 100) {
            this.timerSpan.textContent = (timeMs / 1000).toFixed(1); 
            this.lastTimerUpdate = timeMs;
        }
    }
    updateLives(lives) { this.livesSpan.textContent = lives; }
    updateCoins(coins) {
        if (this.coinCountSpan) this.coinCountSpan.textContent = coins;
    }

    updatePowerupUI(player) {
        let html = '';
        if (player.doubleJumpCharges > 0) html += `<div class="powerup-indicator">Double Jumps: ${player.doubleJumpCharges}</div>`;
        if (player.slowFallTimer > 0) html += `<div class="powerup-indicator">Slow Fall: ${(player.slowFallTimer / 1000).toFixed(1)}s</div>`;
        if (player.flyTimer > 0) html += `<div class="powerup-indicator">Fly: ${(player.flyTimer / 1000).toFixed(1)}s</div>`;
        if (player.shrinkTimer > 0) html += `<div class="powerup-indicator">Shrink: ${(player.shrinkTimer / 1000).toFixed(1)}s</div>`;
        if (player.speedTimer > 0) html += `<div class="powerup-indicator">Speed: ${(player.speedTimer / 1000).toFixed(1)}s</div>`;
        if (player.invincibleTimer > 0) html += `<div class="powerup-indicator">Invincible: ${(player.invincibleTimer / 1000).toFixed(1)}s</div>`;
        this.activePowersDiv.innerHTML = html;
    }
}