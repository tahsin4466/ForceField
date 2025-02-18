import { RigidBody } from './RigidBody';

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

    // Find the smallest axis of penetration and separate objects smoothly
    if (overlapX < overlapY && overlapX < overlapZ) {
        const pushAmount = overlapX * 0.5;
        objA.position.x += pushAmount;
        objB.position.x -= pushAmount;
    } else if (overlapY < overlapZ) {
        const pushAmount = overlapY * 0.5;
        objA.position.y += pushAmount;
        objB.position.y -= pushAmount;

        // Bounciness Logic: Control how much velocity is retained after collision
        const combinedBounciness = (objA.bounciness + objB.bounciness) / 2;
        objA.velocity.y *= -combinedBounciness;
        objB.velocity.y *= -combinedBounciness;
    } else {
        const pushAmount = overlapZ * 0.5;
        objA.position.z += pushAmount;
        objB.position.z -= pushAmount;
    }

    // Apply friction during collisions
    const combinedFriction = (objA.friction + objB.friction) / 2;
    applyFrictionDuringCollision(objA, combinedFriction);
    applyFrictionDuringCollision(objB, combinedFriction);
}

// Friction during collisions (gradual slow down, not an instant stop)
function applyFrictionDuringCollision(obj: RigidBody, friction: number) {
    const frictionFactor = Math.max(0, 1 - friction * 0.05); // Less aggressive friction

    obj.velocity.x *= frictionFactor;
    obj.velocity.z *= frictionFactor;

    // If the object is moving slowly, let it gradually stop
    if (Math.abs(obj.velocity.x) < 0.01) obj.velocity.x = 0;
    if (Math.abs(obj.velocity.z) < 0.01) obj.velocity.z = 0;
}

