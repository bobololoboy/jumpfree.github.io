export class CameraController {
    constructor(canvas, player) {
        this.canvas = canvas;
        this.player = player;
        this.x = 0;
        this.y = 0;
        this.viewportWidth = canvas.width;
        this.viewportHeight = canvas.height;
    }

    setViewport(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    reset() {
        this.x = 0;
        this.y = 0;
    }

    update() {
        let targetX = this.player.x - this.viewportWidth / 3;
        let targetY = this.player.y - this.viewportHeight / 2;
        
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.05;
        
        // Clamp camera so it doesn't go too high into void
        if (this.y < -500) this.y = -500;
    }
}