import { RigidBody } from "./RigidBody";

export function applyGravity(obj: RigidBody, gravity: number) {
    obj.applyForce({ x: 0, y: gravity * obj.mass, z: 0 });
}

export function applyFriction(obj: RigidBody, groundFriction: number) {
    if (Math.abs(obj.velocity.x) > 0.001) {
        obj.velocity.x *= 1 - Math.min(groundFriction, 1);
    }
    if (Math.abs(obj.velocity.z) > 0.001) {
        obj.velocity.z *= 1 - Math.min(groundFriction, 1);
    }
}
