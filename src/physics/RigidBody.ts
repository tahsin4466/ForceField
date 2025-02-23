export class RigidBody {
    position: { x: number, y: number, z: number };
    velocity: { x: number, y: number, z: number };
    acceleration: { x: number, y: number, z: number };
    mass: number;
    size: { x: number, y: number, z: number };
    staticFriction: number;  // ✅ Added Static Friction
    kineticFriction: number; // ✅ Added Kinetic Friction
    bounciness: number;

    constructor(mass = 1, size = { x: 0.5, y: 0.5, z: 0.5 }, staticFriction = 0.3, kineticFriction = 0.2, bounciness = 0.0) {
        this.mass = mass;
        this.position = { x: 0, y: 0, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.size = size;
        this.staticFriction = staticFriction;
        this.kineticFriction = kineticFriction;
        this.bounciness = bounciness;
    }

    // Get bounding box (min and max coordinates)
    get min() {
        return {
            x: this.position.x - this.size.x / 2,
            y: this.position.y - this.size.y / 2,
            z: this.position.z - this.size.z / 2,
        };
    }

    get max() {
        return {
            x: this.position.x + this.size.x / 2,
            y: this.position.y + this.size.y / 2,
            z: this.position.z + this.size.z / 2,
        };
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

        this.acceleration = { x: 0, y: 0, z: 0 };
    }

    isColliding(other: RigidBody): boolean {
        return (
            this.min.x < other.max.x &&
            this.max.x > other.min.x &&
            this.min.y < other.max.y &&
            this.max.y > other.min.y &&
            this.min.z < other.max.z &&
            this.max.z > other.min.z
        );
    }
}
