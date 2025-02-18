import * as THREE from 'three';

export class FirstPersonControls {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private direction: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 1.4; // Walking speed in meters per second
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private moveUp: boolean = false;
    private moveDown: boolean = false;
    private yawObject: THREE.Object3D = new THREE.Object3D();
    private pitchObject: THREE.Object3D = new THREE.Object3D();
    private sensitivity: number = 0.003; // Lower sensitivity for realistic movement
    private damping: number = 0.15; // Smoother movement

    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera;
        this.scene = scene;

        // Set a more human-like field of view (FOV)
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();

        // Setup camera container hierarchy
        this.pitchObject.add(this.camera);
        this.yawObject.add(this.pitchObject);
        this.scene.add(this.yawObject);

        // Set initial position to realistic eye height
        this.yawObject.position.set(0, 1.7, 5); // 1.7m instead of 1.8m (closer to average height)

        // Event listeners
        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);

        // Lock pointer on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
    }

    getPosition(): THREE.Vector3 {
        return this.yawObject.position.clone(); // Get player's actual position
    }

    private onKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'ArrowUp': this.moveUp = true; break; // Jump/Fly up
            case 'ArrowDown': this.moveDown = true; break; // Crouch/Descend
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'ArrowUp': this.moveUp = false; break;
            case 'ArrowDown': this.moveDown = false; break;
        }
    }

    private onMouseMove(event: MouseEvent) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.yawObject.rotation.y -= movementX * this.sensitivity;
        this.pitchObject.rotation.x -= movementY * this.sensitivity;

        // Limit pitch to prevent flipping upside down
        this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    }

    update(deltaTime: number) {
        this.direction.set(0, 0, 0);

        // Get forward and right vector from yawObject
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0; // Keep movement horizontal
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Apply movement
        if (this.moveForward) this.direction.add(forward);
        if (this.moveBackward) this.direction.sub(forward);
        if (this.moveLeft) this.direction.sub(right);
        if (this.moveRight) this.direction.add(right);
        if (this.moveUp) this.direction.y += 1;
        if (this.moveDown) this.direction.y -= 1;

        this.direction.normalize();

        // Apply velocity with damping
        this.velocity.lerp(this.direction.multiplyScalar(this.speed * deltaTime), this.damping);
        this.yawObject.position.add(this.velocity);
    }
}