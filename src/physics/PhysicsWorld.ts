import { RigidBody } from './RigidBody';

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private gravity: number = -9.81; // Earth gravity (m/s²)

    addObject(object: RigidBody) {
        this.objects.push(object);
    }

    update(deltaTime: number) {
        this.objects.forEach(obj => {
            obj.applyForce({ x: 0, y: this.gravity * obj.mass, z: 0 }); // Apply gravity
            obj.update(deltaTime);
        });
    }
}
