import * as THREE from 'three';

export class FirstPersonControls {
    private camera: THREE.PerspectiveCamera;
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private direction: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 5;
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private yaw: number = 0;
    private pitch: number = 0;
    private sensitivity: number = 0.002;

    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
        this.camera.position.set(0, 1.8, 5); // Fixed height like a person

        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);

        document.body.requestPointerLock();
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
        this.yaw -= event.movementX * this.sensitivity;
        this.pitch -= event.movementY * this.sensitivity;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    }

    update() {
        const deltaTime = 0.016; // Approximate 60 FPS
        this.direction.set(0, 0, 0);

        if (this.moveForward) this.direction.z -= 1;
        if (this.moveBackward) this.direction.z += 1;
        if (this.moveLeft) this.direction.x -= 1;
        if (this.moveRight) this.direction.x += 1;

        this.direction.normalize();
        this.velocity.copy(this.direction).multiplyScalar(this.speed * deltaTime);

        this.camera.position.add(this.velocity);

        // Apply rotation
        this.camera.rotation.set(this.pitch, this.yaw, 0);
    }
}
