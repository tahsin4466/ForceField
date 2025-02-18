import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';

export class TestWorld {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: FirstPersonControls;
    clock: THREE.Clock;
    physicsWorld: PhysicsWorld;
    cubes: { mesh: THREE.Mesh, body: RigidBody }[] = [];

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.physicsWorld = new PhysicsWorld();  // Initialize physics world

        // Floor (Static - No RigidBody)
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Scene Objects (Dynamic - With RigidBody)
        for (let i = 0; i < 5; i++) {
            const cubeGeometry = new THREE.BoxGeometry();
            const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.castShadow = true;

            // Set initial position
            const position = {
                x: Math.random() * 10 - 5,
                y: 5 + Math.random() * 2, // Spawn above the ground
                z: Math.random() * 10 - 5
            };
            cube.position.set(position.x, position.y, position.z);
            this.scene.add(cube);

            // Create RigidBody for physics
            const body = new RigidBody(1);
            body.position = { ...position };

            this.physicsWorld.addObject(body);
            this.cubes.push({ mesh: cube, body });
        }

        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        light.castShadow = true;
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Camera controls
        this.controls = new FirstPersonControls(this.camera, this.scene);
        this.clock = new THREE.Clock();

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();

        this.controls.update(deltaTime);
        this.physicsWorld.update(deltaTime);

        // Sync cube meshes with their rigid bodies
        this.cubes.forEach(({ mesh, body }) => {
            mesh.position.set(body.position.x, body.position.y, body.position.z);
        });

        this.renderer.render(this.scene, this.camera);
    }
}
