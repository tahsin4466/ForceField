import { RigidBody } from "./RigidBody";
import { CollisionImpulse } from "./ImpulseForces.ts"

export function handleCollisions(objects: RigidBody[], impulses: CollisionImpulse[]) {
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];

        // Handle ground collision separately
        if (obj.min.y < 0) {
            resolveGroundCollision(obj);
        }

        for (let j = i + 1; j < objects.length; j++) {
            if (objects[i].isColliding(objects[j])) {
                resolveObjectCollision(objects[i], objects[j], impulses);
            }
        }
    }
}

/**
 * Resolves a collision between two objects and generates an impulse.
 */
function resolveObjectCollision(objA: RigidBody, objB: RigidBody, impulses: CollisionImpulse[], steps: number = 4) {
    const overlapX = Math.min(objA.max.x - objB.min.x, objB.max.x - objA.min.x);
    const overlapY = Math.min(objA.max.y - objB.min.y, objB.max.y - objA.min.y);
    const overlapZ = Math.min(objA.max.z - objB.min.z, objB.max.z - objA.min.z);

    let normal = { x: 0, y: 0, z: 0 };
    let pushAmount = 0;

    if (overlapX < overlapY && overlapX < overlapZ) {
        pushAmount = overlapX * 0.4; // Reduced push to 40% to prevent instability
        normal.x = 1;
    } else if (overlapY < overlapZ) {
        pushAmount = overlapY * 0.4;
        normal.y = 1;
    } else {
        pushAmount = overlapZ * 0.4;
        normal.z = 1;
    }

    objA.position.x += pushAmount * normal.x;
    objA.position.y += pushAmount * normal.y;
    objA.position.z += pushAmount * normal.z;

    objB.position.x -= pushAmount * normal.x;
    objB.position.y -= pushAmount * normal.y;
    objB.position.z -= pushAmount * normal.z;

    // Apply impulse in smaller increments
    const collisionImpulse = new CollisionImpulse(objA, objB, normal);
    const impulseStep = {
        x: (collisionImpulse.forceMagnitude * normal.x / steps) * 0.7, // Scale impulse down
        y: (collisionImpulse.forceMagnitude * normal.y / steps) * 0.7,
        z: (collisionImpulse.forceMagnitude * normal.z / steps) * 0.7,
    };

    for (let i = 0; i < steps; i++) {
        objA.velocity.x += (impulseStep.x / objA.mass);
        objA.velocity.y += (impulseStep.y / objA.mass);
        objA.velocity.z += (impulseStep.z / objA.mass);

        objB.velocity.x -= (impulseStep.x / objB.mass);
        objB.velocity.y -= (impulseStep.y / objB.mass);
        objB.velocity.z -= (impulseStep.z / objB.mass);

        // Early exit if separation is achieved
        if (!objA.isColliding(objB)) {
            break;
        }
    }

    impulses.push(collisionImpulse);
}


/**
 * Resolves collisions with the ground.
 */
function resolveGroundCollision(obj: RigidBody) {
    obj.position.y = obj.size.y / 2;

    if (Math.abs(obj.velocity.y) < 0.1) {
        obj.velocity.y = 0;
    } else {
        obj.velocity.y *= -obj.bounciness;
    }
}
