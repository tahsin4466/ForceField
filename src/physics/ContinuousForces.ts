import {RigidBody} from "./RigidBody.ts";
import {IForceGenerator} from "./ForceGenerator.ts";

export class GravityForce implements IForceGenerator {
    private gravity: number;
    constructor(gravity: number) {
        this.gravity = gravity;
    }
    applyForce(body: RigidBody) {
        if (body.mass <= 0) return;
        body.applyForce({ x: 0, y: this.gravity * body.mass, z: 0 });
    }
}

export class FrictionForce implements IForceGenerator {
    private staticFriction: number;
    private kineticFriction: number;

    constructor(staticFriction: number, kineticFriction: number) { // Set default friction values
        this.staticFriction = staticFriction;
        this.kineticFriction = kineticFriction;
    }

    applyForce(body: RigidBody, deltaTime: number) {
        if (body.position.y <= body.size.y / 2) { // Apply only if touching ground
            const velocityMagnitude = Math.sqrt(body.velocity.x ** 2 + body.velocity.z ** 2);

            // Use either object friction or default world friction
            const bodyStaticFriction = body.staticFriction || this.staticFriction;
            const bodyKineticFriction = body.kineticFriction || this.kineticFriction;

            // Smooth Static Friction
            if (velocityMagnitude < bodyStaticFriction * 3) {
                body.velocity.x = 0;
                body.velocity.z = 0;
            } else {
                // Softer Kinetic Friction (not too aggressive)
                const frictionStrength = bodyKineticFriction * 6 * body.mass * deltaTime;
                const frictionX = (body.velocity.x / velocityMagnitude) * frictionStrength;
                const frictionZ = (body.velocity.z / velocityMagnitude) * frictionStrength;

                body.velocity.x -= frictionX;
                body.velocity.z -= frictionZ;

                // Prevent overshooting (avoids tiny unwanted movement)
                if (Math.abs(body.velocity.x) < 0.02) body.velocity.x = 0;
                if (Math.abs(body.velocity.z) < 0.02) body.velocity.z = 0;
            }
        }
    }
}