import { RigidBody } from './RigidBody';
import { applyGravity } from './Forces';
import { handleCollisions } from './Collisions';

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private gravity: number = -9.81; // Gravity constant

    addObject(object: RigidBody) {
        this.objects.push(object);
    }

    update(deltaTime: number) {
        // Apply forces (gravity, etc.)
        this.objects.forEach(obj => applyGravity(obj, this.gravity));

        // Update object motion
        this.objects.forEach(obj => obj.update(deltaTime));

        // Handle collisions separately
        handleCollisions(this.objects);
    }
}
