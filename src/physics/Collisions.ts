import { RigidBody } from "./RigidBody";

export function handleCollisions(objects: RigidBody[]) {
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        // Handle ground collision separately
        if (obj.min.y < 0) {
            resolveGroundCollision(obj);
        }

        for (let j = i + 1; j < objects.length; j++) {
            if (objects[i].isColliding(objects[j])) {
                resolveObjectCollision(objects[i], objects[j]);
            }
        }
    }
}

function resolveObjectCollision(objA: RigidBody, objB: RigidBody) {
    // Compute overlap in both directions for each axis
    const overlapX_A = objA.max.x - objB.min.x;
    const overlapX_B = objB.max.x - objA.min.x;
    const overlapY_A = objA.max.y - objB.min.y;
    const overlapY_B = objB.max.y - objA.min.y;
    const overlapZ_A = objA.max.z - objB.min.z;
    const overlapZ_B = objB.max.z - objA.min.z;

    // Ensure overlaps are positive (penetration depth)
    if (overlapX_A <= 0 || overlapX_B <= 0 || overlapY_A <= 0 || overlapY_B <= 0 || overlapZ_A <= 0 || overlapZ_B <= 0) {
        return; // No actual collision
    }

    // Get the smallest overlap in each axis
    const overlapX = Math.min(overlapX_A, overlapX_B);
    const overlapY = Math.min(overlapY_A, overlapY_B);
    const overlapZ = Math.min(overlapZ_A, overlapZ_B);

    // **Check if either object is immovable**
    const objA_Immovable = objA.mass < 0;
    const objB_Immovable = objB.mass < 0;

    // Find the axis with the least penetration depth (smallest overlap)
    if (overlapX < overlapY && overlapX < overlapZ) {
        const pushAmount = overlapX * 0.5;
        if (overlapX_A < overlapX_B) {
            if (!objA_Immovable) objA.position.x -= pushAmount;
            if (!objB_Immovable) objB.position.x += pushAmount;
        } else {
            if (!objA_Immovable) objA.position.x += pushAmount;
            if (!objB_Immovable) objB.position.x -= pushAmount;
        }

        // ✅ **Handle perfect reflection for immovable objects**
        if (objA_Immovable) {
            objB.velocity.x = -objB.velocity.x * objA.bounciness; // Reflect using objA's restitution
        }
        if (objB_Immovable) {
            objA.velocity.x = -objA.velocity.x * objB.bounciness; // Reflect using objB's restitution
        }
    } else if (overlapY < overlapZ) {
        const pushAmount = overlapY * 0.5;
        if (overlapY_A < overlapY_B) {
            if (!objA_Immovable) objA.position.y -= pushAmount;
            if (!objB_Immovable) objB.position.y += pushAmount;
        } else {
            if (!objA_Immovable) objA.position.y += pushAmount;
            if (!objB_Immovable) objB.position.y -= pushAmount;
        }

        // **If objects are resting, stop them from floating**
        if (!objA_Immovable && Math.abs(objA.velocity.y) < 0.5) objA.velocity.y = 0;
        if (!objB_Immovable && Math.abs(objB.velocity.y) < 0.5) objB.velocity.y = 0;

        // ✅ **Perfect reflection for immovable objects**
        if (objA_Immovable) {
            objB.velocity.y = -objB.velocity.y * objA.bounciness;
        }
        if (objB_Immovable) {
            objA.velocity.y = -objA.velocity.y * objB.bounciness;
        }
    } else {
        const pushAmount = overlapZ * 0.5;
        if (overlapZ_A < overlapZ_B) {
            if (!objA_Immovable) objA.position.z -= pushAmount;
            if (!objB_Immovable) objB.position.z += pushAmount;
        } else {
            if (!objA_Immovable) objA.position.z += pushAmount;
            if (!objB_Immovable) objB.position.z -= pushAmount;
        }

        // ✅ **Perfect reflection for immovable objects**
        if (objA_Immovable) {
            objB.velocity.z = -objB.velocity.z * objA.bounciness;
        }
        if (objB_Immovable) {
            objA.velocity.z = -objA.velocity.z * objB.bounciness;
        }
    }

    // **Apply friction after collision resolution**
    const combinedFriction = (objA.kineticFriction + objB.kineticFriction) / 2;
    applyFrictionDuringCollision(objA, combinedFriction);
    applyFrictionDuringCollision(objB, combinedFriction);
}

export function applyFrictionDuringCollision(obj: RigidBody, friction: number) {
    // Reduce velocity gradually based on friction coefficient
    const frictionFactor = Math.max(0, 1 - friction * 0.05); // Lower values make friction weaker per frame

    obj.velocity.x *= frictionFactor;
    obj.velocity.z *= frictionFactor;

    // If the object is moving very slowly, stop it completely
    if (Math.abs(obj.velocity.x) < 0.01) obj.velocity.x = 0;
    if (Math.abs(obj.velocity.z) < 0.01) obj.velocity.z = 0;
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
        } else {
            // If resting on the ground with low movement, stop forces completely
            obj.velocity = {x: 0, y: 0, z: 0};
            obj.acceleration = {x: 0, y: 0, z: 0};
        }

        // **Ensure object does not rotate if it's on the ground**
        obj.rotation.pitch = 0;
        obj.rotation.roll = 0;
        obj.angularVelocity = {x: 0, y: 0, z: 0};
        obj.torque = {x: 0, y: 0, z: 0};
    }
}