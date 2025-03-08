import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';
import { Bomb } from './Bomb';
import { GravityForce, FrictionForce } from '../physics/ContinuousForces';
import { ExplosionForce } from "../physics/ImpulseForces"

export class TestWorld {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: FirstPersonControls;
    clock: THREE.Clock;
    physicsWorld: PhysicsWorld;
    cubes: { mesh: THREE.Mesh, body: RigidBody }[] = [];
    bombs: Bomb[] = [];
    paused: boolean = false; // NEW: Pause state

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.physicsWorld = new PhysicsWorld();

        // Add forces
        this.physicsWorld.addForceGenerator(new GravityForce(-9.8));
        this.physicsWorld.addForceGenerator((new FrictionForce(0.6, 0.4)))

        // Floor (Static)
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
            if (event.code === "Space") {
                this.paused = !this.paused; // NEW: Toggle pause
                console.log(this.paused ? "Simulation Paused" : "Simulation Resumed");
            }
        });

        this.animate();
    }

    addTestObjects() {
        const testObjects = [
            {
                name: "Crate",
                color: 0x8B4513,
                position: { x: -2, y: 7, z: 2 },
                mass: 2,
                size: { x: 0.5, y: 0.5, z: 0.5 },
                staticFriction: 0.6,
                kineticFriction: 0.4,
                bounciness: 0.1
            },
            {
                name: "Crate",
                color: 0x8B4513,
                position: { x: -2, y: 9, z: 2 },
                mass: 2,
                size: { x: 0.5, y: 0.5, z: 0.5 },
                staticFriction: 0.6,
                kineticFriction: 0.4,
                bounciness: 0.1
            },
            {
                name: "Bouncy Ball",
                color: 0xff0000,
                position: { x: 0, y: 8, z: 2 },
                mass: 0.6,
                size: { x: 0.24, y: 0.24, z: 0.24 },
                staticFriction: 0.2,
                kineticFriction: 0.1,
                bounciness: 0.7
            },
            {
                name: "Ice Cube",
                color: 0x00ffff,
                position: { x: 4, y: 6, z: 2 },
                mass: 0.2,
                size: { x: 0.05, y: 0.05, z: 0.05 },
                staticFriction: 0.05,
                kineticFriction: 0.02,
                bounciness: 0.3
            },
            {
                name: "Metal Block",
                color: 0xaaaaaa,
                position: { x: -2, y: 7, z: 0 },
                mass: 5,
                size: { x: 1, y: 1, z: 1 },
                staticFriction: 0.7,
                kineticFriction: 0.5,
                bounciness: 0.0
            }
        ];

        testObjects.forEach(({ color, size, position, mass, staticFriction, kineticFriction, bounciness }) => {
            // Create mesh
            const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            const material = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.position.set(position.x, position.y, position.z);
            this.scene.add(mesh);

            // Create physics body with static & kinetic friction
            const body = new RigidBody(mass, size, staticFriction, kineticFriction, bounciness);
            body.position = { ...position };

            this.physicsWorld.addObject(body);
            this.cubes.push({ mesh, body });
        });
    }

    placeBomb(position: THREE.Vector3, big: boolean) {
        const bomb = new Bomb(position, big, this.scene);
        this.bombs.push(bomb);
    }

    detonateBombs() {
        this.bombs.forEach(bomb => {
            bomb.detonate(this.scene, (position, forceMagnitude, radius) => {
                console.log(`Triggering Explosion at (${position.x}, ${position.y}, ${position.z})`);

                this.physicsWorld.addExternalForce(new ExplosionForce(position, forceMagnitude, radius));
            });
        });

        this.bombs = [];
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.paused) {
            this.renderer.render(this.scene, this.camera);
            return; // Skip updating physics and controls
        }

        let deltaTime = this.clock.getDelta();
        deltaTime = Math.min(deltaTime, 0.016); // Limit to 16ms (~60 FPS)

        this.controls.update(deltaTime);
        this.physicsWorld.update(deltaTime);

        this.cubes.forEach(({ mesh, body }) => {
            mesh.position.set(body.position.x, body.position.y, body.position.z);
            mesh.rotation.set(
                THREE.MathUtils.degToRad(body.rotation.pitch),
                THREE.MathUtils.degToRad(body.rotation.yaw),
                THREE.MathUtils.degToRad(body.rotation.roll)
            );
        });

        this.renderer.render(this.scene, this.camera);
    }
}
