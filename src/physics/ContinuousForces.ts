import {RigidBody} from "./RigidBody.ts";
import {IForceGenerator} from "./ForceGenerator.ts";
import * as THREE from "three";

export class GravityForce implements IForceGenerator {
    private gravity: number;
    constructor(gravity: number) {
        this.gravity = gravity;
    }
    applyForce(body: RigidBody) {
        if (body.mass <= 0 || body.position.y <= body.size.y / 2) return;
        body.applyForce({ x: 0, y: this.gravity * body.mass, z: 0 });
    }
}

export class FrictionForce implements IForceGenerator {
    private staticFriction: number;
    private kineticFriction: number;

    constructor(staticFriction: number, kineticFriction: number) { // Set default friction values
        this.staticFriction = staticFriction;
        this.kineticFriction = kineticFriction;
    }

    applyForce(body: RigidBody, deltaTime: number) {
        if (body.position.y <= body.size.y / 2) {
            const velocityMagnitude = Math.sqrt(body.velocity.x ** 2 + body.velocity.z ** 2);
            const bodyStaticFriction = body.staticFriction || this.staticFriction;
            const bodyKineticFriction = body.kineticFriction || this.kineticFriction;
            if (velocityMagnitude < bodyStaticFriction * 3) {
                body.velocity.x = 0;
                body.velocity.z = 0;
            } else {
                const frictionStrength = bodyKineticFriction * 6 * body.mass * deltaTime;
                const frictionX = (body.velocity.x / velocityMagnitude) * frictionStrength;
                const frictionZ = (body.velocity.z / velocityMagnitude) * frictionStrength;
                body.velocity.x -= frictionX;
                body.velocity.z -= frictionZ;

                //Prevent overshooting
                if (Math.abs(body.velocity.x) < 0.02) body.velocity.x = 0;
                if (Math.abs(body.velocity.z) < 0.02) body.velocity.z = 0;
            }
        }
    }
}

export class WindForce implements IForceGenerator {
    private density: number;
    private windVelocity: {x: number; y: number, z: number };
    constructor(density: number, windVelocity: {x: number; y: number, z: number}) {
        this.density = Math.abs(density);
        this.windVelocity = windVelocity;
    }
    applyForce(body: RigidBody) {
        if (this.density === 0) return;
        let area = getCrossSectionArea(body);
        const force = {
            x: -0.5 * this.density * Math.pow(this.windVelocity.x, 2) * body.drag * area,
            y: -0.5 * this.density * Math.pow(this.windVelocity.y, 2) * body.drag * area,
            z: -0.5 * this.density * Math.pow(this.windVelocity.z, 2) * body.drag * area
        }
        body.applyForce(force);
    }
}

export class DragForce implements IForceGenerator {
    private density: number;
    constructor(density: number) {
        this.density = Math.abs(density);
    }
    applyForce(body: RigidBody) {
        if (this.density === 0) return;
        let area = getCrossSectionArea(body);
        const force = {
            x: -0.5 * this.density * Math.pow(body.velocity.x, 2) * body.drag * area * Math.sign(body.velocity.x),
            y: -0.5 * this.density * Math.pow(body.velocity.y, 2) * body.drag * area * Math.sign(body.velocity.y),
            z: -0.5 * this.density * Math.pow(body.velocity.z, 2) * body.drag * area * Math.sign(body.velocity.z),
        }
        body.applyForce(force);
    }
}

function getCrossSectionArea(body: RigidBody) {
    //Convert to Three vectors
    const pos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
    const vel = new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z).normalize();
    const halfSize = new THREE.Vector3(body.size.x / 2, body.size.y / 2, body.size.z / 2);

    // Convert rotation to Matrix4
    const euler = new THREE.Euler(body.rotation.pitch, body.rotation.yaw, body.rotation.roll, "XYZ");
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(euler);

    // Get 8 vertices in local space
    const localVertices = [
        new THREE.Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
        new THREE.Vector3(-halfSize.x, -halfSize.y,  halfSize.z),
        new THREE.Vector3(-halfSize.x,  halfSize.y, -halfSize.z),
        new THREE.Vector3(-halfSize.x,  halfSize.y,  halfSize.z),
        new THREE.Vector3( halfSize.x, -halfSize.y, -halfSize.z),
        new THREE.Vector3( halfSize.x, -halfSize.y,  halfSize.z),
        new THREE.Vector3( halfSize.x,  halfSize.y, -halfSize.z),
        new THREE.Vector3( halfSize.x,  halfSize.y,  halfSize.z),
    ];

    // World space transofmration
    const worldVertices = localVertices.map(vertex => {
        return vertex.clone().applyMatrix4(rotationMatrix).add(pos);
    });

    //2D perpendicular projection to plane
    const planeNormal = vel.clone();
    const basisX = new THREE.Vector3();
    const basisY = new THREE.Vector3();
    planeNormal.normalize();

    //Orthonormal basis
    if (Math.abs(planeNormal.x) > Math.abs(planeNormal.z)) {
        basisX.set(-planeNormal.y, planeNormal.x, 0);
    } else {
        basisX.set(0, -planeNormal.z, planeNormal.y);
    }
    basisX.normalize();
    basisY.crossVectors(planeNormal, basisX);

    //Project vertices onto the 2D plane
    const projectedPoints: THREE.Vector2[] = worldVertices.map(vertex => {
        return new THREE.Vector2(vertex.dot(basisX), vertex.dot(basisY));
    });

    //Compute area of points
    return computeConvexArea(projectedPoints);
}

function computeConvexArea(points: THREE.Vector2[]): number {
    if (points.length < 3) return 0;
    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    const hull: THREE.Vector2[] = [];
    const cross = (o: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) =>
        (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    for (let i = 0; i < points.length; i++) {
        while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) {
            hull.pop();
        }
        hull.push(points[i]);
    }
    const lowerSize = hull.length;
    for (let i = points.length - 2; i >= 0; i--) {
        while (hull.length > lowerSize && cross(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) {
            hull.pop();
        }
        hull.push(points[i]);
    }
    hull.pop();
    let area = 0;
    for (let i = 0; i < hull.length; i++) {
        const j = (i + 1) % hull.length;
        area += hull[i].x * hull[j].y - hull[j].x * hull[i].y;
    }
    return Math.abs(area) / 2;
}