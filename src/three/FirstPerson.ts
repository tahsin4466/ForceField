import * as THREE from 'three';
import { gsap } from "gsap";

export class FirstPersonControls {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private direction: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 4; // Walking speed in meters per second
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private moveUp: boolean = false;
    private moveDown: boolean = false;
    private zoomIn: boolean = false;
    private player: THREE.Group = new THREE.Group(); // The player's movement object
    private sensitivity: number = 0.0025; // Standard FPS sensitivity
    private damping: number = 0.15; // Smooth movement damping
    private rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ'); // Proper FPS rotation order
    public lockMovement: boolean = false;

    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera;
        this.scene = scene;

        // Set a standard field of view (FOV)
        this.camera.fov = 75;
        this.camera.updateProjectionMatrix();

        // Parent camera to the player object
        this.player.add(this.camera);
        this.scene.add(this.player);

        // Set initial position to eye level
        this.player.position.set(0, 1.7, 5); // Standard FPS player height

        // Offset camera inside player object to ensure correct eye level
        this.camera.position.set(0, 0, 0); // Directly at the player's position

        // Event listeners
        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);

        // Lock pointer on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            const crosshair = document.getElementById('crosshair');
            if (document.pointerLockElement === document.body) {
                crosshair!.style.display = 'block'; // Show crosshair when locked
            } else {
                crosshair!.style.display = 'none'; // Hide when unlocked
            }
        });
    }

    getPosition(): THREE.Vector3 {
        return this.player.position.clone(); // Get the player's actual position
    }

    private onKeyDown(event: KeyboardEvent) {
        if (this.lockMovement) return;
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'ArrowUp': this.moveUp = true; break; // Jump/Fly up
            case 'ArrowDown': this.moveDown = true; break;
            case 'KeyZ': this.zoomIn = true; break;
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        if (this.lockMovement) return;
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'ArrowUp': this.moveUp = false; break;
            case 'ArrowDown': this.moveDown = false; break;
            case 'KeyZ': this.zoomIn = false; break;
        }
    }

    private onMouseMove(event: MouseEvent) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Update yaw (horizontal rotation)
        this.rotation.y -= movementX * this.sensitivity;

        // Update pitch (vertical rotation) and clamp it
        this.rotation.x -= movementY * this.sensitivity;
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

        // Apply rotation to player using quaternions (better stability)
        this.player.quaternion.setFromEuler(this.rotation);
    }

    update(deltaTime: number) {
        this.direction.set(0, 0, 0);

        // Compute forward and right movement vectors based on player's rotation
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.player.quaternion);

        forward.y = 0; // Keep movement horizontal
        right.y = 0;
        forward.normalize();
        right.normalize();

        // Apply movement
        if (this.moveForward) this.direction.add(forward);
        if (this.moveBackward) this.direction.sub(forward);
        if (this.moveLeft) this.direction.sub(right);
        if (this.moveRight) this.direction.add(right);
        if (this.moveUp) this.direction.y += 1;
        if (this.moveDown) this.direction.y -= 1;
        if (this.zoomIn) {
            gsap.to(this.camera, {
                fov: 30,
                duration: 0.1,
                onUpdate: () => this.camera.updateProjectionMatrix()
            });
        }
        else {
            gsap.to(this.camera, {
                fov: 75,
                duration: 0.1,
                onUpdate: () => this.camera.updateProjectionMatrix()
            });
        }

        this.direction.normalize();

        // Apply velocity with damping for smooth movement
        this.velocity.lerp(this.direction.multiplyScalar(this.speed * deltaTime), this.damping);
        this.player.position.add(this.velocity);

        // Ensure the camera moves with the player naturally
        this.camera.position.set(0, 0, 0);
    }
}