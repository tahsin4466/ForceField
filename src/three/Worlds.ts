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
        this.scene.background = new THREE.Color(0x87CEEB);
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