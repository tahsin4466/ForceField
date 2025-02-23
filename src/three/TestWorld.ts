import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';
import { Bomb } from './Bomb';
import { ExplosionForce } from '../physics/Forces';
import { GravityForce } from '../physics/Forces';
import { FrictionForce } from "../physics/Forces";

export class TestWorld {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: FirstPersonControls;
    clock: THREE.Clock;
    physicsWorld: PhysicsWorld;
    cubes: { mesh: THREE.Mesh, body: RigidBody }[] = [];
    bombs: Bomb[] = [];

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.physicsWorld = new PhysicsWorld();

        // ✅ Add forces
        this.physicsWorld.addForceGenerator(new GravityForce());
        this.physicsWorld.addForceGenerator(new FrictionForce());

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
        });

        this.animate();
    }

    addTestObjects() {
        const testObjects = [
            {
                name: "Crate",
                color: 0x8B4513,
                position: { x: -2, y: 5, z: 0 },
                mass: 10,
                size: { x: 0.5, y: 0.5, z: 0.5 },
                staticFriction: 0.6,  // ✅ Wood has high static friction
                kineticFriction: 0.4, // ✅ Slippery when moving
                bounciness: 0.1
            },
            {
                name: "Bouncy Ball",
                color: 0xff0000,
                position: { x: 0, y: 8, z: 0 },
                mass: 0.6,
                size: { x: 0.24, y: 0.24, z: 0.24 },
                staticFriction: 0.2,  // ✅ Low friction
                kineticFriction: 0.1, // ✅ Very slippery
                bounciness: 0.9
            },
            {
                name: "Ice Cube",
                color: 0x00ffff,
                position: { x: 4, y: 6, z: 0 },
                mass: 0.2,
                size: { x: 0.05, y: 0.05, z: 0.05 },
                staticFriction: 0.05,  // ✅ Extremely low static friction
                kineticFriction: 0.02, // ✅ Almost no friction when moving
                bounciness: 0.3
            },
            {
                name: "Metal Block",
                color: 0xaaaaaa,
                position: { x: -2, y: 7, z: -2 },
                mass: 50,
                size: { x: 1, y: 1, z: 1 },
                staticFriction: 0.7,  // ✅ Very high static friction
                kineticFriction: 0.5, // ✅ Heavy but slow-moving
                bounciness: 0.0
            }
        ];

        testObjects.forEach(({ name, color, size, position, mass, staticFriction, kineticFriction, bounciness }) => {
            // Create mesh
            const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            const material = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.position.set(position.x, position.y, position.z);
            this.scene.add(mesh);

            // ✅ Create physics body with static & kinetic friction
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
            bomb.detonate(this.scene, (position, forceMagnitude, radius, color) => {
                this.physicsWorld.addForceGenerator(new ExplosionForce(position, forceMagnitude, radius));
            });
        });

        this.bombs = [];
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        let deltaTime = this.clock.getDelta();
        deltaTime = Math.min(deltaTime, 0.016); // Limit to 16ms (~60 FPS)

        this.controls.update(deltaTime);
        this.physicsWorld.update(deltaTime);

        this.cubes.forEach(({ mesh, body }) => {
            mesh.position.set(body.position.x, body.position.y, body.position.z);
        });

        this.renderer.render(this.scene, this.camera);
    }
}
