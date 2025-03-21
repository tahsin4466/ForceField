import * as THREE from 'three';

export abstract class BaseWorld {
    gravity: number;
    floorFrictionStatic: number;
    floorFrictionKinetic: number;
    density: number;
    wind: { x: number; y: number, z: number };
    scene: THREE.Scene;
    hasFloor: boolean;

    constructor(
        gravity: number,
        floorFrictionStatic: number,
        floorFrictionKinetic: number,
        density: number,
        wind: { x: number; y: number, z: number },
        hasFloor: boolean,
    ) {
        this.gravity = gravity;
        this.floorFrictionStatic = floorFrictionStatic;
        this.floorFrictionKinetic = floorFrictionKinetic;
        this.density = density;
        this.wind = wind;
        this.hasFloor = hasFloor;
        this.scene = new THREE.Scene();

        this.setupEnvironment();
    }

    abstract setupEnvironment(): void;
}

export class EarthClearWorld extends BaseWorld {
    constructor() {
        super(-9.8, 0.6, 0.4, 1.279, {x: 0, y: 0, z: 0}, true);
    }

    setupEnvironment(): void {
        // Blue sky
        this.scene.background = new THREE.Color(0x87CEEB);

        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        //floating stars
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
        const starMaterial = new THREE.PointsMaterial({ color: 0x999999 });
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
}

export class EarthRainWorld extends BaseWorld {
    constructor() {
        super(-9.8, 0.5, 0.3, 1.279, {x: 2, y: 0, z: 3}, true);
    }

    setupEnvironment(): void {
        //gray overcast sky
        this.scene.background = new THREE.Color(0x6E6E6E);

        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F2F }); // Darker green for wet grass
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        //Dim ambient light
        const ambientLight = new THREE.AmbientLight(0x555555, 0.5); // Lower intensity, grayish
        this.scene.add(ambientLight);

        //fog
        this.scene.fog = new THREE.FogExp2(0x666666, 0.06);

        //Directional light for soft overcast
        const directionalLight = new THREE.DirectionalLight(0xAAAAAA, 0.7);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        //Add Rain Clouds
        this.createRainClouds();

    }

    private createRainClouds(): void {
        const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A }); // Dark gray

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



}


export class MoonWorld extends BaseWorld {
    constructor() {
        super(-1.62, 0.3, 0.2, 0.003, {x: 0, y: 0, z: 0}, true);
    }

    setupEnvironment(): void {
        this.scene.background = new THREE.Color(0x080808);

        const radius = 1000;
        const moonSurfaceGeometry = new THREE.SphereGeometry(radius, 128, 128);
        const moonSurfaceMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            side: THREE.FrontSide,
        });
        const moonSurface = new THREE.Mesh(moonSurfaceGeometry, moonSurfaceMaterial);
        moonSurface.receiveShadow = true;
        moonSurface.position.set(0, -radius, 0);
        this.scene.add(moonSurface);

        //Add floating stars
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

        //Dim lighting to increase depth
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        light.castShadow = true;
        this.scene.add(light);
    }
}

export class SpaceWorld extends BaseWorld {
    constructor() {
        super(0, 0, 0, 0.01, {x: 0, y: 0, z: 0}, false);
    }

    setupEnvironment(): void {
        this.scene.background = new THREE.Color(0x000000); // Black space

        // Add Floating Stars
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 500; i++) {
            starVertices.push(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);

        // Add the Sun
        const sunSize = 300;
        const sunDistance = 5;

        const sunGeometry = new THREE.SphereGeometry(sunSize, 64, 64);
        const sunMaterial = new THREE.MeshStandardMaterial({
            emissive: new THREE.Color(0x632907), // Bright orange
            emissiveIntensity: 15, // Strong glow effect
            color: 0xff5500, // Base color
        });

        const sun = new THREE.Mesh(sunGeometry, sunMaterial);

        sun.position.set(sunDistance, 0, -600);
        this.scene.add(sun);

        const sunLight = new THREE.PointLight(0xffffff, 3.5, 40000000);
        sunLight.position.set(sunDistance, 0, -600);
        this.scene.add(sunLight);
    }
}