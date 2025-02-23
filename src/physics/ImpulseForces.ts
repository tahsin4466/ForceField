import { IExternalForceGenerator } from "./ForceGenerator.ts";
import { RigidBody } from "./RigidBody";

export class ImpulseForce implements IExternalForceGenerator {
    private position: { x: number; y: number; z: number };
    private forceMagnitude: number;
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

        if (distance < this.radius) {
            const falloff = this.decayFunction(distance, this.radius);

            const direction = {
                x: dx / Math.max(distance, 0.01),
                y: (dy + 1) / Math.max(distance, 0.01), // Ensure upward motion
                z: dz / Math.max(distance, 0.01),
            };

            const impulse = this.forceMagnitude * falloff * (1 / (body.mass + 1));

            body.velocity.x += direction.x * impulse;
            body.velocity.y += Math.max(direction.y * impulse, 5);
            body.velocity.z += direction.z * impulse;
        }
    }
}

export class ExplosionForce extends ImpulseForce {
    constructor(position: { x: number; y: number; z: number }, forceMagnitude: number, radius: number) {
        super(position, forceMagnitude, radius, (d, r) => Math.exp(-d / r)); // Exponential decay for realism
    }
}

