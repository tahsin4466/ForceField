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
    // Walls (To keep objects inside)
    {
        name: "Left Wall",
        color: 0xaaaaaa,
        position: { x: -10, y: 5, z: 0 },
        mass: -1, // Static object
        size: { x: 1, y: 10, z: 20 },
        staticFriction: 0.9,
        kineticFriction: 0.8,
        bounciness: 0.0,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },
    {
        name: "Right Wall",
        color: 0xaaaaaa,
        position: { x: 10, y: 5, z: 0 },
        mass: -1, // Static object
        size: { x: 1, y: 10, z: 20 },
        staticFriction: 0.9,
        kineticFriction: 0.8,
        bounciness: 0.0,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },
    {
        name: "Back Wall",
        color: 0xaaaaaa,
        position: { x: 0, y: 5, z: -10 },
        mass: -1, // Static object
        size: { x: 20, y: 10, z: 1 },
        staticFriction: 0.9,
        kineticFriction: 0.8,
        bounciness: 0.0,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },

    // Ramps for launching objects
    {
        name: "Ramp",
        color: 0x8b4513,
        position: { x: -5, y: 1, z: 5 },
        mass: -1, // Static
        size: { x: 3, y: 0.5, z: 6 },
        staticFriction: 0.5,
        kineticFriction: 0.3,
        bounciness: 0.1,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },

    // Bouncy Ball Pit
    {
        name: "Bouncy Ball 1",
        color: 0xff0000,
        position: { x: 0, y: 5, z: 2 },
        mass: 0.5,
        size: { x: 0.3, y: 0.3, z: 0.3 },
        staticFriction: 0.2,
        kineticFriction: 0.1,
        bounciness: 0.9, // Super bouncy
        inertia: { xx: 5, yy: 5, zz: 5 },
    },
    {
        name: "Bouncy Ball 2",
        color: 0x00ff00,
        position: { x: 1, y: 5, z: 2 },
        mass: 0.5,
        size: { x: 0.3, y: 0.3, z: 0.3 },
        staticFriction: 0.2,
        kineticFriction: 0.1,
        bounciness: 0.9,
        inertia: { xx: 5, yy: 5, zz: 5 },
    },
    {
        name: "Bouncy Ball 3",
        color: 0x0000ff,
        position: { x: -1, y: 5, z: 2 },
        mass: 0.5,
        size: { x: 0.3, y: 0.3, z: 0.3 },
        staticFriction: 0.2,
        kineticFriction: 0.1,
        bounciness: 0.9,
        inertia: { xx: 5, yy: 5, zz: 5 },
    },

    // Heavy Metal Blocks
    {
        name: "Heavy Metal Block",
        color: 0x555555,
        position: { x: 2, y: 4, z: -2 },
        mass: 10,
        size: { x: 1, y: 1, z: 1 },
        staticFriction: 0.8,
        kineticFriction: 0.6,
        bounciness: 0.1,
        inertia: { xx: 0.2, yy: 0.2, zz: 0.2 },
    },
    {
        name: "Light Wooden Crate",
        color: 0xc8a165,
        position: { x: -2, y: 6, z: 2 },
        mass: 1.5,
        size: { x: 0.5, y: 0.5, z: 0.5 },
        staticFriction: 0.5,
        kineticFriction: 0.4,
        bounciness: 0.3,
        inertia: { xx: 0.5, yy: 0.5, zz: 0.5 },
    },

    // Seesaw
    {
        name: "Seesaw Plank",
        color: 0xa0522d,
        position: { x: 0, y: 1, z: -3 },
        mass: 4,
        size: { x: 5, y: 0.2, z: 1 },
        staticFriction: 0.6,
        kineticFriction: 0.4,
        bounciness: 0.2,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },
    {
        name: "Seesaw Pivot",
        color: 0x8b0000,
        position: { x: 0, y: 0.5, z: -3 },
        mass: -1, // Static
        size: { x: 0.5, y: 0.5, z: 0.5 },
        staticFriction: 0.9,
        kineticFriction: 0.8,
        bounciness: 0.0,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },

    // Rolling Cylinder
    {
        name: "Rolling Cylinder",
        color: 0x4b0082,
        position: { x: 5, y: 2, z: 3 },
        mass: 3,
        size: { x: 1, y: 2, z: 1 },
        staticFriction: 0.2,
        kineticFriction: 0.1,
        bounciness: 0.3,
        inertia: { xx: 2, yy: 2, zz: 2 },
    },

    // Ice Patch (Super Slippery Zone)
    {
        name: "Ice Patch",
        color: 0x00ffff,
        position: { x: 0, y: 0.01, z: 5 },
        mass: -1, // Static
        size: { x: 5, y: 0.1, z: 5 },
        staticFriction: 0.01, // Almost no friction
        kineticFriction: 0.01,
        bounciness: 0.1,
        inertia: { xx: 1, yy: 1, zz: 1 },
    },

    // Dominos (for fun chain reactions)
    {
        name: "Domino 1",
        color: 0x1e90ff,
        position: { x: -3, y: 2, z: -4 },
        mass: 1,
        size: { x: 0.2, y: 1, z: 0.5 },
        staticFriction: 0.5,
        kineticFriction: 0.3,
        bounciness: 0.1,
        inertia: { xx: 0.1, yy: 0.1, zz: 0.1 },
    },
    {
        name: "Domino 2",
        color: 0xff8c00,
        position: { x: -3.5, y: 2, z: -4 },
        mass: 1,
        size: { x: 0.2, y: 1, z: 0.5 },
        staticFriction: 0.5,
        kineticFriction: 0.3,
        bounciness: 0.1,
        inertia: { xx: 0.1, yy: 0.1, zz: 0.1 },
    },
];

// Function to create world objects in the scene and physics world
export function addWorldObjects(
    scene: THREE.Scene,
    physicsWorld: PhysicsWorld,
    objects: { mesh: THREE.Mesh; body: RigidBody }[]
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
        objects.push({ mesh, body });
    });
}
