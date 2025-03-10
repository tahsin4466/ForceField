import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';
import { Bomb } from './Bomb';
import { GravityForce, FrictionForce } from '../physics/ContinuousForces';
import { ExplosionForce, CursorForce } from "../physics/ImpulseForces"
import { addWorldObjects } from "./Objects.ts";

export class TestWorld {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: FirstPersonControls;
    clock: THREE.Clock;
    physicsWorld: PhysicsWorld;
    cubes: { mesh: THREE.Mesh, body: RigidBody }[] = [];
    bombs: Bomb[] = [];
    paused: boolean = false;
    private selectionRaycaster = new THREE.Raycaster();
    private forceRaycaster = new THREE.Raycaster();
    highlightedObject: { mesh: THREE.Mesh; body: RigidBody } | null = null;
    selectedObject: { mesh: THREE.Mesh; body: RigidBody } | null = null;
    intersectionPoint = new THREE.Vector3();
    simulationSpeed: number = 1;
    private forceArrow: THREE.ArrowHelper | null = null;
    forceMagnitude: number = 3;
    pickupDistance: number = 0;


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

        addWorldObjects(this.scene, this.physicsWorld, this.cubes);

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
            // Prevent default for movement keys
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
                event.preventDefault();
            }

            const playerPosition = this.controls.getPosition();
            const overlay = document.getElementById("pauseOverlay");
            const speedIndicator = document.getElementById("speedIndicator");

            switch (event.code) {
                case "KeyB": {
                    const isBig = event.shiftKey;
                    this.placeBomb(playerPosition, isBig);
                    break;
                }
                case "KeyE":
                    this.detonateBombs();
                    break;
                case "Space":
                case "Digit0":
                    this.paused = !this.paused;
                    document.body.classList.toggle("paused");
                    const isPaused = document.body.classList.contains("paused");
                    if (overlay) overlay.style.display = isPaused ? "block" : "none";
                    break;
                case "Digit1":
                    this.simulationSpeed = 0.5;
                    if (speedIndicator) {
                        speedIndicator.innerText = "0.5x";
                        speedIndicator.style.display = "block";
                    }
                    break;
                case "Digit2":
                    this.simulationSpeed = 1;
                    if (speedIndicator) {
                        speedIndicator.style.display = "none"; // Hide marker at normal speed
                    }
                    break;
                case "Digit3":
                    this.simulationSpeed = 2;
                    if (speedIndicator) {
                        speedIndicator.innerText = "2x";
                        speedIndicator.style.display = "block";
                    }
                    break;
                case "KeyX":
                    this.deselectObject();
                    break;
                case "ArrowLeft":
                    if (this.forceArrow && this.forceMagnitude > 3) {
                        this.forceMagnitude -= 1;
                    }
                    else if (this.pickupDistance > 2) {
                        this.pickupDistance -= 1;
                    }
                    break;
                case "ArrowRight":
                    if (this.forceArrow && this.forceMagnitude < 13) {
                        this.forceMagnitude += 1;
                    }
                    else if (this.pickupDistance) {
                        this.pickupDistance += 1;
                    }
                    break;
            }
        });
        window.addEventListener('click', (event) => {
            if (event.button === 0) {
                this.selectObjectDrag();
            }
            if (event.button === 2) {
                this.selectObjectForce();
            }
        });
        this.animate();
    }

    placeBomb(position: THREE.Vector3, big: boolean) {
        const bomb = new Bomb(position, big, this.scene);
        this.bombs.push(bomb);
    }

    detonateBombs() {
        this.bombs.forEach(bomb => {
            bomb.detonate(this.scene, (position, forceMagnitude, radius) => {
                this.physicsWorld.addExternalForce(new ExplosionForce(position, forceMagnitude, radius));
            });
        });

        this.bombs = [];
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        let deltaTime = this.clock.getDelta();
        deltaTime = Math.min(deltaTime, 0.008);

        if (!this.selectedObject) {
            this.highlightObject();
        }

        if (this.forceArrow && this.selectedObject) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            this.forceRaycaster.set(this.intersectionPoint, direction);
            this.scene.remove(this.forceArrow);
            let arrowColor;
            if (this.forceMagnitude === 3) arrowColor = 0x0000ff;
            else if (this.forceMagnitude > 3 && this.forceMagnitude <= 6) arrowColor = 0x00ff00;
            else if (this.forceMagnitude > 6 && this.forceMagnitude <= 9) arrowColor = 0xffff00;
            else if (this.forceMagnitude > 9 && this.forceMagnitude <= 12) arrowColor = 0xffa500;
            else arrowColor = 0xff0000;
            this.forceArrow = new THREE.ArrowHelper(direction, this.intersectionPoint, this.forceMagnitude, arrowColor);
            this.scene.add(this.forceArrow);
        }
        else if (this.pickupDistance && this.selectedObject) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3())
            const targetPosition = this.controls.getPosition().clone().addScaledVector(direction, this.pickupDistance);
            // Move the physics body to this new position
            this.selectedObject.body.position.x = targetPosition.x;
            this.selectedObject.body.position.y = targetPosition.y;
            this.selectedObject.body.position.z = targetPosition.z;
            // Ensure the mesh follows the physics body
            this.selectedObject.mesh.position.copy(this.selectedObject.body.position);
        }


        if (!this.paused) {
            this.physicsWorld.update(deltaTime * this.simulationSpeed);
            this.cubes.forEach(({ mesh, body }) => {
                if (this.pickupDistance && this.selectedObject) this.selectedObject.body.clearForce();
                mesh.position.set(body.position.x, body.position.y, body.position.z);
                mesh.rotation.set(
                    THREE.MathUtils.degToRad(body.rotation.pitch),
                    THREE.MathUtils.degToRad(body.rotation.yaw),
                    THREE.MathUtils.degToRad(body.rotation.roll)
                );
            });
        }
        this.controls.update(deltaTime)
        this.renderer.render(this.scene, this.camera);
    }

    highlightObject() {
        const direction = this.camera.getWorldDirection(new THREE.Vector3());
        const rayOrigin = this.controls.getPosition();

        this.selectionRaycaster.set(rayOrigin, direction);
        const intersects = this.selectionRaycaster.intersectObjects(this.cubes.map(cube => cube.mesh));

        if (intersects.length > 0) {
            const mesh = intersects[0].object as THREE.Mesh;
            const cube = this.cubes.find(c => c.mesh === mesh);

            if (cube && cube.body.mass >= 0 && this.highlightedObject !== cube) {
                if (this.highlightedObject) {
                    (this.highlightedObject.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                    (this.highlightedObject.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
                }

                // Store the intersection point for later use
                this.intersectionPoint = intersects[0].point.clone(); // ⬅️ Store point
                this.highlightedObject = cube;

                (cube.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x333333);
                (cube.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
            }
        } else {
            if (this.highlightedObject) {
                (this.highlightedObject.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                (this.highlightedObject.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
                this.highlightedObject = null;
            }
        }
    }

    selectObjectDrag() {
        if (this.highlightedObject && !this.selectedObject) {
            this.selectedObject = this.highlightedObject;
            this.selectedObject.body.clearForce();
            this.pickupDistance = this.controls.getPosition().distanceTo(this.selectedObject.mesh.position);
        }
    }

    selectObjectForce() {
        if (this.highlightedObject && !this.selectedObject) {
            this.selectedObject = this.highlightedObject;
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            const intersectionPoint = this.intersectionPoint || this.selectedObject.body.position;
            this.forceRaycaster.set(intersectionPoint, direction);
            this.forceMagnitude = 3;
            if (this.forceArrow) {
                this.scene.remove(this.forceArrow);
            }

            // Create an arrow to visualize the ray
            this.forceArrow = new THREE.ArrowHelper(direction, intersectionPoint, this.forceMagnitude, 0xff0000);
            this.scene.add(this.forceArrow);
        }
    }

    deselectObject() {
        if (this.highlightedObject && this.selectedObject) {
            if (this.forceArrow) {
                this.physicsWorld.addExternalForce(new CursorForce(this.forceMagnitude, this.camera.getWorldDirection(new THREE.Vector3()), this.selectedObject.body, this.intersectionPoint));
                this.scene.remove(this.forceArrow);
                this.forceArrow = null;
            }
            // Reset material properties
            (this.selectedObject.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            (this.selectedObject.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
            this.selectedObject = null;
            this.controls.lockMovement = false;
        }
        else if (this.pickupDistance) {
            this.pickupDistance = 0;
        }
    }
}
