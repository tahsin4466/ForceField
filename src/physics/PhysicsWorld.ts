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

            // Floor Collision Handling
            if (obj.min.y < this.groundLevel) {
                obj.position.y = this.groundLevel + obj.size.y / 2;
                // Stop downward movement if the object is at rest
                if (Math.abs(obj.velocity.y) < 0.1) {
                    obj.velocity.y = 0;
                } else {
                    obj.velocity.y *= -obj.bounciness;
                }
                // Apply friction smoothly
                this.applyFriction(obj, this.groundFriction);
            }

        });

        // Handle object collisions (refactored into Collisions.ts)
        handleCollisions(this.objects);
    }

    private applyFriction(obj: RigidBody, groundFriction: number) {
        // Smooth friction application to avoid abrupt stops
        const frictionFactor = Math.max(0, 1 - groundFriction * 0.1);
        obj.velocity.x *= frictionFactor;
        obj.velocity.z *= frictionFactor;

        // Stop objects completely if they move too slowly
        if (Math.abs(obj.velocity.x) < 0.01) obj.velocity.x = 0;
        if (Math.abs(obj.velocity.z) < 0.01) obj.velocity.z = 0;
    }
}