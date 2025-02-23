import * as THREE from 'three';

export class Bomb {
    mesh: THREE.Mesh;
    big: boolean;
    position: THREE.Vector3;

    constructor(position: THREE.Vector3, big: boolean, scene: THREE.Scene) {
        this.big = big;
        this.position = position.clone();
        const size = big ? 1.2 : 0.35; // Slightly larger for realism

        // Create bomb mesh (black sphere)
        const bombGeometry = new THREE.SphereGeometry(size / 2, 16, 16);
        const bombMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        this.mesh = new THREE.Mesh(bombGeometry, bombMaterial);
        this.mesh.castShadow = true;
        this.mesh.position.set(position.x, position.y, position.z);
        scene.add(this.mesh);
    }

    /**
     * Detonates this bomb by triggering an explosion force.
     */
    detonate(scene: THREE.Scene, onDetonate: (position: THREE.Vector3, forceMagnitude: number, radius: number, color: number) => void) {
        // More realistic explosion values
        const explosionForce = this.big ? 4000 : 1250; // Larger explosions have more force
        const explosionRadius = this.big ? 13 : 4; // Bigger bombs affect a wider area
        const explosionColor = this.big ? 0xffa500 : 0xff4444; // More intense red-orange for large explosions

        // Delegate explosion logic to `TestWorld`
        onDetonate(this.position, explosionForce, explosionRadius, explosionColor);

        // Remove bomb from scene
        scene.remove(this.mesh);
    }
}
