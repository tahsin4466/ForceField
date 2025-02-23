import * as THREE from 'three';

export class Bomb {
    mesh: THREE.Mesh;
    big: boolean;
    position: THREE.Vector3;

    constructor(position: THREE.Vector3, big: boolean, scene: THREE.Scene) {
        this.big = big;
        this.position = position.clone();
        const size = big ? 1 : 0.25;

        // Create bomb mesh (black cube)
        const bombGeometry = new THREE.BoxGeometry(size, size, size);
        const bombMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        this.mesh = new THREE.Mesh(bombGeometry, bombMaterial);
        this.mesh.castShadow = true;
        this.mesh.position.set(position.x, position.y, position.z);
        scene.add(this.mesh);
    }

    /**
     * Detonates this bomb by triggering an explosion force.
     */
    detonate(scene: THREE.Scene, onDetonate: (position: THREE.Vector3, forceMagnitude: number, radius: number, color: number) => void) {
        const explosionForce = this.big ? 5000 : 1000; // Newtons
        const explosionRadius = this.big ? 20 : 5; // Meters
        const explosionColor = this.big ? 0xffa500 : 0xff0000;

        // Delegate explosion logic to `TestWorld`
        onDetonate(this.position, explosionForce, explosionRadius, explosionColor);

        // Remove bomb from scene
        scene.remove(this.mesh);
    }
}