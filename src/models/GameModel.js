export default class GameModel {
    constructor() {
        this.isPlaying = true;
        this.hasWon = false;
        this.hasLost = false;
        this.isFalling = false;
        this.fallStartTime = 0;
        this.lastCameraPosition = null;
        this.lastCameraLookAt = null;
        this.obstacles = [];
        this.score = 0;
    }

    reset() {
        this.isPlaying = true;
        this.hasWon = false;
        this.hasLost = false;
        this.isFalling = false;
        this.fallStartTime = 0;
        this.lastCameraPosition = null;
        this.lastCameraLookAt = null;
        // Ball position and physics will be reset by the controller
    }

    setWin() {
        this.hasWon = true;
        this.isPlaying = false;
    }

    setLose() {
        this.hasLost = true;
        this.isPlaying = false;
    }

    setFalling() {
        this.isFalling = true;
        this.fallStartTime = performance.now();
    }
} 
