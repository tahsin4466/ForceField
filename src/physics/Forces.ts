import { RigidBody } from './RigidBody';

export function applyGravity(obj: RigidBody, gravity: number) {
    obj.applyForce({ x: 0, y: gravity * obj.mass, z: 0 });
}

