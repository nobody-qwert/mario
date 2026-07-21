// Renderer - handles all canvas drawing
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.textBaseline = 'top';
    }

    drawBackground(level, cameraX) {
        const ctx = this.ctx;
        
        // Sky background color
        ctx.fillStyle = level.bg || '#6b95ea';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Subtle gradient for non-underground levels
        if (level.bg !== '#1a0a2e' && level.bg !== '#2d1b69') {
            const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            grad.addColorStop(0, level.bg);
            grad.addColorStop(0.75, level.bg);
            grad.addColorStop(1, this._lighten(level.groundColor || '#4CAF50', 30));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawDecorations(decorations, cameraX) {
        const ctx = this.ctx;
        
        // Clouds with parallax (move at 30% speed)
        for (let cloud of decorations.clouds) {
            const sx = cloud.x - cameraX * 0.3;
            if (sx > -80 && sx < this.canvas.width + 80) {
                ctx.font = '28px serif';
                ctx.globalAlpha = 0.6;
                ctx.fillText('☁️', sx, cloud.y);
                ctx.globalAlpha = 1;
            }
        }

        // Bushes with parallax (move at 70% speed)
        for (let bush of decorations.bushes) {
            const sx = bush.x - cameraX * 0.7;
            if (sx > -60 && sx < this.canvas.width + 60) {
                ctx.save();
                ctx.translate(sx, 458);
                ctx.scale(bush.scale, bush.scale);
                ctx.font = '32px serif';
                ctx.fillText('🌳', 0, 0);
                ctx.restore();
            }
        }

        // Distant mountains (parallax at 15% speed)
        this._drawMountains(cameraX);
    }

    _drawMountains(cameraX) {
        const ctx = this.ctx;
        
        // Far hills
        ctx.fillStyle = 'rgba(0, 80, 0, 0.12)';
        for (let i = -1; i < 15; i++) {
            const mx = i * 400 - ((cameraX * 0.15) % 6000);
            if (mx > -300 && mx < this.canvas.width + 300) {
                ctx.beginPath();
                ctx.moveTo(mx, 480);
                ctx.lineTo(mx + 120, 340);
                ctx.lineTo(mx + 240, 480);
                ctx.fill();
            }
        }

        // Closer hills
        ctx.fillStyle = 'rgba(0, 100, 0, 0.18)';
        for (let i = -1; i < 25; i++) {
            const hx = i * 250 - ((cameraX * 0.3) % 6000);
            if (hx > -150 && hx < this.canvas.width + 150) {
                ctx.beginPath();
                ctx.moveTo(hx, 480);
                ctx.lineTo(hx + 70, 410);
                ctx.lineTo(hx + 140, 480);
                ctx.fill();
            }
        }
    }

    drawBlocks(blocks) {
        const ctx = this.ctx;
        
        for (let block of blocks) {
            if (block.type === 'pole') continue;
            
            const sx = Math.floor(block.x);
            const sy = Math.floor(block.y);
            
            if (sx < -TILE || sx > this.canvas.width + TILE) continue;

            switch(block.type) {
                case 'ground':
                    this._drawGround(ctx, sx, sy, block.color);
                    break;
                case 'question':
                    this._drawQuestion(ctx, sx, sy, block.hit);
                    break;
                case 'brick':
                    this._drawBrick(ctx, sx, sy, block.color);
                    break;
            }
        }
    }

    _drawGround(ctx, x, y, color) {
        ctx.fillStyle = color || '#4CAF50';
        ctx.fillRect(x, y + 8, TILE, TILE - 8);
        
        // Grass top
        ctx.fillStyle = this._lighten(color || '#4CAF50', 30);
        ctx.fillRect(x, y, TILE, 8);

        // Texture dots
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 4; i++) {
            const dx = x + ((i * 9 + 3) % 28);
            const dy = y + 12 + (((i * 7) % 14));
            ctx.fillRect(dx, dy, 3, 3);
        }

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE, TILE);
    }

    _drawQuestion(ctx, x, y, hit) {
        if (hit) {
            // Empty block
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(x, y, TILE, TILE);
            
            // Cross pattern
            ctx.strokeStyle = '#6B5340';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 8, y + 16);
            ctx.lineTo(x + 24, y + 16);
            ctx.stroke();

            // Rivets
            ctx.fillStyle = '#6B5340';
            const corners = [[3,3],[TILE-5,3],[3,TILE-5],[TILE-5,TILE-5]];
            for (let [cx, cy] of corners) {
                ctx.fillRect(x + cx, y + cy, 2, 2);
            }
        } else {
            // Active question block with pulse animation
            const t = Date.now() * 0.004;
            const bright = Math.sin(t) * 15;
            
            ctx.fillStyle = `rgb(${243 + bright}, ${208 - bright/2}, ${7})`;
            ctx.fillRect(x, y, TILE, TILE);

            // Question mark
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 19px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', x + TILE/2, y + TILE/2 + 1);

            // Border
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);

            // Corner rivets
            ctx.fillStyle = '#B8860B';
            const corners = [[3,3],[TILE-5,3],[3,TILE-5],[TILE-5,TILE-5]];
            for (let [cx, cy] of corners) {
                ctx.fillRect(x + cx, y + cy, 2, 2);
            }
        }
    }

    _drawBrick(ctx, x, y, color) {
        ctx.fillStyle = color || '#C84C09';
        ctx.fillRect(x, y, TILE, TILE);

        // Brick pattern lines
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        
        // Horizontal divider
        ctx.beginPath();
        ctx.moveTo(x, y + TILE/2);
        ctx.lineTo(x + TILE, y + TILE/2);
        ctx.stroke();

        // Vertical dividers (staggered)
        ctx.beginPath();
        ctx.moveTo(x + TILE/2, y);
        ctx.lineTo(x + TILE/2, y + TILE/2);
        ctx.moveTo(x + TILE/4, y + TILE/2);
        ctx.lineTo(x + TILE/4, y + TILE);
        ctx.moveTo(x + TILE*3/4, y + TILE/2);
        ctx.lineTo(x + TILE*3/4, y + TILE);
        ctx.stroke();

        // Top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 2, y + 2, TILE - 4, 3);
    }

    drawPipes(pipes, cameraX) {
        const ctx = this.ctx;
        
        for (let pipe of pipes) {
            const sx = Math.floor(pipe.x - cameraX);
            
            if (sx < -60 || sx > this.canvas.width + 60) continue;

            // Pipe body (darker green, below the rim)
            ctx.fillStyle = '#2A9030';
            ctx.fillRect(sx + 4, pipe.y + TILE/2, pipe.width - 8, pipe.height - TILE/2);

            // Pipe top rim
            ctx.fillStyle = '#3CC03C';
            ctx.fillRect(sx, pipe.y, pipe.width, TILE/2);

            // Left highlight on body and rim
            ctx.fillStyle = '#5CE05C';
            ctx.fillRect(sx + 4, pipe.y + 2, 8, TILE/2 - 4);
            ctx.fillRect(sx + 6, pipe.y + TILE/2 + 2, 4, pipe.height - TILE/2 - 2);

            // Right shadow on rim and body
            ctx.fillStyle = '#1A7020';
            ctx.fillRect(sx + pipe.width - 10, pipe.y + 2, 6, TILE/2 - 4);
            ctx.fillRect(sx + pipe.width - 8, pipe.y + TILE/2 + 2, 4, pipe.height - TILE/2 - 2);

            // Rim outline
            ctx.strokeStyle = '#1A5C1A';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, pipe.y, pipe.width, TILE/2);
        }
    }

    drawFlagPole(flag, cameraX) {
        if (!flag) return;
        
        const ctx = this.ctx;
        const sx = flag.x - cameraX;

        // Pole shadow
        ctx.fillStyle = '#555';
        ctx.fillRect(sx + 3, flag.y, 4, flag.height);

        // Main pole
        ctx.fillStyle = '#999';
        ctx.fillRect(sx + 2, flag.y, 4, flag.height);

        // Pole highlight
        ctx.fillStyle = '#CCC';
        ctx.fillRect(sx + 3, flag.y, 1, flag.height);

        // Ball on top
        ctx.fillStyle = '#E5B800';
        ctx.beginPath();
        ctx.arc(sx + 4, flag.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + 3, flag.y - 1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Flag (animated wave if not reached)
        if (!flag.reached) {
            const wave = Math.sin(Date.now() * 0.005) * 4;
            
            ctx.fillStyle = '#33CC33';
            ctx.beginPath();
            ctx.moveTo(sx + 6, flag.y + 8);
            ctx.lineTo(sx + 34 + wave, flag.y + 20);
            ctx.lineTo(sx + 6, flag.y + 34);
            ctx.closePath();
            ctx.fill();

            // Star on flag
            ctx.fillStyle = '#FBD007';
            ctx.font = '16px serif';
            ctx.textAlign = 'center';
            ctx.fillText('⭐', sx + 18 + wave/2, flag.y + 24);
        }
    }

    drawUI(state, score, coins, lives, levelIndex) {
        const ctx = this.ctx;
        const mode = typeof state === 'string' ? state : state.state;
        
        if (mode === 'gameover') {
            this._drawOverlay('GAME OVER', '#E52521');
        } else if (mode === 'levelComplete') {
            this._drawOverlay('LEVEL COMPLETE!', '#33CC33');
        } else if (mode === 'win') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Victory text
            const t = Date.now() * 0.003;
            const scale = 1 + Math.sin(t) * 0.05;
            
            ctx.save();
            ctx.translate(this.canvas.width/2, this.canvas.height/2 - 40);
            ctx.scale(scale, scale);
            ctx.font = 'bold 52px Courier New';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#E5B800';
            ctx.fillText('YOU WIN!', 0, 0);
            ctx.restore();

            // Score
            ctx.font = '22px Courier New';
            ctx.fillStyle = '#FFF';
            ctx.textAlign = 'center';
            ctx.fillText(`Final Score: ${score}`, this.canvas.width/2, this.canvas.height/2 + 30);
            
            const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.font = '18px Courier New';
            ctx.fillText('Press SPACE to play again', this.canvas.width/2, this.canvas.height/2 + 70);
            ctx.globalAlpha = 1;

        } else if (mode === 'countdown') {
            const count = Math.ceil(state.countdownTime);
            const label = count > 0 ? count.toString() : 'GO!';
            ctx.font = 'bold 72px Courier New';
            ctx.textAlign = 'center';
            
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,.55)';
            ctx.fillText(label, this.canvas.width/2 + 4, this.canvas.height/2 - 56);
            ctx.fillStyle = count > 0 ? '#FFF' : '#FBD007';
            ctx.fillText(label, this.canvas.width/2, this.canvas.height/2 - 60);

        } else if (mode === 'title') {
            this._drawTitle();
        }
    }

    _drawOverlay(text, color) {
        const ctx = this.ctx;
        
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title text with shadow
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        
        ctx.fillStyle = '#000';
        ctx.fillText(text, this.canvas.width/2 + 3, this.canvas.height/2 - 57);
        
        ctx.fillStyle = color;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(text, this.canvas.width/2, this.canvas.height/2 - 60);
        ctx.shadowBlur = 0;

        // Continue prompt
        const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.font = '18px Courier New';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to continue', this.canvas.width/2, this.canvas.height/2 + 30);
        ctx.globalAlpha = 1;
    }

    _drawTitle() {
        const ctx = this.ctx;
        
        // Title with shadow
        ctx.font = 'bold 54px Courier New';
        ctx.textAlign = 'center';
        
        ctx.fillStyle = '#8B0000';
        ctx.fillText('SUPER MARIO', this.canvas.width/2 + 3, 123);
        ctx.fillStyle = '#E52521';
        ctx.fillText('EMOJI EDITION', this.canvas.width/2, 120);

        // Decorative line
        ctx.font = '26px serif';
        ctx.fillText('🍄 🪙 👾 🏁 ⭐', this.canvas.width/2, 185);

        // Start prompt with pulse
        const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.font = 'bold 20px Courier New';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to Start', this.canvas.width/2, 265);
        ctx.globalAlpha = 1;

        // Controls info
        ctx.font = '14px Courier New';
        ctx.fillStyle = '#CCC';
        ctx.fillText('← → or A/D : Move    |    SPACE / ↑ / W : Jump', this.canvas.width/2, 330);
        
        ctx.fillStyle = '#999';
        ctx.font = '12px Courier New';
        ctx.fillText('4 Levels • Stomp Goombas • Collect Coins • Reach the Flag!', this.canvas.width/2, 400);
    }

    _lighten(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, ((num >> 16) & 0xFF) + amount);
        const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
        const b = Math.min(255, (num & 0xFF) + amount);
        return `rgb(${r},${g},${b})`;
    }
}

const TILE = 32;

export { Renderer };
