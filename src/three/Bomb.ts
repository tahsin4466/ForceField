import * as THREE from 'three';

export class Bomb {
    mesh: THREE.Mesh;
    big: boolean;
    position: THREE.Vector3;

    constructor(position: THREE.Vector3, big: boolean, scene: THREE.Scene) {
        this.big = big;
        this.position = position.clone();
        const size = big ? 1.2 : 0.35;

        // Create bomb mesh (black sphere)
        const bombGeometry = new THREE.SphereGeometry(size / 2, 16, 16);
        const bombMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        this.mesh = new THREE.Mesh(bombGeometry, bombMaterial);
        this.mesh.castShadow = true;
        this.mesh.position.set(position.x, position.y, position.z);
        scene.add(this.mesh);
    }

    detonate(scene: THREE.Scene, onDetonate: (position: THREE.Vector3, forceMagnitude: number, radius: number, color: number) => void) {
        // More realistic explosion values
        const explosionForce = this.big ? 15000 : 3000;
        const explosionRadius = this.big ? 30 : 10;
        const explosionColor = this.big ? 0xffa500 : 0xff4444;

        //Explosion logic in game woreld
        onDetonate(this.position, explosionForce, explosionRadius, explosionColor);

        //Remove bomb
        scene.remove(this.mesh);
    }
}
