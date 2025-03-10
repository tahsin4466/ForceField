import { RigidBody } from "./RigidBody";
import { handleCollisions } from "./Collisions";
import { IForceGenerator, IExternalForceGenerator } from "./ForceGenerator.ts";

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private forceGenerators: IForceGenerator[] = [];
    private externalForces: IExternalForceGenerator[] = [];

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
            if (obj.mass > 0) {
                this.forceGenerators.forEach(force => {
                    force.applyForce(obj, deltaTime);
                });
            }
        });

        // Apply impulse forces
        this.externalForces.forEach(force => {
            this.objects.forEach(obj => {
                if (obj.mass > 0) {
                    force.applyImpulse(obj);
                }
            });
        });
        this.externalForces = [];

        // Resolve collisions
        handleCollisions(this.objects);

        // Update object positions and rotations
        this.objects.forEach(obj => {
            if (obj.mass > 0) {
                obj.update(deltaTime);
                obj.updateRotation(deltaTime);
            }
        });
    }
}