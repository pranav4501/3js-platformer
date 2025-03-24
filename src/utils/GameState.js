/**
 * Manages the current state of the game
 */
export default class GameState {
    constructor() {
        this.isPlaying = true;
        this.hasWon = false;
        this.hasLost = false;
        this.isFalling = false;
        this.fallStartTime = 0;
        this.lastCameraPosition = null; // Store camera position when game ends
        this.lastCameraLookAt = null;   // Store look target when game ends
        this.obstacles = [];
    }

    reset() {
        this.isPlaying = true;
        this.hasWon = false;
        this.hasLost = false;
        this.isFalling = false;
        this.fallStartTime = 0;
        this.lastCameraPosition = null;
        this.lastCameraLookAt = null;
    }

    startFalling() {
        this.isFalling = true;
        this.fallStartTime = Date.now();
    }

    gameWon() {
        this.hasWon = true;
        this.isPlaying = false;
    }

    gameLost() {
        this.hasLost = true;
        this.isPlaying = false;
        this.isFalling = false;
    }

    setObstacles(obstacles) {
        this.obstacles = obstacles;
    }
} 
