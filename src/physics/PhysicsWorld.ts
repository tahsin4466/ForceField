import { RigidBody } from "./RigidBody";
import { handleCollisions } from "./Collisions";
import { IForceGenerator, IExternalForceGenerator, CollisionForce } from "./ForceGenerator.ts";

export class PhysicsWorld {
    private objects: RigidBody[] = [];
    private forceGenerators: IForceGenerator[] = [];
    private externalForces: IExternalForceGenerator[] = [];
    private collisionForces: CollisionForce[] = [];

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

        this.externalForces.forEach(force => {
            this.objects.forEach(obj => {
                force.applyImpulse(obj);
            });
        });

        this.externalForces = [];

        // Resolve collisions
        handleCollisions(this.objects, this.collisionForces);
        this.collisionForces.forEach(force => {
            if (force instanceof CollisionForce) {
                force.applyForce(force.getBodyA(), deltaTime);
                force.applyForce(force.getBodyB(), deltaTime);
            }
        });

        // Clear collision forces after application
        this.collisionForces = [];

        // Update object positions
        this.objects.forEach(obj => {
            obj.update(deltaTime);
        });
    }
}