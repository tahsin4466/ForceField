import * as THREE from 'three';
import { FirstPersonControls } from './FirstPerson';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RigidBody } from '../physics/RigidBody';
import { Bomb } from './Bomb';
import {GravityForce, FrictionForce, DragForce, WindForce} from '../physics/ContinuousForces';
import { ExplosionForce, CursorForce } from "../physics/ImpulseForces"
import {addWorldObjects} from "./Objects.ts";
import { EarthClearWorld, EarthRainWorld, MoonWorld, SpaceWorld} from "./Worlds.ts";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


//random world generator
let id: number = Math.floor(Math.random() * (Math.floor(6) - Math.ceil(1)) + Math.ceil(1));


let world = new EarthClearWorld();
switch (id) {
    case 3:
        world = new EarthRainWorld();
        break;
    case 4:
        world = new MoonWorld();
        break;
    case 5:
        world = new SpaceWorld();
}

export class GameWorld {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: FirstPersonControls;
    clock: THREE.Clock;
    physicsWorld: PhysicsWorld;
    physicsObjects: { mesh: THREE.Mesh, body: RigidBody }[] = [];
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

    composer: EffectComposer | null = null;
    renderPass: RenderPass | null = null;
    sun: THREE.Mesh | null = null;
    sunlight: THREE.DirectionalLight | null = null;
    ambientLight: THREE.AmbientLight | null = null;
    moon: THREE.Mesh | null = null;
    moonlight: THREE.DirectionalLight | null = null;
    pausedTime: number = 0;  // Total time spent paused
    pauseStart: number | null = null; // Time when pause started
    rain: THREE.Points | null = null;
    rainVelocity: number = -0.2; // Define a constant speed for the rain


    constructor() {
        this.scene = world.scene;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.composer = new EffectComposer(this.renderer);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        this.composer.addPass(fxaaPass);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        this.physicsWorld = new PhysicsWorld(world.hasFloor);

        // Add forces
        this.physicsWorld.addForceGenerator(new GravityForce(world.gravity));
        this.physicsWorld.addForceGenerator((new FrictionForce(world.floorFrictionStatic, world.floorFrictionStatic)))
        this.physicsWorld.addForceGenerator((new DragForce(world.density)))
        this.physicsWorld.addForceGenerator((new WindForce(world.density, world.wind)))

        addWorldObjects(id, this.scene, this.physicsWorld, this.physicsObjects);

        if (id <= 2) {
            //the sun and lighting
            // Create the sun (a sphere)
            const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
            const sunMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFBC,
                emissive: 0xFFFFBC,
                emissiveIntensity: 5
            });
            this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
            this.sun.position.set(20, 30, -10); // Position it in the sky
            this.scene.add(this.sun);

            // Sunlight as a DirectionalLight
            this.sunlight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
            this.sunlight.position.set(20, 30, -10);
            this.sunlight.castShadow = true;
            this.sunlight.shadow.mapSize.width = 2048;
            this.sunlight.shadow.mapSize.height = 2048;
            this.sunlight.shadow.camera.near = 1;
            this.sunlight.shadow.camera.far = 100;
            this.sunlight.shadow.camera.left = -50;
            this.sunlight.shadow.camera.right = 50;
            this.sunlight.shadow.camera.top = 50;
            this.sunlight.shadow.camera.bottom = -50;
            this.scene.add(this.sunlight);

            // Post-Processing (UnrealBloomPass)
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.6,  // Bloom intensity (Lower intensity for subtle glow)
                0.6,  // Bloom radius (Increase for smoother glow)
                0.6  // Bloom threshold (Filter out unwanted glow)
            );
            this.composer.addPass(bloomPass);

            // Create the moon (a sphere)
            const moonGeometry = new THREE.SphereGeometry(2.5, 32, 32);
            const moonMaterial = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa,
                emissive: 0xaaaaaa,
                emissiveIntensity: 3 });
            this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
            this.moon.position.set(-20, -30, 10); // Opposite initial position
            this.scene.add(this.moon);

            // Moonlight as a weak DirectionalLight
            this.moonlight = new THREE.DirectionalLight(0x8888ff, 0.05); // Very dim blue light
            this.moonlight.position.set(-20, -30, 10);
            this.scene.add(this.moonlight);
            this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(this.ambientLight);
        }
        if (id === 4 || id === 5) {
            // Post-Processing (UnrealBloomPass)
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.6,  // Bloom intensity (Lower intensity for subtle glow)
                0.6,  // Bloom radius (Increase for smoother glow)
                0.6  // Bloom threshold (Filter out unwanted glow)
            );
            this.composer.addPass(bloomPass);
        }
        if (id === 3){
            const rainGeometry = new THREE.BufferGeometry();
            const rainVertices: number[] = [];
            const rainCount = 1000; // Number of rain drops
    
            for (let i = 0; i < rainCount; i++) {
                rainVertices.push(
                    (Math.random() - 0.5) * 100, // X position (spread over a large area)
                    Math.random() * 50 + 10, // Y position (falling from the sky)
                    (Math.random() - 0.5) * 100 // Z position (spread out depth-wise)
                );
            }
    
            rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));
    
            const rainMaterial = new THREE.PointsMaterial({
                color: 0xaaaaaa,
                size: 0.2,
                transparent: true,
                opacity: 0.6
            });
    
            this.rain = new THREE.Points(rainGeometry, rainMaterial);
            this.scene.add(this.rain);

            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.8,  // Bloom intensity (Lower intensity for subtle glow)
                0.4,  // Bloom radius (Increase for smoother glow)
                0.85  // Bloom threshold (Filter out unwanted glow)
            );
            this.composer.addPass(bloomPass);

            const lightning = new THREE.PointLight(0xffffff, 10, 0);
            lightning.position.set(0, 30, 0);
            this.scene.add(lightning);

            function flashLightning() {
                console.log("⚡ Lightning event triggered!");

                const strikes = Math.floor(Math.random() * 2) + 1; // 1 to 4 flashes
                let strikeCount = 0;

                function strike() {
                    lightning.position.set((Math.random()*20)-10, 30, (Math.random()*20)-10);
                    if (strikeCount >= strikes) return; // Stop when flashes are done

                    lightning.intensity = Math.random() * 5000; // Random brightness
                    console.log(`⚡ Flash ${strikeCount + 1} of ${strikes}`);

                    setTimeout(() => {
                        lightning.intensity = 0; // Turn off lightning
                        strikeCount++;

                        // Add slight delay before the next strike in the sequence
                        setTimeout(strike, Math.random() * 600 + 200); // 100-400ms delay
                    }, Math.random() * 200 + 100); // Flash duration
                }

                strike(); // Start the first strike

                // Schedule the next lightning event after 3 to 7 seconds
                setTimeout(flashLightning, Math.random() * 4000 + 3000);
            }

            // Random lightning flashes every 3-7 seconds
            setInterval(flashLightning, Math.random() * 4000 + 3000);
        }

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
                    if (this.paused) {
                        this.pauseStart = this.clock.getElapsedTime(); // Record when pause starts
                    } else if (this.pauseStart !== null) {
                        this.pausedTime += this.clock.getElapsedTime() - this.pauseStart; // Add to total paused time
                        this.pauseStart = null; // Reset
                    }
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
                case "KeyQ":
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
                case "BracketLeft":
                    if (!this.forceArrow && this.selectedObject) {
                        this.selectedObject.body.rotation.pitch += 10;
                    }
                    break;
                case "BracketRight":
                    if (!this.forceArrow && this.selectedObject) {
                        this.selectedObject.body.rotation.yaw += 10;
                    }
                    break;
                case "Backslash":
                    if (!this.forceArrow && this.selectedObject) {
                        this.selectedObject.body.rotation.roll += 10;
                    }
                    break;

            }
        });
        window.addEventListener('click', (event) => {
            if (event.button === 0 && !this.selectedObject) {
                this.selectObjectDrag();
            }
            if (event.button === 2 && !this.selectedObject) {
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
            this.physicsObjects.forEach(({ mesh, body }) => {
                if (this.pickupDistance && this.selectedObject) this.selectedObject.body.clearForce();
                mesh.position.set(body.position.x, body.position.y, body.position.z);
                mesh.rotation.set(
                    THREE.MathUtils.degToRad(body.rotation.pitch),
                    THREE.MathUtils.degToRad(body.rotation.yaw),
                    THREE.MathUtils.degToRad(body.rotation.roll)
                );
            });
          
            // Day-Night Cycle
            // Adjust elapsed time by subtracting paused duration
            if (id <= 2 && this.sun && this.sunlight && this.moon && this.moonlight && this.ambientLight) {
                const adjustedTime = this.clock.getElapsedTime() - this.pausedTime;
                const dayDuration = 240; // Total cycle time in seconds
                const angle = (adjustedTime % dayDuration) / dayDuration * Math.PI * 2;


                // Update sun position (orbiting around Y-axis)
                const radius = 50;
                this.sun.position.set(
                    Math.cos(angle) * radius, 
                    Math.sin(angle) * radius + 10, 
                    Math.sin(angle) * radius);
                this.sunlight.position.copy(this.sun.position);

                    // Moon position (opposite side)
                this.moon.position.set(
                    Math.cos(angle + Math.PI) * radius,
                    Math.sin(angle + Math.PI) * radius + 10,
                    Math.sin(angle + Math.PI) * radius
                );
                this.moonlight.position.copy(this.moon.position);

                // Adjust sunlight intensity (brighter at peak, dim at night)
                const normalizedHeight = (this.sun.position.y + radius) / (2 * radius); // Normalize between 0 and 1
                this.sunlight.intensity = Math.max(0.1, normalizedHeight * 1.5); // Prevent total darkness
                this.ambientLight.intensity = Math.max(0.2, normalizedHeight); // Adjust ambient light

                // Define color stops
                const middayColor = new THREE.Color(0x87CEEB); // Sky blue
                const sunsetColor = new THREE.Color(0xFF8C00); // Warm sunset orange
                const pinkishColor = new THREE.Color(0xFF69B4); // Pink hue for late sunset
                const nightColor = new THREE.Color(0x000d66); // Deep night blue

                // Transition logic
                let skyColor;
                if (normalizedHeight > 0.7) {
                    // Daytime (Blue)
                    skyColor = middayColor;
                } else if (normalizedHeight > 0.5) {
                    // Sunset (Blend from blue to orange)
                    skyColor = new THREE.Color().lerpColors(middayColor, sunsetColor, (0.7 - normalizedHeight) / 0.2);
                } else if (normalizedHeight > 0.35) {
                    // Late sunset (Blend from orange to pink)
                    skyColor = new THREE.Color().lerpColors(sunsetColor, pinkishColor, (0.5 - normalizedHeight) / 0.15);
                } else {
                    // Night (Blend from pink to deep blue) stronger blue
                    skyColor = new THREE.Color().lerpColors(pinkishColor, nightColor, (0.35 - normalizedHeight) / 0.15);
                }
                this.scene.background = skyColor;


                // Moonlight is strongest when the sun is at its lowest
                this.moonlight.intensity = Math.max(0.01, (1 - normalizedHeight) * 0.3); // Max of 0.1 at night
            }
            if (id === 3 && this.rain){//code to animate the rain world
                const positions = this.rain.geometry.attributes.position.array as Float32Array;

                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += world.wind.x*-0.02040816; // Move in wind's X direction
                    positions[i + 1] += this.rainVelocity; // Move downward
                    positions[i + 2] += world.wind.z*-0.02040816; // Move in wind's Z direction

                    // Reset raindrop when it reaches the bottom
                    if (positions[i + 1] < 0) {
                        positions[i] = (Math.random() - 0.5) * 200; // Random X position
                        positions[i + 1] = Math.random() * 50 + 10; // Reset to the top
                        positions[i + 2] = (Math.random() - 0.5) * 200; // Random Z position
                    }
                }
                this.rain.geometry.attributes.position.needsUpdate = true;
            }
        }
        this.controls.update(deltaTime)
        if (this.composer) this.composer.render();
    }

    highlightObject() {
        const direction = this.camera.getWorldDirection(new THREE.Vector3());
        const rayOrigin = this.controls.getPosition();

        this.selectionRaycaster.set(rayOrigin, direction);
        const intersects = this.selectionRaycaster.intersectObjects(this.physicsObjects.map(cube => cube.mesh));

        if (intersects.length > 0) {
            const mesh = intersects[0].object as THREE.Mesh;
            const cube = this.physicsObjects.find(c => c.mesh === mesh);

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
            this.intersectionPoint = new THREE.Vector3();
        }
        else if (this.pickupDistance) {
            this.pickupDistance = 0;
        }
    }
}
