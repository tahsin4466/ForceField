# Force Field
Force Field is an interactive physics simulation engine with an attached sandbox demo world. This project was created for COM SCI 174A.
This project uses TypeScript and 3JS to create an interactive 3D physics engine and sandbox. More details about the project can be found [here](https://docs.google.com/presentation/d/1ochjH4kHCyXbQppHyPApBGoxhdAlcpV6OEpol8QRvJ8/edit?usp=sharing)

## Installation and Usage
First ensure you have the latest version of Node.js installed on your computer from the official website. To confirm you can run:
```node.js
node -v
```

Next, clone the project onto your local machine. Enter the directory and install all dependencies using:
```node.js
npm install
```

You can then start the project with:
```node.js
npm run dev
```
This will bring up a WebGL window on localhost, the details of which will be printed to the terminal.

## Usage as a Standalone Engine
If you wish to use ForceField in your own 3JS project, simply copy the contents found in `physics` and all the dependencies in package.json.
For details on how to assign 3JS meshes with RigidBody objects, feel free to consult the codebase: particularly `three/Objects.ts`, `three/Worlds.ts` and `three/GameWorld.ts`.