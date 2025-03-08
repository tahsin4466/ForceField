import { IExternalForceGenerator } from "./ForceGenerator.ts";
import { RigidBody } from "./RigidBody";

export class ImpulseForce implements IExternalForceGenerator {
    position: { x: number; y: number; z: number };
    forceMagnitude: number;
    radius: number;
    decayFunction: (distance: number, radius: number) => number;

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

            body.velocity.x += direction.x * impulse;
            body.velocity.y += Math.max(direction.y * impulse, 5);
            body.velocity.z += direction.z * impulse;
        }
    }
}

export class CollisionImpulse extends ImpulseForce {
    constructor(objA: RigidBody, objB: RigidBody, normal: { x: number; y: number; z: number }) {
        const relativeVelocity = {
            x: objB.velocity.x - objA.velocity.x,
            y: objB.velocity.y - objA.velocity.y,
            z: objB.velocity.z - objA.velocity.z,
        };

        // Compute impulse magnitude using coefficient of restitution (bounciness)
        const restitution = Math.max(objA.bounciness, objB.bounciness);
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

        super(objA.position, Math.abs(impulseMagnitude), 1, () => 1);

        const impulseFraction = 0.8;
        objA.velocity.x += (impulse.x / objA.mass) * impulseFraction;
        objA.velocity.y += (impulse.y / objA.mass) * impulseFraction;
        objA.velocity.z += (impulse.z / objA.mass) * impulseFraction;
        objB.velocity.x -= (impulse.x / objB.mass) * impulseFraction;
        objB.velocity.y -= (impulse.y / objB.mass) * impulseFraction;
        objB.velocity.z -= (impulse.z / objB.mass) * impulseFraction;
    }
}

export class ExplosionForce extends ImpulseForce {
    constructor(position: { x: number; y: number; z: number }, forceMagnitude: number, radius: number) {
        super(position, forceMagnitude, radius, (d, r) => Math.exp(-d / r)); // Exponential decay for realism
    }
}



export class CursorImpulseForce extends ImpulseForce {
    private previousCursorPosition: { x: number; y: number; z: number };
    private cursorVelocity: { x: number; y: number; z: number };
    isPickingUp: boolean; // State variable for picking up action


    constructor(
        position: { x: number; y: number; z: number },
        forceMagnitude: number,
        radius: number
    ) {
        super(position, forceMagnitude, radius, (d, r) => Math.exp(-d / r)); // Default: exponential decay
        this.previousCursorPosition = { x: 0, y: 0, z: 0 };
        this.cursorVelocity = { x: 0, y: 0, z: 0 };
        this.isPickingUp = false; // Initially not picking up

    }

    // Update the cursor's position and calculate the velocity
    updateCursorPosition(newPosition: { x: number; y: number; z: number }) {
        // Calculate velocity based on the difference from the previous position
        const deltaX = newPosition.x - this.previousCursorPosition.x;
        const deltaY = newPosition.y - this.previousCursorPosition.y;
        const deltaZ = newPosition.z - this.previousCursorPosition.z;

        this.cursorVelocity = {
            x: deltaX,
            y: deltaY,
            z: deltaZ,
        };

        // Update the previous position to the current one for the next frame
        this.previousCursorPosition = newPosition;
    }

    // Method to toggle picking up state
    setPickingUp(isPickingUp: boolean) {
        this.isPickingUp = isPickingUp;
    }




    // Apply impulse based on the cursor's movement or pick-up state
    applyImpulse(body: RigidBody) {
        const dx = body.position.x - this.position.x;
        const dy = body.position.y - this.position.y;
        const dz = body.position.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Decay the effect based on distance
        const falloff = this.decayFunction(distance, this.radius);

        if (falloff > 0.01) { // Threshold so far objects feel weak force but not zero
            // Direction towards the cursor
            const direction = {
                x: dx / Math.max(distance, 0.01),
                y: dy / Math.max(distance, 0.01),
                z: dz / Math.max(distance, 0.01),
            };

            if (this.isPickingUp) {
                // If picking up, apply a force towards the cursor (lift or drag effect)
                const impulseMagnitude = this.forceMagnitude * falloff * (1 / (body.mass + 1));
                body.velocity.x += this.cursorVelocity.x * impulseMagnitude * direction.x;
                body.velocity.y += this.cursorVelocity.y * impulseMagnitude * direction.y;
                body.velocity.z += this.cursorVelocity.z * impulseMagnitude * direction.z;
            } else {
                // Normal impulse effect when not picking up
                const impulseMagnitude = this.forceMagnitude * falloff * (1 / (body.mass + 1));
                body.velocity.x += direction.x * impulseMagnitude;
                body.velocity.y += Math.max(direction.y * impulseMagnitude, 5); // Ensure upward motion
                body.velocity.z += direction.z * impulseMagnitude;
            }
        }
    }


}