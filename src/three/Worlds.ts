import * as THREE from 'three';

export abstract class BaseWorld {
    gravity: number;
    floorFrictionStatic: number;
    floorFrictionKinetic: number;
    density: number;
    scene: THREE.Scene;
    hasFloor: boolean;

    constructor(
        gravity: number,
        floorFrictionStatic: number,
        floorFrictionKinetic: number,
        density: number,
        hasFloor: boolean,
    ) {
        this.gravity = gravity;
        this.floorFrictionStatic = floorFrictionStatic;
        this.floorFrictionKinetic = floorFrictionKinetic;
        this.density = density;
        this.hasFloor = hasFloor;
        this.scene = new THREE.Scene();

        this.setupEnvironment();
    }

    abstract setupEnvironment(): void;
}

export class EarthClearWorld extends BaseWorld {
    constructor() {
        super(-9.8, 0.6, 0.4, 1.279, true);
    }

    setupEnvironment(): void {
        // Blue sky
        this.scene.background = new THREE.Color(0x87CEEB);

        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Add floating stars
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 200; i++) {
            starVertices.push(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
}

export class EarthRainWorld extends BaseWorld {
    private rain!: THREE.Points;
    private rainVelocity: number = -0.2; // Rain falling speed

    constructor() {
        super(-9.8, 0.8, 0.6, 1.279, true);
    }

    setupEnvironment(): void {
        // gray, overcast sky
        this.scene.background = new THREE.Color(0x6E6E6E);

        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F2F }); // Darker green for wet grass
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Dim ambient light for a rainy mood
        const ambientLight = new THREE.AmbientLight(0x555555, 0.5); // Lower intensity, grayish
        this.scene.add(ambientLight);

        // Directional light for soft overcast effect
        const directionalLight = new THREE.DirectionalLight(0xAAAAAA, 0.7);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    

        // ☁️ Add Rain Clouds
        this.createRainClouds();

    }

    private createRainClouds(): void {
        const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A }); // Dark gray for storm clouds

        for (let i = 0; i < 10; i++) { // number of clouds
            const cloud = new THREE.Group();

            for (let j = 0; j < 4; j++) { //puffs per cloud
                const cloudSphere = new THREE.SphereGeometry(
                    Math.random() * 5 + 5, // Cloud puff size (random between 5-10)
                    16, 
                    16
                );
                const cloudMesh = new THREE.Mesh(cloudSphere, cloudMaterial);
                cloudMesh.position.set(j * 6 - 9, Math.random() * 3, 0); // Spread the puffs
                cloud.add(cloudMesh);
            }

            cloud.position.set(
                (Math.random() - 0.5) * 50, // Spread across sky
                30 + Math.random() * 5, // Floating height
                (Math.random() - 0.5) * 50
            );

            this.scene.add(cloud);
        }
    }



    update(): void {
        //tester code
        if (!this.rain) {
            console.error("Rain particles are not initialized!");
            return; // Early exit if rain particles are not initialized
        }
        if (this.rain) {
            const positions = this.rain.geometry.attributes.position.array as Float32Array;

            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += this.rainVelocity; // Move downward

                if (positions[i] < 0) {
                    positions[i] = Math.random() * 50 + 10; // Reset raindrop to the top
                }
            }

            this.rain.geometry.attributes.position.needsUpdate = true;
        }
    }


}


export class MoonWorld extends BaseWorld {
    constructor() {
        super(-1.62, 0.3, 0.2, 0.003, true);
    }

    setupEnvironment(): void {
        this.scene.background = new THREE.Color(0x080808);

        const radius = 1000;
        const moonSurfaceGeometry = new THREE.SphereGeometry(radius, 128, 128);
        const moonSurfaceMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555, // Gray lunar surface
            side: THREE.FrontSide, // Render normally
        });
        const moonSurface = new THREE.Mesh(moonSurfaceGeometry, moonSurfaceMaterial);
        moonSurface.receiveShadow = true;
        moonSurface.position.set(0, -radius, 0); // Move it down so the player is on top
        this.scene.add(moonSurface);

        // Add floating stars
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 200; i++) {
            starVertices.push(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);

        // Dim lighting to increase depth
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        light.castShadow = true;
        this.scene.add(light);
    }
}

export class SpaceWorld extends BaseWorld {
    constructor() {
        super(0, 0, 0, 0, false); // No gravity, no friction, no density
    }

    setupEnvironment(): void {
        this.scene.background = new THREE.Color(0x000000); // Black space

        // 🌠 Add Floating Stars
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 500; i++) { // More stars for a better effect
            starVertices.push(
                (Math.random() - 0.5) * 2000,  // Spread them out more
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);

        // 🌞 Add the Sun (Closer but Smaller)
        const sunSize = 300; // Smaller sun, but closer
        const sunDistance = 5; // Moved closer for visibility

        const sunGeometry = new THREE.SphereGeometry(sunSize, 64, 64);
        const sunMaterial = new THREE.MeshStandardMaterial({
            emissive: new THREE.Color(0x632907), // Bright orange
            emissiveIntensity: 7, // Strong glow effect
            color: 0xff5500, // Base color
        });

        const sun = new THREE.Mesh(sunGeometry, sunMaterial);

        // Position the Sun closer but still far enough
        sun.position.set(sunDistance, 0, -600);
        this.scene.add(sun);

        // 🔆 Add a Bright Light Source for the Sun
        const sunLight = new THREE.PointLight(0xffffff, 3.5, 40000000); // Brighter but reduced range
        sunLight.position.set(sunDistance, 0, -600);
        this.scene.add(sunLight);
    }
}