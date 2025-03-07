import { RigidBody } from "./RigidBody";

export interface IForceGenerator {
    applyForce(body: RigidBody, deltaTime: number): void;
}

export interface IExternalForceGenerator {
    applyImpulse(body: RigidBody, objects?: RigidBody[], steps?: number): void;
}