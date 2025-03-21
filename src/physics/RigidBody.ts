export class RigidBody {
    position: { x: number, y: number, z: number };
    rotation: { pitch: number, yaw: number, roll: number };
    velocity: { x: number, y: number, z: number };
    angularVelocity: { x: number, y: number, z: number };
    acceleration: { x: number, y: number, z: number };
    angularAcceleration: { x: number, y: number, z: number };
    mass: number;
    size: { x: number, y: number, z: number };
    staticFriction: number;
    kineticFriction: number;
    drag: number;
    bounciness: number;
    torque: { x: number, y: number, z: number };
    inertia: { xx: number, yy: number, zz: number };


    constructor(mass = 1, size = { x: 0.5, y: 0.5, z: 0.5 }, staticFriction = 0.3, kineticFriction = 0.2, bounciness = 0.0, inertia = { xx: 1, yy: 1, zz: 1 }, drag=1.05) {
        this.mass = mass;
        this.position = { x: 0, y: 0, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.size = size;
        this.staticFriction = staticFriction;
        this.kineticFriction = kineticFriction;
        this.bounciness = bounciness;
        this.angularVelocity = { x: 0, y: 0, z: 0 };
        this.angularAcceleration = { x: 0, y: 0, z: 0 };
        this.inertia = inertia;
        this.torque = { x: 0, y: 0, z: 0 };
        this.rotation = { pitch: 0, yaw: 0, roll: 0 };
        this.drag = drag;
    }

    //Min max for bounding boxes
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

    //Center and point force applicaiton
    applyForce(force: { x: number, y: number, z: number }) {
        this.acceleration.x += force.x / this.mass;
        this.acceleration.y += force.y / this.mass;
        this.acceleration.z += force.z / this.mass;
    }
    applyForceAtPoint(force: { x: number, y: number, z: number }, point: { x: number, y: number, z: number }) {
        // Get lever arm from COM
        const r = {
            x: point.x - this.position.x,
            y: point.y - this.position.y,
            z: point.z - this.position.z
        };
        //rxF torque calc
        const torque = {
            x: r.y * force.z - r.z * force.y * (0.25/this.drag),
            y: r.z * force.x - r.x * force.z * (0.25/this.drag),
            z: r.x * force.y - r.y * force.x * (0.25/this.drag)
        };
        this.torque.x += torque.x;
        this.torque.y += torque.y;
        this.torque.z += torque.z;

        //Also apply the linear force
        this.applyForce(force);
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

    clearForce() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.velocity.z = 0;
    }

    updateRotation(deltaTime: number) {
        const dampingFactor = 0.98;
        this.angularAcceleration.x = this.torque.x / this.mass;
        this.angularAcceleration.y = this.torque.y / this.mass;
        this.angularAcceleration.z = this.torque.z / this.mass;
        this.angularVelocity.x += this.angularAcceleration.x * deltaTime;
        this.angularVelocity.y += this.angularAcceleration.y * deltaTime;
        this.angularVelocity.z += this.angularAcceleration.z * deltaTime;

        // Apply damping
        this.angularVelocity.x *= dampingFactor;
        this.angularVelocity.y *= dampingFactor;
        this.angularVelocity.z *= dampingFactor;

        // Update Euler angles
        this.rotation.pitch += this.angularVelocity.x * deltaTime * 57.2958;
        this.rotation.yaw += this.angularVelocity.y * deltaTime * 57.2958;
        this.rotation.roll += this.angularVelocity.z * deltaTime * 57.2958;

        // If the object is at rest snap rotation to the nearest axis
        const angularSpeed = Math.sqrt(
            this.angularVelocity.x ** 2 +
            this.angularVelocity.y ** 2 +
            this.angularVelocity.z ** 2
        );
        if (angularSpeed < 0.001) {
            //Fully stop any residual angular velocity
            this.angularVelocity = { x: 0, y: 0, z: 0 };
            this.angularAcceleration = { x: 0, y: 0, z: 0 };
            this.torque = { x: 0, y: 0, z: 0 };
        }
        this.torque = { x: 0, y: 0, z: 0 };
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
