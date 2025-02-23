import { RigidBody } from './RigidBody';
import { CollisionForce } from './ForceGenerator.ts';

export function handleCollisions(objects: RigidBody[], collisionForces: CollisionForce[]) {
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (obj.min.y < 0) {
            console.log(`Object hit the floor! Adjusting position.`);
            obj.position.y = obj.size.y / 2;
            if (Math.abs(obj.velocity.y) < 0.1) {
                obj.velocity.y = 0;
            } else {
                obj.velocity.y *= -obj.bounciness;
            }
        }
        for (let j = i + 1; j < objects.length; j++) {
            if (objects[i].isColliding(objects[j])) {
                resolveCollision(objects[i], objects[j], collisionForces);
            }
        }
    }
}

// Resolves collisions and delegates forces to be applied in the next frame
function resolveCollision(objA: RigidBody, objB: RigidBody, collisionForces: CollisionForce[]) {
    const overlapX = Math.min(objA.max.x - objB.min.x, objB.max.x - objA.min.x);
    const overlapY = Math.min(objA.max.y - objB.min.y, objB.max.y - objA.min.y);
    const overlapZ = Math.min(objA.max.z - objB.min.z, objB.max.z - objA.min.z);

    let normal = { x: 0, y: 0, z: 0 };
    let pushAmount = 0;

    if (overlapX < overlapY && overlapX < overlapZ) {
        pushAmount = overlapX * 0.5;
        objA.position.x += pushAmount;
        objB.position.x -= pushAmount;
        normal.x = 1;
    } else if (overlapY < overlapZ) {
        pushAmount = overlapY * 0.5;
        objA.position.y += pushAmount;
        objB.position.y -= pushAmount;
        normal.y = 1;
    } else {
        pushAmount = overlapZ * 0.5;
        objA.position.z += pushAmount;
        objB.position.z -= pushAmount;
        normal.z = 1;
    }

    // Add collision force effect
    collisionForces.push(new CollisionForce(objA, objB, normal));
}
