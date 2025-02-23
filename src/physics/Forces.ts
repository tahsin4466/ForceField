import { RigidBody } from "./RigidBody";

export interface IForceGenerator {
    applyForce(body: RigidBody, deltaTime: number): void;
}

export class GravityForce implements IForceGenerator {
    private gravity: number;

    constructor(gravity: number = -9.81) {
        this.gravity = gravity;
    }

    applyForce(body: RigidBody, deltaTime: number) {
        if (body.mass <= 0) return;
        body.applyForce({ x: 0, y: this.gravity * body.mass, z: 0 });
    }
}

export class FrictionForce implements IForceGenerator {
    applyForce(body: RigidBody, deltaTime: number) {
        if (body.position.y <= body.size.y / 2) { // ✅ Apply only if touching ground
            const velocityMagnitude = Math.sqrt(body.velocity.x ** 2 + body.velocity.z ** 2);

            if (velocityMagnitude < body.staticFriction) {
                // ✅ Apply Static Friction: Stop movement completely
                body.velocity.x = 0;
                body.velocity.z = 0;
            } else {
                // ✅ Apply Kinetic Friction: Reduce velocity gradually
                const frictionFactor = Math.max(0, 1 - body.kineticFriction * deltaTime);
                body.velocity.x *= frictionFactor;
                body.velocity.z *= frictionFactor;

                if (Math.abs(body.velocity.x) < 0.01) body.velocity.x = 0;
                if (Math.abs(body.velocity.z) < 0.01) body.velocity.z = 0;
            }
        }
    }
}

export class CollisionForce implements IForceGenerator {
    private objA: RigidBody;
    private objB: RigidBody;
    private normal: { x: number; y: number; z: number };

    constructor(objA: RigidBody, objB: RigidBody, normal: { x: number; y: number; z: number }) {
        this.objA = objA;
        this.objB = objB;
        this.normal = normal;
    }

    applyForce(body: RigidBody, deltaTime: number) {
        if (body !== this.objA && body !== this.objB) return;

        let other = body === this.objA ? this.objB : this.objA;
        let bounciness = Math.max(body.bounciness, other.bounciness);

        if (this.normal.x) {
            body.velocity.x *= -bounciness;
        }
        if (this.normal.y) {
            body.velocity.y *= -bounciness;
        }
        if (this.normal.z) {
            body.velocity.z *= -bounciness;
        }

        // Compute Static and Kinetic Friction Coefficients
        const staticFriction = Math.max(body.staticFriction, other.staticFriction); // Use max static friction
        const kineticFriction = (body.kineticFriction + other.kineticFriction) / 2; // Use avg kinetic friction

        // Apply Static Friction: If velocity is small, stop it completely
        if (Math.abs(body.velocity.x) < staticFriction) body.velocity.x = 0;
        if (Math.abs(body.velocity.z) < staticFriction) body.velocity.z = 0;

        // Apply Kinetic Friction: Slow down movement over time
        body.velocity.x *= Math.max(0, 1 - kineticFriction * deltaTime);
        body.velocity.z *= Math.max(0, 1 - kineticFriction * deltaTime);
    }
}

export class ExplosionForce implements IForceGenerator {
    private position: { x: number; y: number; z: number };
    private forceMagnitude: number;
    private radius: number;

    constructor(position: { x: number; y: number; z: number }, forceMagnitude: number, radius: number) {
        this.position = position;
        this.forceMagnitude = forceMagnitude;
        this.radius = radius;
    }

    applyForce(body: RigidBody, deltaTime: number) {
        const dx = body.position.x - this.position.x;
        const dy = body.position.y - this.position.y;
        const dz = body.position.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < this.radius) {
            const direction = {
                x: dx / distance,
                y: dy / distance,
                z: dz / distance,
            };

            const falloff = 1 / Math.max(distance * distance, 1); // Inverse square law
            const appliedForce = this.forceMagnitude * falloff * (1 / body.mass);

            body.applyForce({
                x: direction.x * appliedForce,
                y: direction.y * appliedForce,
                z: direction.z * appliedForce,
            });
        }
    }
}


