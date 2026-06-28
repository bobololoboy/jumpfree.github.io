export class ParticleManager {
    constructor() {
        this.particles = [];
        this.menuParticles = [];
        this.pool = [];
        this.enabled = true;
        this.palette = { background: 'white', foreground: 'black' };
        this.particleEffect = 'default';
    }

    getP() {
        return this.pool.pop() || {};
    }

    recycle(p) {
        this.pool.push(p);
    }

    setPalette(palette, effect = 'default') {
        this.palette = palette;
        this.particleEffect = effect;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    clearAllParticles() {
        this.pool.push(...this.particles);
        this.pool.push(...this.menuParticles);
        this.particles.length = 0;
        this.menuParticles.length = 0;
    }
    
    createBurst(x, y, count, color = null, inAir = false) {
        if (!this.enabled) return;
        
        // Optimization: Cap particle count using swap-remove later, or just simple cap
        if (this.particles.length >= 100) {
            // Recycle oldest (index 0) efficiently
            const old = this.particles[0];
            this.pool.push(old);
            this.particles.shift(); // O(N) but N=100 is tiny. 
            // Ideally we use a circular buffer, but shift on 100 items is negligible compared to splice creation.
        }

        const particleY = inAir ? y : y;

        if (this.particleEffect === 'matrix') {
            const HACKER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
            for (let i = 0; i < count; i++) {
                const p = this.getP();
                p.type = 'char';
                p.char = HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)];
                p.x = x;
                p.y = particleY;
                p.velocityX = (Math.random() - 0.5) * 4;
                p.velocityY = -Math.random() * 3 - 1;
                p.size = Math.random() * 10 + 10;
                p.life = 40 + Math.random() * 30;
                p.color = color || this.palette.foreground;
                this.particles.push(p);
            }
            return;
        }

        if (this.particleEffect === 'fish') {
            for (let i = 0; i < count; i++) {
                const p = this.getP();
                p.type = 'fish';
                p.x = x;
                p.y = particleY;
                p.velocityX = (Math.random() - 0.5) * 3;
                p.velocityY = -Math.random() * 2 - 0.5;
                p.size = Math.random() * 8 + 12;
                p.life = 50 + Math.random() * 40;
                p.rotation = (Math.random() - 0.5) * 0.5;
                p.color = this.palette.foreground;
                this.particles.push(p);
            }
            return;
        }

        for (let i = 0; i < count; i++) {
            const p = this.getP();
            p.type = 'default';
            p.x = x;
            p.y = particleY;
            p.velocityX = (Math.random() - 0.5) * 4;
            p.velocityY = -Math.random() * 3 - 1;
            p.size = Math.random() * 3 + 2;
            p.life = 30 + Math.random() * 20;
            p.color = color || this.palette.foreground;
            this.particles.push(p);
        }
    }
    
    createJumpPadSmoke(x, y, count, color = null) {
        if (!this.enabled) return;
        
        for (let i = 0; i < count; i++) {
            const p = this.getP();
            p.type = 'default';
            p.x = x;
            p.y = y;
            p.velocityX = (Math.random() - 0.5) * 1.5;
            p.velocityY = -Math.random() * 2 - 1.5;
            p.size = Math.random() * 1.5 + 1;
            p.life = 40 + Math.random() * 30;
            p.color = color || this.palette.foreground;
            this.particles.push(p);
        }
    }

    createMenuBurst(x, y, count, color = null) {
        if (!this.enabled) return;
        
        // Optimization for menu particles too
        if (this.particles.length > 100) {
            const removed = this.particles.splice(0, this.particles.length - 80);
            this.pool.push(...removed);
        }

        for (let i = 0; i < count; i++) {
            const p = this.getP();
            p.type = 'default';
            p.x = x;
            p.y = y;
            p.velocityX = (Math.random() - 0.5) * 8;
            p.velocityY = (Math.random() - 0.5) * 8;
            p.size = Math.random() * 1 + 0.5;
            p.life = 90 + Math.random() * 60;
            p.color = color || this.palette.foreground;
            this.particles.push(p);
        }
    }

    createDeathBurst(x, y) {
        if (!this.enabled) return;
        
        // Optimization
        if (this.particles.length > 100) {
            const removed = this.particles.splice(0, this.particles.length - 80);
            this.pool.push(...removed);
        }

        if (this.particleEffect === 'matrix') {
            const HACKER_CHARS = '01';
            const particleCount = 14 + Math.random() * 10;
            for (let i = 0; i < particleCount; i++) {
                const p = this.getP();
                p.type = 'char';
                p.char = HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)];
                p.x = x;
                p.y = y;
                p.velocityX = (Math.random() - 0.5) * 3;
                p.velocityY = -Math.random() * 2 - 1;
                p.size = Math.random() * 12 + 10;
                p.life = 30 + Math.random() * 20;
                p.color = this.palette.foreground;
                this.particles.push(p);
            }
            return;
        }

        if (this.particleEffect === 'fish') {
            const particleCount = 12 + Math.random() * 8;
            for (let i = 0; i < particleCount; i++) {
                const p = this.getP();
                p.type = 'water_drop';
                p.x = x;
                p.y = y;
                p.velocityX = (Math.random() - 0.5) * 4;
                p.velocityY = -Math.random() * 3 - 1;
                p.size = Math.random() * 6 + 4;
                p.life = 40 + Math.random() * 30;
                p.color = '#4a6a9e';
                this.particles.push(p);
            }
            return;
        }

        const particleCount = 20 + Math.random() * 10;
        for (let i = 0; i < particleCount; i++) {
            const p = this.getP();
            p.type = 'default';
            p.x = x;
            p.y = y;
            p.velocityX = (Math.random() - 0.5) * 3;
            p.velocityY = -Math.random() * 2 - 1;
            p.size = Math.random() * 1 + 0.5;
            p.life = 20 + Math.random() * 15;
            p.color = this.palette.foreground;
            this.particles.push(p);
        }
    }

    update(timeScale = 1, dt = 1) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            // Normalize life and motion to 60 FPS baseline
            p.life -= 1 * timeScale * dt;
            if (p.life <= 0) {
                this.pool.push(p);
                // Fast remove: swap with last and pop
                if (i < this.particles.length - 1) {
                    this.particles[i] = this.particles[this.particles.length - 1];
                }
                this.particles.pop();
                continue;
            }
            p.x += (p.velocityX ?? 0) * timeScale * dt;
            p.y += (p.velocityY ?? 0) * timeScale * dt;
            if (p.velocityY !== undefined) p.velocityY += 0.1 * timeScale * dt;

            // Size decay
            const decayBase = p.type === 'char' ? 0.99 : 0.98;
            p.size *= Math.pow(decayBase, timeScale * dt);
        }
    }
    
    updateMenuParticles(canvas) {
        if (this.particleEffect === 'matrix') {
            const HACKER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?-=';
            if (Math.random() < 0.9) {
                this.menuParticles.push({
                    type: 'char',
                    char: HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)],
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 10 + 10,
                    speedY: Math.random() * 1.5 + 1,
                    life: 100 + Math.random() * 50,
                });
            }
        } else if (this.particleEffect === 'fish') {
            if (Math.random() < 0.3) {
                this.menuParticles.push({
                    type: 'fish',
                    x: Math.random() * canvas.width,
                    y: -20,
                    size: Math.random() * 8 + 14,
                    speedY: Math.random() * 1.2 + 0.8,
                    rotation: Math.PI / 2, // facing down
                    life: 120 + Math.random() * 60,
                });
            }
        } else {
            if (Math.random() < 0.5) {
                this.menuParticles.push({
                    type: 'circle',
                    x: Math.random() * canvas.width,
                    y: canvas.height + 10,
                    size: Math.random() * 2 + 1,
                    speedY: -(Math.random() * 1 + 0.5),
                });
            }
        }

        for (let i = this.menuParticles.length - 1; i >= 0; i--) {
            const p = this.menuParticles[i];
            p.y += p.speedY;

            if (p.type === 'char' || p.type === 'fish') {
                p.life--;
                 if (p.y > canvas.height + 20 || p.life <= 0) {
                     this.menuParticles.splice(i, 1);
                }
            } else {
                if (p.y < 0) {
                    this.menuParticles.splice(i, 1);
                }
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += (p.velocityX ?? 0) * 0.98;
            p.y += (p.velocityY ?? 0) * 0.98;
            if (p.velocityX !== undefined) p.velocityX *= 0.98;
            if (p.velocityY !== undefined) p.velocityY *= 0.98;
            p.size *= 0.98;
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            if (p.type === 'char') {
                const alpha = Math.max(0.15, Math.min(1, (p.life ?? 30) / 50));
                const rgb = this.hexToRgb(this.palette.foreground);
                ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
                ctx.font = `${Math.max(8, p.size || 10)}px 'Space Mono', monospace`;
                ctx.fillText(p.char || '0', p.x, p.y);
                continue;
            }
            if (p.type === 'fish') {
                const alpha = Math.max(0.3, Math.min(1, (p.life ?? 50) / 60));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.fillStyle = p.color || this.palette.foreground;
                ctx.beginPath();
                // Draw a simple fish shape
                const w = p.size;
                const h = p.size * 0.6;
                ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.moveTo(w / 2, 0);
                ctx.lineTo(w / 2 + 5, -h / 2);
                ctx.lineTo(w / 2 + 5, h / 2);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
                continue;
            }
            if (p.type === 'water_drop') {
                const alpha = Math.max(0.4, Math.min(1, (p.life ?? 30) / 40));
                ctx.fillStyle = `rgba(74, 106, 158, ${alpha})`;
                ctx.beginPath();
                // Water drop shape
                ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
                ctx.fill();
                continue;
            }
            if (p.type === 'goo_drop') {
                const alpha = Math.max(0.4, Math.min(1, (p.life ?? 50) / 60));
                ctx.fillStyle = `rgba(34, 34, 34, ${alpha})`; // Dark goo color
                ctx.beginPath();
                // Gooey, stretched ellipse shape
                ctx.ellipse(p.x, p.y, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
                ctx.fill();
                continue;
            }
            ctx.fillStyle = p.color || this.palette.foreground;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
    }

    renderMenu(ctx) {
        for (const p of this.menuParticles) {
            if (p.type === 'char') {
                const alpha = Math.min(1, p.life / 50);
                const rgb = this.hexToRgb(this.palette.foreground);
                ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
                ctx.font = `${p.size}px 'Space Mono', monospace`;
                ctx.fillText(p.char, p.x, p.y);
            } else if (p.type === 'fish') {
                const alpha = Math.min(1, p.life / 80);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                
                ctx.fillStyle = this.palette.foreground;
                ctx.beginPath();
                const w = p.size;
                const h = p.size * 0.6;
                ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.moveTo(w / 2, 0);
                ctx.lineTo(w / 2 + 5, -h / 2);
                ctx.lineTo(w / 2 + 5, h / 2);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            } else {
                ctx.fillStyle = this.palette.foreground;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        for (const p of this.particles) {
            if (p.type === 'char') {
                const alpha = Math.max(0.15, Math.min(1, (p.life ?? 30) / 50));
                const rgb = this.hexToRgb(this.palette.foreground);
                ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
                ctx.font = `${Math.max(8, p.size || 10)}px 'Space Mono', monospace`;
                ctx.fillText(p.char || '0', p.x, p.y);
            } else if (p.type === 'fish') {
                const alpha = Math.max(0.3, Math.min(1, (p.life ?? 50) / 60));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.fillStyle = p.color || this.palette.foreground;
                ctx.beginPath();
                const w = p.size;
                const h = p.size * 0.6;
                ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.moveTo(w / 2, 0);
                ctx.lineTo(w / 2 + 5, -h / 2);
                ctx.lineTo(w / 2 + 5, h / 2);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            } else if (p.type === 'water_drop') {
                const alpha = Math.max(0.4, Math.min(1, (p.life ?? 30) / 40));
                ctx.fillStyle = `rgba(74, 106, 158, ${alpha})`;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}