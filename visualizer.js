export class Visualizer {
    constructor(audioManager) {
        this.audio = audioManager;
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'visualizerCanvas';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.enabled = false;
        this.palette = { background: 'white', foreground: 'black' };
        this._raf = null;

        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        this.resize();
        this.gridColor = 'rgba(0,0,0,0.08)';
    }

    setPalette(palette) {
        this.palette = palette;
        this.gridColor = this.alpha(palette.foreground, 0.08);
    }

    setEnabled(on) {
        this.enabled = on;
        this.canvas.style.display = on ? 'block' : 'none';
        if (on) {
            this.loop();
        } else if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    loop() {
        if (!this.enabled) return;
        this.render();
        this._raf = requestAnimationFrame(() => this.loop());
    }

    render() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        ctx.fillStyle = this.palette.background;
        ctx.fillRect(0, 0, width, height);

        const data = this.audio.getAnalyserData?.() || null;

        const bars = data ? data.length : 64;
        const barWidth = Math.max(2, width / (bars + 8));
        const baseColor = this.palette.foreground;

        ctx.save();
        ctx.translate(0, height);
        ctx.scale(1, -1); 

        for (let i = 0; i < bars; i++) {
            const v = data ? data[i] : 0;
            const h = data ? (v / 255) * (height * 0.4) : (Math.sin((Date.now() / 500) + i * 0.2) * 0.5 + 0.5) * (height * 0.2);

            ctx.fillStyle = baseColor;
            const x = i * barWidth + 4;
            const y = 0;
            const radius = Math.min(6, barWidth * 0.4);

            this.roundedRect(ctx, x, y, barWidth * 0.7, h + 6, radius);
            ctx.fill();
        }
        ctx.restore();

        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    alpha(hex, a) {
        if (/^#([0-9a-f]{6})$/i.test(hex)) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${a})`;
        }
        return `rgba(0,0,0,${a})`;
    }

    roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}