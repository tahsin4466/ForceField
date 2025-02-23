import { RigidBody } from "./RigidBody";
import { handleCollisions } from "./Collisions";
import { IForceGenerator, CollisionForce } from "./Forces";

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private forceGenerators: IForceGenerator[] = [];
    private collisionForces: CollisionForce[] = [];

    addObject(object: RigidBody) {
        this.objects.push(object);
    }

    addForceGenerator(forceGenerator: IForceGenerator) {
        this.forceGenerators.push(forceGenerator);
    }

    update(deltaTime: number) {
        // Apply forces
        this.objects.forEach(obj => {
            this.forceGenerators.forEach(force => {
                force.applyForce(obj, deltaTime);
            });
        });

        // Resolve collisions and generate collision forces
        handleCollisions(this.objects, this.collisionForces);

        // Apply collision forces
        this.collisionForces.forEach(force => {
            force.applyForce(force.getBodyA(), deltaTime);
            force.applyForce(force.getBodyB(), deltaTime);
        });

        // Clear collision forces after application
        this.collisionForces = [];

        // Update positions after force application
        this.objects.forEach(obj => {
            obj.update(deltaTime);
        });
    }
}
