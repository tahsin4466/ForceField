import { RigidBody } from "./RigidBody";

export interface IForceGenerator {
    applyForce(body: RigidBody, deltaTime: number): void;
}

export interface IExternalForceGenerator {
    applyImpulse(body: RigidBody): void;
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

    getBodyA(): RigidBody {
        return this.objA;
    }

    getBodyB(): RigidBody {
        return this.objB;
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


