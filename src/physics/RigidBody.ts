export class RigidBody {
    position: { x: number, y: number, z: number };
    velocity: { x: number, y: number, z: number };
    acceleration: { x: number, y: number, z: number };
    mass: number;

    constructor(mass = 1) {
        this.mass = mass;
        this.position = { x: 0, y: 0, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
    }

    applyForce(force: { x: number, y: number, z: number }) {
        this.acceleration.x += force.x / this.mass;
        this.acceleration.y += force.y / this.mass;
        this.acceleration.z += force.z / this.mass;
    }

    update(deltaTime: number) {
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.velocity.z += this.acceleration.z * deltaTime;

        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // Reset acceleration
        this.acceleration = { x: 0, y: 0, z: 0 };
    }
}
