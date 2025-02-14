import * as THREE from 'three';

export class FirstPersonControls {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private direction: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 5;
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private yawObject: THREE.Object3D = new THREE.Object3D();
    private pitchObject: THREE.Object3D = new THREE.Object3D();
    private sensitivity: number = 0.005;
    private damping: number = 0.1; // Smooth movement

    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera;
        this.scene = scene;

        // Setup camera container hierarchy (Corrected order)
        this.pitchObject.add(this.camera);  // Camera rotates up/down
        this.yawObject.add(this.pitchObject); // Yaw rotates left/right
        this.scene.add(this.yawObject); // Add yawObject to the scene

        // Set initial position
        this.yawObject.position.set(0, 1.8, 5); // Eye height

        // Event listeners
        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);

        // Lock pointer on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
    }

    private onKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
        }
    }

    private onMouseMove(event: MouseEvent) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Rotate left/right (yaw) affects yawObject
        this.yawObject.rotation.y -= movementX * this.sensitivity;

        // Rotate up/down (pitch) affects pitchObject
        this.pitchObject.rotation.x -= movementY * this.sensitivity;

        // Limit pitch to prevent looking too far up/down
        this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    }

    update(deltaTime: number) {
        // Reset movement direction
        this.direction.set(0, 0, 0);

        // Get forward and right vector from yawObject
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0; // Keep movement horizontal (Minecraft doesn't allow flying)
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Apply movement
        if (this.moveForward) this.direction.add(forward);
        if (this.moveBackward) this.direction.sub(forward);
        if (this.moveLeft) this.direction.sub(right);
        if (this.moveRight) this.direction.add(right);

        this.direction.normalize(); // Prevent diagonal speed boost

        // Apply velocity with damping
        this.velocity.lerp(this.direction.multiplyScalar(this.speed * deltaTime), this.damping);
        this.yawObject.position.add(this.velocity);
    }
}
