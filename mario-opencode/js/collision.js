// Collision utilities - AABB detection and resolution
class Collision {
    static checkAABB(a, b) {
        const aw = a.w !== undefined ? a.w : a.width;
        const ah = a.h !== undefined ? a.h : a.height;
        const bw = b.w !== undefined ? b.w : b.width;
        const bh = b.h !== undefined ? b.h : b.height;
        return a.x < b.x + bw &&
               a.x + aw > b.x &&
               a.y < b.y + bh &&
               a.y + ah > b.y;
    }

    static resolveVertical(entity, blocks) {
        let grounded = false;
        
        for (let block of blocks) {
            if (!this.checkAABB(entity, block)) continue;

            const overlapTop = (entity.y + entity.height) - block.y;
            const overlapBottom = (block.y + block.h) - entity.y;
            
            // Determine which side has less overlap
            if (overlapTop < overlapBottom && entity.vy >= 0) {
                // Landing on top
                entity.y = block.y - entity.height;
                entity.vy = 0;
                grounded = true;
            } else if (overlapBottom < overlapTop && entity.vy < 0) {
                // Hitting from below
                entity.y = block.y + block.h;
                entity.vy = 0;
            }
        }
        
        return grounded;
    }

    static resolveHorizontal(entity, blocks) {
        for (let block of blocks) {
            if (!this.checkAABB(entity, block)) continue;

            const overlapLeft = (entity.x + entity.width) - block.x;
            const overlapRight = (block.x + block.w) - entity.x;

            if (overlapLeft < overlapRight && entity.vx > 0) {
                entity.x = block.x - entity.width;
            } else if (overlapRight < overlapLeft && entity.vx < 0) {
                entity.x = block.x + block.w;
            }
            
            entity.vx = 0;
        }
    }

    static checkPointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.w &&
               py >= rect.y && py <= rect.y + rect.h;
    }

    static dist(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
}

export { Collision };
