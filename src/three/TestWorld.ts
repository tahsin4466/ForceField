import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';

export class TestWorld {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: FirstPersonControls;
    clock: THREE.Clock;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;  // Enable shadows
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // Make it horizontal
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Scene Objects
        for (let i = 0; i < 5; i++) {
            const cubeGeometry = new THREE.BoxGeometry();
            const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.position.set(Math.random() * 10 - 5, 1, Math.random() * 10 - 5); // Random positions
            cube.castShadow = true;
            this.scene.add(cube);
        }

        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        light.castShadow = true;  // Enable shadow casting
        this.scene.add(light);

        // Add ambient light to avoid pitch-black shadows
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Camera controls
        this.controls = new FirstPersonControls(this.camera, this.scene);
        this.clock = new THREE.Clock();  // Initialize clock for accurate deltaTime

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();  // Get time since last frame
        this.controls.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}
