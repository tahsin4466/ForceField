import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';
import { Bomb } from './Bomb';

export class TestWorld {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: FirstPersonControls;
    clock: THREE.Clock;
    physicsWorld: PhysicsWorld;
    cubes: { mesh: THREE.Mesh, body: RigidBody }[] = [];
    bombs: Bomb[] = []; // Now using Bomb objects

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.physicsWorld = new PhysicsWorld();

        // Floor (Static - No RigidBody)
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.scene.background = new THREE.Color(0x87CEEB);

        this.addTestObjects();

        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        light.castShadow = true;
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        this.controls = new FirstPersonControls(this.camera, this.scene);
        this.clock = new THREE.Clock();

        window.addEventListener("keydown", (event) => {
            const playerPosition = this.controls.getPosition();
            if (event.code === "KeyB") {
                const isBig = event.shiftKey;
                this.placeBomb(playerPosition, isBig);
            }
            if (event.code === "KeyE") {
                this.detonateBombs();
            }
        });

        this.animate();
    }

    addTestObjects() {
        const testObjects = [
            {
                name: "Crate",
                color: 0x8B4513, // Brown
                position: { x: -4, y: 5, z: 0 },
                mass: 5,
                friction: 1,
                bounciness: 0.1
            },
            {
                name: "Bouncy Ball",
                color: 0xff0000, // Red
                position: { x: 0, y: 8, z: 0 },
                mass: 1,
                friction: 0.2,
                bounciness: 0.9
            },
            {
                name: "Ice Cube",
                color: 0x00ffff, // Cyan
                position: { x: 4, y: 6, z: 0 },
                mass: 1,
                friction: 0.05,
                bounciness: 0.3
            },
            {
                name: "Metal Block",
                color: 0xaaaaaa, // Gray
                position: { x: -2, y: 7, z: 3 },
                mass: 10,
                friction: 0.6,
                bounciness: 0.0
            }
        ];

        testObjects.forEach(({ name, color, position, mass, friction, bounciness }) => {
            // Create mesh
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.position.set(position.x, position.y, position.z);
            this.scene.add(mesh);

            // Create corresponding physics body
            const body = new RigidBody(mass, { x: 1, y: 1, z: 1 }, friction, bounciness);
            body.position = { ...position };

            this.physicsWorld.addObject(body);
            this.cubes.push({ mesh, body });

            console.log(`Added ${name} at (${position.x}, ${position.y}, ${position.z})`);
        });
    }

    placeBomb(position: THREE.Vector3, big: boolean) {
        console.log(`Placing ${big ? "BIG" : "small"} bomb at (${position.x}, ${position.y}, ${position.z})`);
        const bomb = new Bomb(position, big, this.scene);
        this.bombs.push(bomb);
    }

    detonateBombs() {
        console.log(`Detonating ${this.bombs.length} bomb(s)!`);

        this.bombs.forEach((bomb) => {
            bomb.detonate(this.scene, this.createExplosion.bind(this));
        });

        this.bombs = []; // Clear all bombs
    }

    createExplosion(position: THREE.Vector3, forceMagnitude: number, radius: number, color: number) {
        console.log(`Explosion triggered at (${position.x}, ${position.y}, ${position.z}) with radius ${radius}`);

        const explosionGeometry = new THREE.SphereGeometry(radius * 0.02, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({ color });
        const explosionMarker = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosionMarker.position.copy(position);
        this.scene.add(explosionMarker);

        setTimeout(() => {
            this.scene.remove(explosionMarker);
        }, 50);

        this.cubes.forEach(({ body }) => {
            const dx = body.position.x - position.x;
            const dy = body.position.y - position.y;
            const dz = body.position.z - position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < radius) {
                const direction = {
                    x: dx / distance,
                    y: dy / distance,
                    z: dz / distance,
                };
                const falloff = 1 / Math.max(distance * distance, 1);
                const appliedForce = forceMagnitude * falloff * (1 / body.mass);

                body.applyForce({
                    x: direction.x * appliedForce,
                    y: direction.y * appliedForce,
                    z: direction.z * appliedForce,
                });
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();

        this.controls.update(deltaTime);
        this.physicsWorld.update(deltaTime);

        this.cubes.forEach(({ mesh, body }) => {
            mesh.position.set(body.position.x, body.position.y, body.position.z);
        });

        this.renderer.render(this.scene, this.camera);
    }
}
