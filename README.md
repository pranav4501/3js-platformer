# 3D Football Soccer Platformer

A fun 3D platformer game where you control a football (soccer ball) through a course of obstacles to reach the goal. Built with Three.js.

## Features

- 3D soccer ball with realistic physics
- Dynamic obstacles with various movement patterns
- Goal detection and celebration effects
- Camera follows the ball with smooth motion
- Out-of-bounds detection
- Simple and intuitive controls

## Project Structure

The project has been organized into a modular structure:

```
src/
├── components/       # Game components
│   ├── CameraController.js
│   ├── EffectsManager.js
│   ├── Football.js
│   ├── FootballField.js
│   ├── Game.js
│   ├── ObstacleSystem.js
│   ├── SoccerGoal.js
│   └── UIManager.js
├── physics/          # Physics systems
│   ├── BallPhysics.js
│   └── CollisionSystem.js
├── utils/            # Utility classes
│   └── GameState.js
└── main.js           # Main entry point
```

## Controls

- Arrow keys or WASD: Move the ball
- Space: Jump

## Development

### Prerequisites

- Node.js (version 14.x or higher recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Running the development server

```
npm run dev
```

This will start a local development server with hot reloading.

### Building for production

```
npm run build
```

## How to Play

1. Control the football using the arrow keys or WASD
2. Navigate through the obstacles without falling off the field
3. Use Space to jump over obstacles when needed
4. Reach the goal at the end of the field to win

## Technology Stack

- Three.js - 3D graphics library
- JavaScript (ES6+)
- Vite - Fast development server and bundler
