import { GameWorld } from './three/GameWorld.ts';

function loadGameWorld(worldNumber: number) {
    (window as any).testWorld = new GameWorld(worldNumber);
}

// Wait for user input (1-5)
window.addEventListener("keydown", (event) => {
    if (event.key >= "1" && event.key <= "5") {
        loadGameWorld(parseInt(event.key)); // Convert key to number
    }
});
