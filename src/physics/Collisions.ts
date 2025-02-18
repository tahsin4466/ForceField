import { RigidBody } from './RigidBody';
import { applyFrictionDuringCollision } from './Friction';

export function handleCollisions(objects: RigidBody[]) {
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            if (objects[i].isColliding(objects[j])) {
                resolveCollision(objects[i], objects[j]);
            }
        }
    }
}

// Resolves collisions smoothly by progressively pushing objects apart
function resolveCollision(objA: RigidBody, objB: RigidBody) {
    const overlapX = Math.min(objA.max.x - objB.min.x, objB.max.x - objA.min.x);
    const overlapY = Math.min(objA.max.y - objB.min.y, objB.max.y - objA.min.y);
    const overlapZ = Math.min(objA.max.z - objB.min.z, objB.max.z - objA.min.z);

    // Find smallest axis of penetration and separate objects smoothly
    if (overlapX < overlapY && overlapX < overlapZ) {
        const pushAmount = overlapX * 0.5;
        objA.position.x += pushAmount;
        objB.position.x -= pushAmount;
    } else if (overlapY < overlapZ) {
        const pushAmount = overlapY * 0.5;
        objA.position.y += pushAmount;
        objB.position.y -= pushAmount;

        // Apply separate bounciness per object
        if (objA.bounciness > 0) {
            objA.velocity.y = -objA.velocity.y * objA.bounciness;
        }
        if (objB.bounciness > 0) {
            objB.velocity.y = -objB.velocity.y * objB.bounciness;
        }

        // Ensure small bounces don't get killed too early
        if (Math.abs(objA.velocity.y) < 0.1) objA.velocity.y = 0;
        if (Math.abs(objB.velocity.y) < 0.1) objB.velocity.y = 0;

    } else {
        const pushAmount = overlapZ * 0.5;
        objA.position.z += pushAmount;
        objB.position.z -= pushAmount;
    }

    // Apply friction
    const combinedFriction = (objA.friction + objB.friction) / 2;
    applyFrictionDuringCollision(objA, combinedFriction);
    applyFrictionDuringCollision(objB, combinedFriction);
}
