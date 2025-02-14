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

            // ✅ Floor Collision: Stop objects from falling below ground
            if (obj.position.y < this.groundLevel) {
                obj.position.y = this.groundLevel;
                obj.velocity.y = 0; // Stop downward movement
            }
        });

        // ✅ Object-to-Object Collision Handling (Basic AABB)
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                if (this.objects[i].isColliding(this.objects[j])) {
                    this.resolveCollision(this.objects[i], this.objects[j]);
                }
            }
        }
    }

    // ✅ Basic Collision Resolution (Push Objects Apart)
    private resolveCollision(objA: RigidBody, objB: RigidBody) {
        const pushAmount = 0.05; // Small separation value

        if (objA.position.y > objB.position.y) {
            objA.position.y += pushAmount;
            objB.position.y -= pushAmount;
        } else {
            objA.position.y -= pushAmount;
            objB.position.y += pushAmount;
        }

        // Optional: Zero out velocity upon collision
        objA.velocity.y = 0;
        objB.velocity.y = 0;
    }
}
