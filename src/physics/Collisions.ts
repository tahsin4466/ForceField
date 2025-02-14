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

// Resolves collisions by pushing objects apart
function resolveCollision(objA: RigidBody, objB: RigidBody) {
    const pushAmount = 0.05; // Small separation value

    if (objA.position.y > objB.position.y) {
        objA.position.y += pushAmount;
        objB.position.y -= pushAmount;
    } else {
        objA.position.y -= pushAmount;
        objB.position.y += pushAmount;
    }

    objA.velocity.y = 0;
    objB.velocity.y = 0;
}
