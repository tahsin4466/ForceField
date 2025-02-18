import { RigidBody } from './RigidBody';
import { handleCollisions } from './Collisions';

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private gravity: number = -9.81; // Earth gravity (m/s²)
    private groundLevel: number = 0; // Define ground at y = 0
    private groundFriction: number = 0.3; // Ground frictional coefficient

    addObject(object: RigidBody) {
        this.objects.push(object);
    }

    update(deltaTime: number) {
        this.objects.forEach(obj => {
            // Apply gravity
            obj.applyForce({ x: 0, y: this.gravity * obj.mass, z: 0 });
            obj.update(deltaTime);

            // Floor Collision
            if (obj.min.y < this.groundLevel) {
                obj.position.y = this.groundLevel + obj.size.y / 2;

                // Instead of setting velocity to zero, dampen it gradually
                obj.velocity.y *= -0.2; // Small bounce instead of hard stop

                // Apply friction smoothly
                this.applyFriction(obj, this.groundFriction);
            }
        });

        // Handle object collisions (refactored into Collisions.ts)
        handleCollisions(this.objects);
    }

    private applyFriction(obj: RigidBody, groundFriction: number) {
        // Use smooth friction application to avoid sudden stops
        const frictionFactor = Math.max(0, 1 - groundFriction * 0.1); // Less aggressive per frame
        obj.velocity.x *= frictionFactor;
        obj.velocity.z *= frictionFactor;

        // If velocity is below a threshold, stop completely (avoids infinite sliding)
        if (Math.abs(obj.velocity.x) < 0.01) obj.velocity.x = 0;
        if (Math.abs(obj.velocity.z) < 0.01) obj.velocity.z = 0;
    }
}
