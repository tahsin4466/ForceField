import { IExternalForceGenerator } from "./ForceGenerator.ts";
import { RigidBody } from "./RigidBody";
import { Vector3 } from "three"

export class ImpulseForce implements IExternalForceGenerator {
    private position: { x: number; y: number; z: number };
    forceMagnitude: number;
    private radius: number;
    private decayFunction: (distance: number, radius: number) => number;

    constructor(
        position: { x: number; y: number; z: number },
        forceMagnitude: number,
        radius: number,
        decayFunction?: (distance: number, radius: number) => number
    ) {
        this.position = position;
        this.forceMagnitude = forceMagnitude;
        this.radius = radius;
        this.decayFunction = decayFunction || ((d, r) => Math.exp(-d / r)); // Default: exponential decay
    }

    applyImpulse(body: RigidBody) {
        const dx = body.position.x - this.position.x;
        const dy = body.position.y - this.position.y;
        const dz = body.position.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const falloff = this.decayFunction(distance, this.radius);

        if (falloff > 0.01) {
            const direction = {
                x: dx / Math.max(distance, 0.01),
                y: dy / Math.max(distance, 0.01),
                z: dz / Math.max(distance, 0.01),
            };

            // Impulse scales with falloff but applies even beyond radius
            const impulse = this.forceMagnitude * falloff * (1 / (body.mass + 1));

            const force = {
                x: direction.x * impulse,
                y: direction.y * impulse,
                z: direction.z * impulse
            };

            // Check if object is resting on the ground
            const isOnGround = body.position.y-(body.size.y/2) <= 0.01 && body.rotation.pitch <= 0.1 && body.rotation.roll <= 0.1;
            if (isOnGround) {
                // Apply only linear motion (no torque/rotation)
                if (force.y < 0) {
                    force.y = 0;
                }
                body.applyForce(force);

            } else {
                // Normal force application at impact point (includes torque)
                const impactPoint = {
                    x: body.position.x + (Math.random() - 0.5) * body.size.x,
                    y: body.position.y + (Math.random() - 0.5) * body.size.y,
                    z: body.position.z + (Math.random() - 0.5) * body.size.z
                };

                // Apply force at impact point (allows torque)
                body.applyForceAtPoint(force, impactPoint);
            }
        }
    }
}

export class ExplosionForce extends ImpulseForce {
    constructor(position: { x: number; y: number; z: number }, forceMagnitude: number, radius: number) {
        super(position, forceMagnitude, radius, (d, r) => Math.exp(-d / r)); // Exponential decay for realism
    }
}

export class CursorForce implements IExternalForceGenerator {
    forceMagnitude: number;
    forceDirection: Vector3;
    body: RigidBody;
    point: Vector3;

    constructor(
        forceMagnitude: number,
        forceDirection: Vector3,
        body: RigidBody,
        point: Vector3,
    ) {
        this.forceMagnitude = forceMagnitude;
        this.forceDirection = forceDirection;
        this.body = body;
        this.point = point;
    }

    applyImpulse() {
    const force = {
        x: this.forceDirection.x * Math.pow(2, this.forceMagnitude) * this.body.mass,
        y: this.forceDirection.y * Math.pow(2, this.forceMagnitude) * this.body.mass,
        z: this.forceDirection.z * Math.pow(2, this.forceMagnitude) * this.body.mass,
    };
    this.body.applyForceAtPoint(force, this.point);
    }
}