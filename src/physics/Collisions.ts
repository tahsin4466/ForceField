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
function resolveObjectCollision(objA: RigidBody, objB: RigidBody, impulses: CollisionImpulse[]) {
    const overlapX = Math.min(objA.max.x - objB.min.x, objB.max.x - objA.min.x);
    const overlapY = Math.min(objA.max.y - objB.min.y, objB.max.y - objA.min.y);
    const overlapZ = Math.min(objA.max.z - objB.min.z, objB.max.z - objA.min.z);

    let normal = { x: 0, y: 0, z: 0 };
    let pushAmount = 0;

    // Determine the smallest overlap direction (collision normal)
    if (overlapX < overlapY && overlapX < overlapZ) {
        pushAmount = overlapX * 0.4;
        normal.x = objA.position.x < objB.position.x ? -1 : 1;
    } else if (overlapY < overlapZ) {
        pushAmount = overlapY * 0.4;
        normal.y = objA.position.y < objB.position.y ? -1 : 1;
    } else {
        pushAmount = overlapZ * 0.4;
        normal.z = objA.position.z < objB.position.z ? -1 : 1;
    }

    // Move objects slightly apart to prevent overlap
    objA.position.x += pushAmount * normal.x;
    objA.position.y += pushAmount * normal.y;
    objA.position.z += pushAmount * normal.z;

    objB.position.x -= pushAmount * normal.x;
    objB.position.y -= pushAmount * normal.y;
    objB.position.z -= pushAmount * normal.z;

    // **NEW: Compute exact collision point**
    const contactPoint = {
        x: (objA.position.x + objB.position.x) / 2,
        y: (objA.position.y + objB.position.y) / 2,
        z: (objA.position.z + objB.position.z) / 2,
    };

    // Apply impulse force at the contact point
    const collisionImpulse = new CollisionImpulse(objA, objB, normal, contactPoint);
    impulses.push(collisionImpulse);
}

function resolveGroundCollision(obj: RigidBody) {
    const groundY = obj.size.y / 2;
    const nextY = obj.position.y + obj.velocity.y * 0.016;

    if (nextY - obj.size.y / 2 < 0) {
        obj.position.y = groundY;

        if (Math.abs(obj.velocity.y) > 0.1) {
            const impulse = {
                x: obj.velocity.x * obj.bounciness,
                y: -obj.velocity.y * obj.bounciness,
                z: obj.velocity.z * obj.bounciness,
            };

            obj.velocity.x = impulse.x;
            obj.velocity.y = impulse.y;
            obj.velocity.z = impulse.z;

            const contactPoint = {
                x: obj.position.x,
                y: groundY,
                z: obj.position.z
            };

            obj.applyForceAtPoint(impulse, contactPoint);
        } else {
            // If resting on the ground with low movement, stop forces
            if (Math.abs(obj.velocity.x) < 0.01 && Math.abs(obj.velocity.z) < 0.01) {
                obj.velocity = { x: 0, y: 0, z: 0 };
                obj.acceleration = { x: 0, y: 0, z: 0 };
            } else {
                obj.velocity.y = 0;
            }
        }
    }
}