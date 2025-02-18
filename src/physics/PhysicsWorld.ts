import { RigidBody } from './RigidBody';

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private gravity: number = -9.81; // Earth gravity (m/s²)
    private groundLevel: number = 0; // Define ground at y = 0

    addObject(object: RigidBody) {
        this.objects.push(object);
    }

    update(deltaTime: number) {
        this.objects.forEach(obj => {
            // Apply gravity
            obj.applyForce({ x: 0, y: this.gravity * obj.mass, z: 0 });
            obj.update(deltaTime);

            // Floor Collision: Stop objects from falling below ground
            if (obj.min.y < this.groundLevel) {
                obj.position.y = this.groundLevel + obj.size.y / 2; // Place it at correct height
                obj.velocity.y = 0; // Stop downward movement
            }
        });

        // Object-to-Object Collision Handling (Basic AABB)
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                if (this.objects[i].isColliding(this.objects[j])) {
                    this.resolveCollision(this.objects[i], this.objects[j]);
                }
            }
        }
    }

    // Basic Collision Resolution (Push Objects Apart)
    private resolveCollision(objA: RigidBody, objB: RigidBody) {
        // Compute overlap
        const overlapX = Math.min(objA.max.x - objB.min.x, objB.max.x - objA.min.x);
        const overlapY = Math.min(objA.max.y - objB.min.y, objB.max.y - objA.min.y);
        const overlapZ = Math.min(objA.max.z - objB.min.z, objB.max.z - objA.min.z);

        // Find the smallest axis of penetration and separate objects
        if (overlapX < overlapY && overlapX < overlapZ) {
            // X-axis resolution
            const pushAmount = overlapX / 2;
            objA.position.x += pushAmount;
            objB.position.x -= pushAmount;
        } else if (overlapY < overlapZ) {
            // Y-axis resolution
            const pushAmount = overlapY / 2;
            objA.position.y += pushAmount;
            objB.position.y -= pushAmount;
        } else {
            // Z-axis resolution
            const pushAmount = overlapZ / 2;
            objA.position.z += pushAmount;
            objB.position.z -= pushAmount;
        }

        // Optional: Zero out velocity upon collision
        objA.velocity = { x: 0, y: 0, z: 0 };
        objB.velocity = { x: 0, y: 0, z: 0 };
    }

}
