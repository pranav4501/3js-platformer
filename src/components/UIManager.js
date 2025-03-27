/**
 * Manages the game UI elements
 */
export default class UIManager {
    constructor(gameState, resetCallback, nextLevelCallback) {
        this.gameState = gameState;
        this.resetCallback = resetCallback; // Store the game reset callback
        this.nextLevelCallback = nextLevelCallback; // Store the next level callback
        this.winScreen = null;
        this.loseScreen = null;
        this.levelInfoScreen = null;
        this.levelCompletedScreen = null;
        this.gameCompletedScreen = null;
        this.levelInfo = { name: "", description: "" };
        
        this.createUI();
    }

    /**
     * Create UI elements
     */
    createUI() {
        // Create div for win message and restart button
        this.winScreen = document.createElement('div');
        this.winScreen.id = 'win-screen';
        this.winScreen.style.position = 'absolute';
        this.winScreen.style.top = '50%';
        this.winScreen.style.left = '50%';
        this.winScreen.style.transform = 'translate(-50%, -50%)';
        this.winScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.winScreen.style.color = 'white';
        this.winScreen.style.padding = '20px';
        this.winScreen.style.borderRadius = '10px';
        this.winScreen.style.textAlign = 'center';
        this.winScreen.style.display = 'none';
        
        // Win message
        const winMessage = document.createElement('h2');
        winMessage.textContent = 'GOAL!!!';
        winMessage.style.color = '#ffff00';
        winMessage.style.marginBottom = '20px';
        
        // Restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.style.padding = '10px 20px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.fontSize = '16px';
        
        restartButton.addEventListener('click', () => {
            this.hideAllScreens();
            // Call the reset callback instead of just resetting gameState
            if (this.resetCallback) {
                this.resetCallback();
            }
        });
        
        this.winScreen.appendChild(winMessage);
        this.winScreen.appendChild(restartButton);
        document.body.appendChild(this.winScreen);
        
        // Create div for lose message and restart button
        this.loseScreen = document.createElement('div');
        this.loseScreen.id = 'lose-screen';
        this.loseScreen.style.position = 'absolute';
        this.loseScreen.style.top = '50%';
        this.loseScreen.style.left = '50%';
        this.loseScreen.style.transform = 'translate(-50%, -50%)';
        this.loseScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.loseScreen.style.color = 'white';
        this.loseScreen.style.padding = '20px';
        this.loseScreen.style.borderRadius = '10px';
        this.loseScreen.style.textAlign = 'center';
        this.loseScreen.style.display = 'none';
        
        // Lose message
        const loseMessage = document.createElement('h2');
        loseMessage.textContent = 'OUT OF BOUNDS!';
        loseMessage.style.color = '#ff4444';
        loseMessage.style.marginBottom = '20px';
        
        // Restart button for lose screen
        const loseRestartButton = document.createElement('button');
        loseRestartButton.textContent = 'Try Again';
        loseRestartButton.style.padding = '10px 20px';
        loseRestartButton.style.backgroundColor = '#4CAF50';
        loseRestartButton.style.color = 'white';
        loseRestartButton.style.border = 'none';
        loseRestartButton.style.borderRadius = '5px';
        loseRestartButton.style.cursor = 'pointer';
        loseRestartButton.style.fontSize = '16px';
        
        loseRestartButton.addEventListener('click', () => {
            this.hideAllScreens();
            // Call the reset callback instead of just resetting gameState
            if (this.resetCallback) {
                this.resetCallback();
            }
        });
        
        this.loseScreen.appendChild(loseMessage);
        this.loseScreen.appendChild(loseRestartButton);
        document.body.appendChild(this.loseScreen);
        
        // Create Level Info Screen
        this.levelInfoScreen = document.createElement('div');
        this.levelInfoScreen.id = 'level-info-screen';
        this.levelInfoScreen.style.position = 'absolute';
        this.levelInfoScreen.style.top = '50%';
        this.levelInfoScreen.style.left = '50%';
        this.levelInfoScreen.style.transform = 'translate(-50%, -50%)';
        this.levelInfoScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.levelInfoScreen.style.color = 'white';
        this.levelInfoScreen.style.padding = '20px';
        this.levelInfoScreen.style.borderRadius = '10px';
        this.levelInfoScreen.style.textAlign = 'center';
        this.levelInfoScreen.style.display = 'none';
        this.levelInfoScreen.style.zIndex = '100';
        
        // Level title
        this.levelTitle = document.createElement('h2');
        this.levelTitle.style.color = '#4CAF50';
        this.levelTitle.style.marginBottom = '10px';
        
        // Level description
        this.levelDescription = document.createElement('p');
        this.levelDescription.style.marginBottom = '20px';
        this.levelDescription.style.fontSize = '16px';
        
        // Start level button
        const startLevelButton = document.createElement('button');
        startLevelButton.textContent = 'Start Level';
        startLevelButton.style.padding = '10px 20px';
        startLevelButton.style.backgroundColor = '#4CAF50';
        startLevelButton.style.color = 'white';
        startLevelButton.style.border = 'none';
        startLevelButton.style.borderRadius = '5px';
        startLevelButton.style.cursor = 'pointer';
        startLevelButton.style.fontSize = '16px';
        
        startLevelButton.addEventListener('click', () => {
            this.hideAllScreens();
            this.gameState.hideLevelInfo();
        });
        
        this.levelInfoScreen.appendChild(this.levelTitle);
        this.levelInfoScreen.appendChild(this.levelDescription);
        this.levelInfoScreen.appendChild(startLevelButton);
        document.body.appendChild(this.levelInfoScreen);
        
        // Create Level Completed Screen
        this.levelCompletedScreen = document.createElement('div');
        this.levelCompletedScreen.id = 'level-completed-screen';
        this.levelCompletedScreen.style.position = 'absolute';
        this.levelCompletedScreen.style.top = '50%';
        this.levelCompletedScreen.style.left = '50%';
        this.levelCompletedScreen.style.transform = 'translate(-50%, -50%)';
        this.levelCompletedScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.levelCompletedScreen.style.color = 'white';
        this.levelCompletedScreen.style.padding = '20px';
        this.levelCompletedScreen.style.borderRadius = '10px';
        this.levelCompletedScreen.style.textAlign = 'center';
        this.levelCompletedScreen.style.display = 'none';
        
        // Level completed message
        const levelCompletedMessage = document.createElement('h2');
        levelCompletedMessage.textContent = 'Level Completed!';
        levelCompletedMessage.style.color = '#ffff00';
        levelCompletedMessage.style.marginBottom = '20px';
        
        // Next level button
        const nextLevelButton = document.createElement('button');
        nextLevelButton.textContent = 'Next Level';
        nextLevelButton.style.padding = '10px 20px';
        nextLevelButton.style.backgroundColor = '#4CAF50';
        nextLevelButton.style.color = 'white';
        nextLevelButton.style.border = 'none';
        nextLevelButton.style.borderRadius = '5px';
        nextLevelButton.style.cursor = 'pointer';
        nextLevelButton.style.fontSize = '16px';
        nextLevelButton.style.marginRight = '10px';
        
        nextLevelButton.addEventListener('click', () => {
            this.hideAllScreens();
            // Call the next level callback
            if (this.nextLevelCallback) {
                this.nextLevelCallback();
            }
        });
        
        // Restart level button for level completed screen
        const restartLevelButton = document.createElement('button');
        restartLevelButton.textContent = 'Replay Level';
        restartLevelButton.style.padding = '10px 20px';
        restartLevelButton.style.backgroundColor = '#2196F3';
        restartLevelButton.style.color = 'white';
        restartLevelButton.style.border = 'none';
        restartLevelButton.style.borderRadius = '5px';
        restartLevelButton.style.cursor = 'pointer';
        restartLevelButton.style.fontSize = '16px';
        
        restartLevelButton.addEventListener('click', () => {
            this.hideAllScreens();
            if (this.resetCallback) {
                this.resetCallback();
            }
        });
        
        this.levelCompletedScreen.appendChild(levelCompletedMessage);
        this.levelCompletedScreen.appendChild(nextLevelButton);
        this.levelCompletedScreen.appendChild(restartLevelButton);
        document.body.appendChild(this.levelCompletedScreen);
        
        // Create Game Completed Screen
        this.gameCompletedScreen = document.createElement('div');
        this.gameCompletedScreen.id = 'game-completed-screen';
        this.gameCompletedScreen.style.position = 'absolute';
        this.gameCompletedScreen.style.top = '50%';
        this.gameCompletedScreen.style.left = '50%';
        this.gameCompletedScreen.style.transform = 'translate(-50%, -50%)';
        this.gameCompletedScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.gameCompletedScreen.style.color = 'white';
        this.gameCompletedScreen.style.padding = '20px';
        this.gameCompletedScreen.style.borderRadius = '10px';
        this.gameCompletedScreen.style.textAlign = 'center';
        this.gameCompletedScreen.style.display = 'none';
        
        // Game completed message
        const gameCompletedMessage = document.createElement('h2');
        gameCompletedMessage.textContent = 'Congratulations! You completed all levels!';
        gameCompletedMessage.style.color = '#ffff00';
        gameCompletedMessage.style.marginBottom = '20px';
        
        // Restart game button
        const restartGameButton = document.createElement('button');
        restartGameButton.textContent = 'Play Again from Start';
        restartGameButton.style.padding = '10px 20px';
        restartGameButton.style.backgroundColor = '#4CAF50';
        restartGameButton.style.color = 'white';
        restartGameButton.style.border = 'none';
        restartGameButton.style.borderRadius = '5px';
        restartGameButton.style.cursor = 'pointer';
        restartGameButton.style.fontSize = '16px';
        
        restartGameButton.addEventListener('click', () => {
            this.hideAllScreens();
            // Reset to first level and restart
            this.gameState.setCurrentLevel(0);
            if (this.resetCallback) {
                this.resetCallback();
            }
        });
        
        this.gameCompletedScreen.appendChild(gameCompletedMessage);
        this.gameCompletedScreen.appendChild(restartGameButton);
        document.body.appendChild(this.gameCompletedScreen);
    }

    /**
     * Show the win screen
     */
    showWinScreen() {
        this.winScreen.style.display = 'block';
    }

    /**
     * Show the lose screen
     */
    showLoseScreen() {
        this.loseScreen.style.display = 'block';
    }
    
    /**
     * Show the level info screen
     */
    showLevelInfoScreen(levelName, levelDescription) {
        this.levelTitle.textContent = levelName;
        this.levelDescription.textContent = levelDescription;
        this.levelInfoScreen.style.display = 'block';
    }
    
    /**
     * Show the level completed screen
     */
    showLevelCompletedScreen() {
        this.levelCompletedScreen.style.display = 'block';
    }
    
    /**
     * Show the game completed screen
     */
    showGameCompletedScreen() {
        this.gameCompletedScreen.style.display = 'block';
    }

    /**
     * Hide all UI screens
     */
    hideAllScreens() {
        this.winScreen.style.display = 'none';
        this.loseScreen.style.display = 'none';
        this.levelInfoScreen.style.display = 'none';
        this.levelCompletedScreen.style.display = 'none';
        this.gameCompletedScreen.style.display = 'none';
    }

    /**
     * Update UI based on game state
     */
    update(levelSystem) {
        // Handle level info display
        if (this.gameState.showLevelInfo && levelSystem) {
            this.showLevelInfoScreen(
                levelSystem.getCurrentLevelName(),
                levelSystem.getCurrentLevelDescription()
            );
        }
        
        // Handle win/loss screens
        if (this.gameState.hasWon) {
            if (levelSystem && levelSystem.getCurrentLevelIndex() >= levelSystem.getTotalLevels() - 1) {
                // Last level completed
                this.showGameCompletedScreen();
            } else {
                // Normal level completion
                this.showLevelCompletedScreen();
            }
        } else if (this.gameState.hasLost) {
            this.showLoseScreen();
        }
    }

    /**
     * Set a new reset callback function
     */
    setResetCallback(callback) {
        this.resetCallback = callback;
    }
    
    /**
     * Set a new next level callback function
     */
    setNextLevelCallback(callback) {
        this.nextLevelCallback = callback;
    }
} 
