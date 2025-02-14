import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';

export class SceneManager {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    physicsWorld: PhysicsWorld;
    cube: THREE.Mesh;
    cubePhysics: RigidBody;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.physicsWorld = new PhysicsWorld();

        // Create a cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        this.cubePhysics = new RigidBody(1);
        this.physicsWorld.addObject(this.cubePhysics);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        this.scene.add(light);

        this.camera.position.z = 5;
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.physicsWorld.update(0.016); // Simulating ~60 FPS physics

        // Sync Three.js object positions with physics world
        this.cube.position.set(
            this.cubePhysics.position.x,
            this.cubePhysics.position.y,
            this.cubePhysics.position.z
        );

        this.renderer.render(this.scene, this.camera);
    }
}
