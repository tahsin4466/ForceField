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
    drag: number;
}

// Array of world objects
const earthObjects: WorldObject[] = [
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.28
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
        drag: 1.07
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
        drag: 1.07
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
        drag: 1.28
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
        drag: 1.28
    },
    {
        name: "Paper Sheet",
        color: 0xffffff,
        position: {x: 5, y: 1, z: -3},
        mass: 0.1,
        size: { x: 2, y: 0.1, z: 1.2 },
        staticFriction: 0.7,
        kineticFriction: 0.5,
        bounciness: 0.01,
        inertia: {xx: 1, yy: 0.1, zz: 0.2},
        drag: 1.28
    }
];


const moonObjects: WorldObject[] = [
    // 🌑 Moon Rocks (Varied sizes, high density, low bounciness)
    {
        name: "Small Moon Rock",
        color: 0x777777, // Gray
        position: { x: -3, y: 1, z: 2 },
        mass: 5, // Dense rock
        size: { x: 0.5, y: 0.5, z: 0.5 },
        staticFriction: 0.9,
        kineticFriction: 0.8,
        bounciness: 0.1, // Almost no bounce
        inertia: { xx: 2, yy: 2, zz: 2 },
        drag: 0.9
    },
    {
        name: "Medium Moon Rock",
        color: 0x666666, // Dark Gray
        position: { x: 5, y: 1, z: -4 },
        mass: 12,
        size: { x: 1.2, y: 1, z: 1.3 },
        staticFriction: 0.95,
        kineticFriction: 0.85,
        bounciness: 0.05, // No real bounce
        inertia: { xx: 4, yy: 4, zz: 4 },
        drag: 0.95
    },
    {
        name: "Large Moon Boulder",
        color: 0x555555, // Darker rock
        position: { x: -8, y: 2, z: 5 },
        mass: 30,
        size: { x: 3, y: 2.5, z: 3 },
        staticFriction: 0.98,
        kineticFriction: 0.9,
        bounciness: 0.02, // Heavy, barely bounces
        inertia: { xx: 10, yy: 10, zz: 10 },
        drag: 1.1
    },
    {
        name: "Flat Moon Slab",
        color: 0x444444, // Almost black rock
        position: { x: 2, y: 0.5, z: 6 },
        mass: 15,
        size: { x: 2, y: 0.3, z: 1.5 },
        staticFriction: 0.92,
        kineticFriction: 0.8,
        bounciness: 0.03,
        inertia: { xx: 5, yy: 5, zz: 5 },
        drag: 1.05
    },

    // 🧀 Moon Cheese (Light, soft, higher bounce)
    {
        name: "Small Moon Cheese Block",
        color: 0xffee88, // Yellowish
        position: { x: -4, y: 2, z: -2 },
        mass: 0.8, // Low density
        size: { x: 0.6, y: 0.6, z: 0.6 },
        staticFriction: 0.4,
        kineticFriction: 0.3,
        bounciness: 0.9, // Very bouncy
        inertia: { xx: 0.5, yy: 0.5, zz: 0.5 },
        drag: 1.2
    },
    {
        name: "Moon Cheese Wedge",
        color: 0xffdd66, // Slightly darker yellow
        position: { x: 6, y: 2, z: -6 },
        mass: 1.2,
        size: { x: 1, y: 0.5, z: 1.2 },
        staticFriction: 0.45,
        kineticFriction: 0.35,
        bounciness: 0.85, // Still very bouncy
        inertia: { xx: 0.8, yy: 0.8, zz: 0.8 },
        drag: 1.15
    },
    {
        name: "Massive Moon Cheese Block",
        color: 0xffcc44, // Darker golden cheese
        position: { x: -8, y: 3, z: 3 },
        mass: 3,
        size: { x: 2, y: 1, z: 2 },
        staticFriction: 0.5,
        kineticFriction: 0.4,
        bounciness: 0.7, // Bounces a lot but heavy
        inertia: { xx: 2, yy: 2, zz: 2 },
        drag: 1.1
    },
    {
        name: "Crumbly Moon Cheese Fragment",
        color: 0xffaa33, // Orange tint
        position: { x: 3, y: 1, z: 7 },
        mass: 0.5, // Very light
        size: { x: 0.4, y: 0.3, z: 0.4 },
        staticFriction: 0.3,
        kineticFriction: 0.2,
        bounciness: 0.95, // Highest bounce
        inertia: { xx: 0.2, yy: 0.2, zz: 0.2 },
        drag: 1.3
    }
];

let spaceObjects: WorldObject[] = [];

function getRandom(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

// Generate 250+ small asteroid cubes (very close together)
for (let i = 0; i < 250; i++) {
    spaceObjects.push({
        name: "Small Asteroid Cube",
        color: 0x888888, // Gray rock-like color
        position: {
            x: getRandom(-15, 15),  // Super tight clustering
            y: getRandom(-15, 15),
            z: getRandom(-15, 15)
        },
        mass: getRandom(0.5, 2), // Small but varied mass
        size: {
            x: getRandom(0.2, 0.6), // Smaller for better explosion effect
            y: getRandom(0.2, 0.6),
            z: getRandom(0.2, 0.6)
        },
        staticFriction: getRandom(0.2, 0.5),
        kineticFriction: getRandom(0.1, 0.4),
        bounciness: getRandom(0.6, 1.2), // Very bouncy for chain reactions
        inertia: {
            xx: getRandom(0.2, 1.5),
            yy: getRandom(0.2, 1.5),
            zz: getRandom(0.2, 1.5)
        },
        drag: getRandom(0.05, 0.15) // Less drag, so they move a lot
    });
}

// Generate 100 medium-sized asteroid cubes (still tightly packed)
for (let i = 0; i < 100; i++) {
    spaceObjects.push({
        name: "Medium Asteroid Cube",
        color: 0x666666, // Darker rocks
        position: {
            x: getRandom(-18, 18),  // Slightly larger range
            y: getRandom(-18, 18),
            z: getRandom(-18, 18)
        },
        mass: getRandom(3, 7), // Medium weight asteroids
        size: {
            x: getRandom(0.6, 1.2), // Medium asteroids
            y: getRandom(0.6, 1.2),
            z: getRandom(0.6, 1.2)
        },
        staticFriction: getRandom(0.3, 0.6),
        kineticFriction: getRandom(0.2, 0.5),
        bounciness: getRandom(0.4, 1.0), // Some will bounce, some won’t
        inertia: {
            xx: getRandom(1, 3),
            yy: getRandom(1, 3),
            zz: getRandom(1, 3)
        },
        drag: getRandom(0.1, 0.25) // Slight movement resistance
    });
}

// Generate 50 large, heavier asteroid cubes (close, but bigger gaps)
for (let i = 0; i < 50; i++) {
    spaceObjects.push({
        name: "Large Asteroid Cube",
        color: 0x444444, // Darkest rocks
        position: {
            x: getRandom(-20, 20),  // Slightly more spread
            y: getRandom(-20, 20),
            z: getRandom(-20, 20)
        },
        mass: getRandom(7, 15), // Heaviest asteroids
        size: {
            x: getRandom(1.2, 2.5), // Large chunks
            y: getRandom(1.2, 2.5),
            z: getRandom(1.2, 2.5)
        },
        staticFriction: getRandom(0.4, 0.7),
        kineticFriction: getRandom(0.3, 0.6),
        bounciness: getRandom(0.2, 0.7), // Some will bounce, others will just crash
        inertia: {
            xx: getRandom(2, 5),
            yy: getRandom(2, 5),
            zz: getRandom(2, 5)
        },
        drag: getRandom(0.15, 0.3) // Slight resistance, but still free-moving
    });
}


// Function to create world objects in the scene and physics world
export function addWorldObjects(
    id: number,
    scene: THREE.Scene,
    physicsWorld: PhysicsWorld,
    objects: { mesh: THREE.Mesh; body: RigidBody }[]
) {
    let objectBlueprint: WorldObject[];
    switch (id) {
        case 4:
            objectBlueprint = moonObjects;
            break;
        case 5:
            objectBlueprint = spaceObjects;
            break;
        default:
            objectBlueprint = earthObjects;
    }
    objectBlueprint.forEach(({ color, size, position, mass, staticFriction, kineticFriction, bounciness, inertia, drag }) => {
        // Create mesh
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.position.set(position.x, position.y, position.z);
        scene.add(mesh);

        // Create physics body
        const body = new RigidBody(mass, size, staticFriction, kineticFriction, bounciness, inertia, drag);
        body.position = { ...position };

        physicsWorld.addObject(body);
        objects.push({ mesh, body });
    });
}