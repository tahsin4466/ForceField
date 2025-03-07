import { IExternalForceGenerator } from "./ForceGenerator.ts";
import { RigidBody } from "./RigidBody";

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

        // Ensure objects beyond the radius still feel a weak force
        const falloff = this.decayFunction(distance, this.radius);

        if (falloff > 0.01) { // Threshold so very far objects get a negligible force but not exactly zero
            const direction = {
                x: dx / Math.max(distance, 0.01),
                y: (dy + 1) / Math.max(distance, 0.01), // Ensure upward motion
                z: dz / Math.max(distance, 0.01),
            };

            // Impulse scales with falloff but applies even beyond radius
            const impulse = this.forceMagnitude * falloff * (1 / (body.mass + 1));

            // Select a random impact point near the body (off-center)
            const impactPoint = {
                x: body.position.x + (Math.random() - 0.5) * body.size.x,
                y: body.position.y + (Math.random() - 0.5) * body.size.y,
                z: body.position.z + (Math.random() - 0.5) * body.size.z
            };

            // Compute force vector
            const force = {
                x: direction.x * impulse,
                y: Math.max(direction.y * impulse, 5), // Ensure some upward motion
                z: direction.z * impulse
            };

            // Apply force at impact point
            body.applyForceAtPoint(force, impactPoint);
        }
    }
}

export class CollisionImpulse extends ImpulseForce {
    constructor(objA: RigidBody, objB: RigidBody, normal: { x: number; y: number; z: number }, contactPoint: { x: number; y: number; z: number }) {
        const relativeVelocity = {
            x: objB.velocity.x - objA.velocity.x,
            y: objB.velocity.y - objA.velocity.y,
            z: objB.velocity.z - objA.velocity.z,
        };

        // Compute impulse magnitude using coefficient of restitution (bounciness)
        const restitution = Math.min(Math.max(objA.bounciness, objB.bounciness), 0.5);
        const impulseMagnitude =
            (-(1 + restitution) *
                (relativeVelocity.x * normal.x +
                    relativeVelocity.y * normal.y +
                    relativeVelocity.z * normal.z)) /
            (1 / objA.mass + 1 / objB.mass);

        // Compute impulse direction
        const impulse = {
            x: normal.x * impulseMagnitude,
            y: normal.y * impulseMagnitude,
            z: normal.z * impulseMagnitude,
        };

        super(contactPoint, Math.abs(impulseMagnitude), 1, () => 1);

        const impulseFraction = 0.8;
        objA.velocity.x += (impulse.x / objA.mass) * impulseFraction;
        objA.velocity.y += (impulse.y / objA.mass) * impulseFraction;
        objA.velocity.z += (impulse.z / objA.mass) * impulseFraction;
        objB.velocity.x -= (impulse.x / objB.mass) * impulseFraction;
        objB.velocity.y -= (impulse.y / objB.mass) * impulseFraction;
        objB.velocity.z -= (impulse.z / objB.mass) * impulseFraction;

        // **Apply rotational effect based on impact point**
        objA.applyForceAtPoint(impulse, contactPoint);
        objB.applyForceAtPoint({ x: -impulse.x, y: -impulse.y, z: -impulse.z }, contactPoint);
    }
}

export class ExplosionForce extends ImpulseForce {
    constructor(position: { x: number; y: number; z: number }, forceMagnitude: number, radius: number) {
        super(position, forceMagnitude, radius, (d, r) => Math.exp(-d / r)); // Exponential decay for realism
    }
}