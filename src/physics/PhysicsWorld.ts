import { RigidBody } from "./RigidBody";
import { handleCollisions } from "./Collisions";
import { IForceGenerator, IExternalForceGenerator } from "./ForceGenerator.ts";
import { CollisionImpulse } from "./ImpulseForces.ts";

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private forceGenerators: IForceGenerator[] = [];
    private externalForces: IExternalForceGenerator[] = [];
    private collisionImpulses: CollisionImpulse[] = [];

    addObject(object: RigidBody) {
        this.objects.push(object);
    }

    addForceGenerator(forceGenerator: IForceGenerator) {
        this.forceGenerators.push(forceGenerator);
    }

    addExternalForce(force: IExternalForceGenerator) {
        this.externalForces.push(force);
    }

    update(deltaTime: number) {
        // Apply continuous forces (gravity, friction, etc.)
        this.objects.forEach(obj => {
            this.forceGenerators.forEach(force => {
                force.applyForce(obj, deltaTime);
            });
        });

        // Apply impulse forces
        this.externalForces.forEach(force => {
            this.objects.forEach(obj => {
                force.applyImpulse(obj);
            });
        });
        this.externalForces = [];

        // Resolve collisions
        handleCollisions(this.objects, this.collisionImpulses);
        this.collisionImpulses = [];

        // Update object positions and rotations
        this.objects.forEach(obj => {
            obj.update(deltaTime);
            obj.updateRotation(deltaTime);
        });
    }
}