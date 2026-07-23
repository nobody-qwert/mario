/* ========================================
   Super Mario Bros. Web — Physics
   Time-based movement and collision detection
   ======================================== */

import { PHYSICS } from './config.js';

// Apply gravity to an entity (time-scaled)
export function applyGravity(entity, dt) {
    entity.vy += PHYSICS.GRAVITY * (dt || 1);
    entity.vy = Math.min(entity.vy, PHYSICS.TERMINAL_VELOCITY);
    return entity;
}

// Simple AABB (Axis-Aligned Bounding Box) collision check
export function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Detailed collision check with direction
// Returns the side of `entity` that collided with `other` based on minimum overlap
export function getCollisionSide(entity, other) {
    const overlapX = Math.min(entity.x + entity.width, other.x + other.width) - Math.max(entity.x, other.x);
    const overlapY = Math.min(entity.y + entity.height, other.y + other.height) - Math.max(entity.y, other.y);

    if (overlapX <= 0 || overlapY <= 0) return null;

    if (overlapY < overlapX) {
        // Vertical collision - entity is above or below
        if (entity.y + entity.height / 2 < other.y + other.height / 2) {
            return 'bottom'; // entity is on top of other
        } else {
            return 'top'; // entity is below other
        }
    } else {
        // Horizontal collision
        if (entity.x + entity.width / 2 < other.x + other.width / 2) {
            return 'left'; // entity is to the left of other
        } else {
            return 'right'; // entity is to the right of other
        }
    }
}

// Resolve collision between entity and platform
// Returns the collision side or null
export function resolveCollision(entity, platform) {
    if (!checkCollision(entity, platform)) return null;
    return getCollisionSide(entity, platform);
}

// Simple easing for smooth movement
export function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}