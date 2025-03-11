import { GameWorld } from './three/GameWorld.ts';

const testWorld = new GameWorld();
(window as any).testWorld = testWorld;
