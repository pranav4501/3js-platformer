/**
 * Manages the game UI elements
 */
export default class UIManager {
    constructor(gameState, resetCallback) {
        this.gameState = gameState;
        this.resetCallback = resetCallback; // Store the game reset callback
        this.winScreen = null;
        this.loseScreen = null;
        
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
     * Hide all UI screens
     */
    hideAllScreens() {
        this.winScreen.style.display = 'none';
        this.loseScreen.style.display = 'none';
    }

    /**
     * Update UI based on game state
     */
    update() {
        if (this.gameState.hasWon) {
            this.showWinScreen();
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
} 
