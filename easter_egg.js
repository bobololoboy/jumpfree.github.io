import { EASTER_EGG_WORDS } from './constants.js';

export class EasterEgg {
    constructor(menuCanvas, assets, particles) {
        this.menuCanvas = menuCanvas;
        this.menuCtx = menuCanvas.getContext('2d');
        this.assets = assets;
        this.particles = particles;
        
        this.bird = null;
        this.spritesLoaded = false;
        this.active = false;
    }

    check(keySequence) {
        if (this.bird) return;
        for (const word of EASTER_EGG_WORDS) {
            if (keySequence.endsWith(word)) {
                this.spawnBird();
                break;
            }
        }
    }

    spawnBird() {
        this.bird = {
            x: this.menuCanvas.width / 2, // treat x,y as center
            y: this.menuCanvas.height / 2,
            width: 60,
            height: 60,
            targetParticle: null,
            speed: 4,
            direction: 1,
            angle: 0
        };
        this.active = true;
    }

    deactivate() {
        this.bird = null;
        this.active = false;
    }

    update() {
        if (!this.active || !this.bird) return;

        const bird = this.bird;
        const menuParticles = this.particles.menuParticles;

        if (!bird.targetParticle || menuParticles.indexOf(bird.targetParticle) === -1) {
            let closestDist = Infinity;
            let closestParticle = null;
            for (const p of menuParticles) {
                const dist = Math.hypot(p.x - bird.x, p.y - bird.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestParticle = p;
                }
            }
            bird.targetParticle = closestParticle;
        }

        if (bird.targetParticle) {
            const target = bird.targetParticle;
            const angle = Math.atan2(target.y - bird.y, target.x - bird.x);
            
            bird.x += Math.cos(angle) * bird.speed;
            bird.y += Math.sin(angle) * bird.speed;

            // Face the correct way: right when moving right, left when moving left
            bird.direction = (target.x - bird.x) >= 0 ? 1 : -1;

            if (Math.hypot(target.x - bird.x, target.y - bird.y) < 20) {
                // Eat effect: tiny particles that will now fade away automatically
                this.particles.createMenuBurst(target.x, target.y, 8, 'black');
                const index = menuParticles.indexOf(target);
                if (index > -1) {
                    menuParticles.splice(index, 1);
                }
                bird.targetParticle = null;
            }
        }
        this.render();
    }
    
    render() {
        if (!this.active || !this.bird || !this.spritesLoaded) return;
        
        const img = this.assets.get('costume3');
        if (!img) return;
        
        const bird = this.bird;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = bird.width;
        let drawHeight = bird.width / aspectRatio;

        this.menuCtx.save();
        // x,y are center; draw centered
        this.menuCtx.translate(bird.x, bird.y);
        if (bird.direction === -1) {
            this.menuCtx.scale(-1, 1);
        }
        this.menuCtx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        this.menuCtx.restore();
    }
}