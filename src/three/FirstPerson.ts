import * as THREE from 'three';
import { gsap } from "gsap";

export class FirstPersonControls {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private direction: THREE.Vector3 = new THREE.Vector3();
    private speed: number = 4;
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private moveUp: boolean = false;
    private moveDown: boolean = false;
    private zoomIn: boolean = false;
    private player: THREE.Group = new THREE.Group();
    private sensitivity: number = 0.0025;
    private damping: number = 0.15;
    private rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    public lockMovement: boolean = false;

    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera;
        this.scene = scene;
        this.camera.fov = 75;
        this.camera.updateProjectionMatrix();

        this.player.add(this.camera);
        this.scene.add(this.player);
        this.player.position.set(0, 1.7, 5);
        this.camera.position.set(0, 0, 0);

        // Event listeners
        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);

        // Lock pointer on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock(); //Pointer lock for crosshair
        });

        document.addEventListener('pointerlockchange', () => {
            const crosshair = document.getElementById('crosshair');
            if (document.pointerLockElement === document.body) {
                crosshair!.style.display = 'block';
            } else {
                crosshair!.style.display = 'none';
            }
        });
    }

    getPosition(): THREE.Vector3 {
        return this.player.position.clone(); // Get the player's actual position FIX PLEASE USE THIS
    }

    private onKeyDown(event: KeyboardEvent) {
        if (this.lockMovement) return;
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'ArrowUp': this.moveUp = true; break;
            case 'ArrowDown': this.moveDown = true; break;
            case 'KeyZ': this.zoomIn = true; break;
            case "Backquote": this.speed = 10; break;
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
            case "Backquote": this.speed = 4; break;
        }
    }

    private onMouseMove(event: MouseEvent) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        this.rotation.y -= movementX * this.sensitivity;
        this.rotation.x -= movementY * this.sensitivity;
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        //Gimbal lock fix
        this.player.quaternion.setFromEuler(this.rotation);
    }

    update(deltaTime: number) {
        this.direction.set(0, 0, 0);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.player.quaternion);
        forward.y = 0;
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
        this.velocity.lerp(this.direction.multiplyScalar(this.speed * deltaTime), this.damping);
        this.player.position.add(this.velocity);
        this.camera.position.set(0, 0, 0);
    }
}