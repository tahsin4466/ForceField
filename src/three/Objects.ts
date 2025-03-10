import * as THREE from "three";
import { RigidBody } from "../physics/RigidBody";
import { PhysicsWorld } from "../physics/PhysicsWorld";

// Define an interface for world objects
export interface WorldObject {
    name: string;
    color: number;
    position: { x: number; y: number; z: number };
    mass: number;
    size: { x: number; y: number; z: number };
    staticFriction: number;
    kineticFriction: number;
    bounciness: number;
    inertia: { xx: number; yy: number; zz: number };
}

// Array of world objects
export const worldObjects: WorldObject[] = [
    {
        name: "Crate",
        color: 0x8B4513,
        position: { x: -2, y: 9, z: 2 },
        mass: 2,
        size: { x: 0.5, y: 0.5, z: 0.5 },
        staticFriction: 0.6,
        kineticFriction: 0.4,
        bounciness: 0.1,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },
    {
        name: "Bouncy Ball",
        color: 0xff0000,
        position: { x: 0, y: 8, z: 2 },
        mass: 0.6,
        size: { x: 0.24, y: 0.24, z: 0.24 },
        staticFriction: 0.2,
        kineticFriction: 0.1,
        bounciness: 0.7,
        inertia: { xx: 5, yy: 5, zz: 5 },
    },
    {
        name: "Ice Cube",
        color: 0x00ffff,
        position: { x: 4, y: 6, z: 2 },
        mass: 0.2,
        size: { x: 0.05, y: 0.05, z: 0.05 },
        staticFriction: 0.05,
        kineticFriction: 0.02,
        bounciness: 0.3,
        inertia: { xx: 0.5, yy: 0.5, zz: 0.5 },
    },
    {
        name: "Metal Block",
        color: 0xaaaaaa,
        position: { x: -2, y: 7, z: 0 },
        mass: 5,
        size: { x: 1, y: 1, z: 1 },
        staticFriction: 0.7,
        kineticFriction: 0.5,
        bounciness: 0.0,
        inertia: { xx: 0.1, yy: 0.1, zz: 0.1 },
    }
];

// Function to create world objects in the scene and physics world
export function addWorldObjects(
    scene: THREE.Scene,
    physicsWorld: PhysicsWorld,
    cubes: { mesh: THREE.Mesh; body: RigidBody }[]
) {
    worldObjects.forEach(({ color, size, position, mass, staticFriction, kineticFriction, bounciness, inertia }) => {
        // Create mesh
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.position.set(position.x, position.y, position.z);
        scene.add(mesh);

        // Create physics body
        const body = new RigidBody(mass, size, staticFriction, kineticFriction, bounciness, inertia);
        body.position = { ...position };

        physicsWorld.addObject(body);
        cubes.push({ mesh, body });
    });
}
