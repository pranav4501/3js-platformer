/**
 * Manages the current state of the game
 */
export default class GameState {
    constructor() {
        this.isPlaying = false;
        this.hasWon = false;
        this.hasLost = false;
        this.isFalling = false;
        this.fallStartTime = 0;
        this.lastCameraPosition = null; // Store camera position when game ends
        this.lastCameraLookAt = null;   // Store look target when game ends
        this.obstacles = [];
        this.goalSoundPlayed = false;
        this.currentLevel = 0;
        this.levelCompleted = false;
        this.gameCompleted = false;
        this.showLevelInfo = true;
        this.gameStarted = false;
        this.isPaused = false;
    }

    reset() {
        this.isPlaying = this.gameStarted && !this.isPaused;
        this.hasWon = false;
        this.hasLost = false;
        this.isFalling = false;
        this.fallStartTime = 0;
        this.lastCameraPosition = null;
        this.lastCameraLookAt = null;
        this.goalSoundPlayed = false;
        this.levelCompleted = false;
        this.showLevelInfo = true;
    }

    startGame() {
        this.gameStarted = true;
        this.isPlaying = !this.isPaused;
    }

    pauseGame() {
        if (this.gameStarted && !this.hasWon && !this.hasLost) {
            this.isPaused = true;
            this.isPlaying = false;
        }
    }

    resumeGame() {
        if (this.gameStarted && !this.hasWon && !this.hasLost) {
            this.isPaused = false;
            this.isPlaying = true;
        }
    }

    togglePause() {
        if (this.gameStarted && !this.hasWon && !this.hasLost) {
            this.isPaused = !this.isPaused;
            this.isPlaying = !this.isPaused;
        }
    }

    startFalling() {
        this.isFalling = true;
        this.fallStartTime = Date.now();
    }

    gameWon() {
        this.hasWon = true;
        this.isPlaying = false;
        this.levelCompleted = true;
    }

    gameLost() {
        this.hasLost = true;
        this.isPlaying = false;
        this.isFalling = false;
    }

    setObstacles(obstacles) {
        this.obstacles = obstacles;
    }
    
    setCurrentLevel(level) {
        this.currentLevel = level;
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    levelComplete() {
        this.levelCompleted = true;
    }
    
    nextLevel() {
        this.currentLevel++;
        this.reset();
    }
    
    completeGame() {
        this.gameCompleted = true;
    }
    
    hideLevelInfo() {
        this.showLevelInfo = false;
        this.isPlaying = this.gameStarted && !this.isPaused;
    }
} 
