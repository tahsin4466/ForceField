import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';
import { Bomb } from './Bomb';
import { GravityForce, FrictionForce } from '../physics/ContinuousForces';
import { ExplosionForce, CursorForce } from "../physics/ImpulseForces"

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
                    break;
                case "ArrowRight":
                    if (this.forceArrow && this.forceMagnitude < 13) {
                        this.forceMagnitude += 1;
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

    addTestObjects() {
        const testObjects = [
            {
                name: "Crate",
                color: 0x8B4513,
                position: { x: -2, y: 9, z: 2 },
                mass: 2,
                size: { x: 0.5, y: 0.5, z: 0.5 },
                staticFriction: 0.6,
                kineticFriction: 0.4,
                bounciness: 0.1,
                inertia: {xx: 1, yy: 1, zz: 1}
            },
            {
                name: "Bouncy Ball",
                color: 0xff0000,
                position: { x: 0, y: 8, z: 2 },
                mass: 0.6,
                size: { x: 0.24, y: 0.24, z: 0.24 },
                staticFriction: 0.2,
                kineticFriction: 0.1,
                bounciness: 0.7,
                inertia: {xx: 5, yy: 5, zz: 5}
            },
            {
                name: "Ice Cube",
                color: 0x00ffff,
                position: { x: 4, y: 6, z: 2 },
                mass: 0.2,
                size: { x: 0.05, y: 0.05, z: 0.05 },
                staticFriction: 0.05,
                kineticFriction: 0.02,
                bounciness: 0.3,
                inertia: {xx: 0.5, yy: 0.5, zz: 0.5},

            },
            {
                name: "Metal Block",
                color: 0xaaaaaa,
                position: { x: -2, y: 7, z: 0 },
                mass: 5,
                size: { x: 1, y: 1, z: 1 },
                staticFriction: 0.7,
                kineticFriction: 0.5,
                bounciness: 0.0,
                inertia: {xx: 0.1, yy: 0.1, zz: 0.1}
            }
        ];

        testObjects.forEach(({ color, size, position, mass, staticFriction, kineticFriction, bounciness, inertia }) => {
            // Create mesh
            const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            const material = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.position.set(position.x, position.y, position.z);
            this.scene.add(mesh);

            // Create physics body with static & kinetic friction
            const body = new RigidBody(mass, size, staticFriction, kineticFriction, bounciness, inertia);
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
            const rayOrigin = new THREE.Vector3(
                this.selectedObject.body.position.x,
                this.selectedObject.body.position.y,
                this.selectedObject.body.position.z
            );
            this.forceRaycaster.set(rayOrigin, direction);
            this.scene.remove(this.forceArrow);
            let arrowColor;
            if (this.forceMagnitude === 3) arrowColor = 0x0000ff;
            else if (this.forceMagnitude > 3 && this.forceMagnitude <= 6) arrowColor = 0x00ff00;
            else if (this.forceMagnitude > 6 && this.forceMagnitude <= 9) arrowColor = 0xffff00;
            else if (this.forceMagnitude > 9 && this.forceMagnitude <= 12) arrowColor = 0xffa500;
            else arrowColor = 0xff0000;
            this.forceArrow = new THREE.ArrowHelper(direction, rayOrigin, this.forceMagnitude, arrowColor);
            this.scene.add(this.forceArrow);
        }
        else if (this.pickupDistance && this.selectedObject) {
            // Get the direction the camera is facing
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            // Compute the new target position (pickup distance in front of the player)
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

    //functions for the raycaster
    highlightObject() {

        const direction = this.camera.getWorldDirection(new THREE.Vector3());
        const rayOrigin = this.controls.getPosition(); // Ensure the origin is the camera's position (in world space)

        //raycaster
        this.selectionRaycaster.set(rayOrigin, direction);
        const intersects = this.selectionRaycaster.intersectObjects(this.cubes.map(cube => cube.mesh));


        if (intersects.length > 0) {
            //const object = intersects[0].object as THREE.Mesh;
            const mesh = intersects[0].object as THREE.Mesh;
            const cube = this.cubes.find(c => c.mesh === mesh); // Find the corresponding cube object

            if (cube && this.highlightedObject !== cube ) {
                // Remove highlight from the old object
                if (this.highlightedObject) {
                    (this.highlightedObject.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                    (this.highlightedObject.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0; // Reset intensity

                }
                // Highlight new object
                this.highlightedObject = cube;
                (cube.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x333333);
                (cube.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;

            }
        } else {
            // Remove highlight if no object is hit
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
            console.log(this.pickupDistance);
        }
    }

    selectObjectForce() {
        if (this.highlightedObject && !this.selectedObject) {
            this.selectedObject = this.highlightedObject;
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            const rayOrigin = new THREE.Vector3(
                this.selectedObject.body.position.x,
                this.selectedObject.body.position.y,
                this.selectedObject.body.position.z
            );
            this.forceRaycaster.set(rayOrigin, direction);
            this.forceMagnitude = 3;
            if (this.forceArrow) {
                this.scene.remove(this.forceArrow);
            }

            // Create an arrow to visualize the ray
            this.forceArrow = new THREE.ArrowHelper(direction, rayOrigin, this.forceMagnitude, 0xff0000);
            this.scene.add(this.forceArrow);
        }
    }

    deselectObject() {
        if (this.highlightedObject && this.selectedObject) {
            if (this.forceArrow) {
                this.physicsWorld.addExternalForce(new CursorForce(this.forceMagnitude, this.camera.getWorldDirection(new THREE.Vector3()), this.selectedObject.body));
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
