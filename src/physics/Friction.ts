import { RigidBody } from "./RigidBody";

export function applyFriction(obj: RigidBody, groundFriction: number) {
    if (Math.abs(obj.velocity.x) > 0.001) {
        obj.velocity.x *= 1 - Math.min(groundFriction, 1);
    }
    if (Math.abs(obj.velocity.z) > 0.001) {
        obj.velocity.z *= 1 - Math.min(groundFriction, 1);
    }
}

// Friction during collisions (gradual slow down, not an instant stop)
export function applyFrictionDuringCollision(obj: RigidBody, friction: number) {
    // Reduce velocity gradually based on friction coefficient
    const frictionFactor = Math.max(0, 1 - friction * 0.05); // Lower values make friction weaker per frame

    obj.velocity.x *= frictionFactor;
    obj.velocity.z *= frictionFactor;

    // If the object is moving very slowly, stop it completely
    if (Math.abs(obj.velocity.x) < 0.01) obj.velocity.x = 0;
    if (Math.abs(obj.velocity.z) < 0.01) obj.velocity.z = 0;
}

