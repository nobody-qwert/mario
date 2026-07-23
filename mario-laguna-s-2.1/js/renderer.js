/* ========================================
   Super Mario Bros. Web — Renderer
   Handles canvas drawing and camera
   ======================================== */

import { CONFIG, COLORS, DIMENSIONS } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cameraX = 0;
        this.cameraY = 0;
        this.targetCameraX = 0;
        this.targetCameraY = 0;
        this.clouds = [];
        this._generateClouds();
    }

    resize() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const aspect = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;

        let width = vw;
        let height = width / aspect;

        if (height > vh) {
            height = vh;
            width = height * aspect;
        }

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
    }

    _generateClouds() {
        this.clouds = [];
        for (let i = 0; i < 20; i++) {
            this.clouds.push({
                x: Math.random() * 3000,
                y: Math.random() * 200 + 20,
                w: 60 + Math.random() * 80,
                h: 30 + Math.random() * 20,
            });
        }
    }

    updateCamera(targetX, targetY, levelWidth, levelHeight) {
        const halfWidth = CONFIG.CANVAS_WIDTH / 2;
        const halfHeight = CONFIG.CANVAS_HEIGHT / 2;

        this.targetCameraX = targetX - halfWidth;
        this.targetCameraY = targetY - halfHeight;

        this.targetCameraX = Math.max(0, Math.min(this.targetCameraX, levelWidth - CONFIG.CANVAS_WIDTH));
        this.targetCameraY = Math.max(0, Math.min(this.targetCameraY, levelHeight - CONFIG.CANVAS_HEIGHT));

        this.cameraX += (this.targetCameraX - this.cameraX) * 0.1;
        this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;
    }

    clear(backgroundColor = COLORS.SKY_TOP) {
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    drawClouds() {
        this.ctx.fillStyle = COLORS.CLOUD;
        this.clouds.forEach(cloud => {
            const x = cloud.x - this.cameraX * 0.3;
            const y = cloud.y - this.cameraY * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, cloud.h / 2, 0, Math.PI * 2);
            this.ctx.arc(x + cloud.w * 0.3, y - cloud.h * 0.2, cloud.h * 0.4, 0, Math.PI * 2);
            this.ctx.arc(x + cloud.w * 0.6, y, cloud.h * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawHills(levelWidth) {
        const hillColor = '#2d8a4e';
        this.ctx.fillStyle = hillColor;
        for (let i = 0; i < levelWidth; i += 200) {
            const x = i - this.cameraX * 0.5;
            const y = CONFIG.CANVAS_HEIGHT - 50 - this.cameraY * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 80, Math.PI, 0);
            this.ctx.fill();
        }
    }

    renderPlatforms(platforms) {
        platforms.forEach(p => p.render(this.ctx, this.cameraX, this.cameraY));
    }

    renderCoins(coins) {
        coins.forEach(c => c.render(this.ctx, this.cameraX, this.cameraY));
    }

    renderStars(stars) {
        stars.forEach(s => s.render(this.ctx, this.cameraX, this.cameraY));
    }

    renderEnemies(enemies) {
        enemies.forEach(e => e.render(this.ctx, this.cameraX, this.cameraY));
    }

    renderFlag(flag) {
        flag.render(this.ctx, this.cameraX, this.cameraY);
    }

    renderParticles(particles) {
        particles.render(this.ctx);
    }
}
