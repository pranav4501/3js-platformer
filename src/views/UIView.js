export default class UIView {
    constructor() {
        this.uiElements = {};
        this.createUI();
    }
    
    createUI() {
        // Create win screen
        const winScreen = document.createElement('div');
        winScreen.id = 'win-screen';
        winScreen.style.position = 'absolute';
        winScreen.style.top = '0';
        winScreen.style.left = '0';
        winScreen.style.width = '100%';
        winScreen.style.height = '100%';
        winScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        winScreen.style.display = 'none';
        winScreen.style.flexDirection = 'column';
        winScreen.style.justifyContent = 'center';
        winScreen.style.alignItems = 'center';
        winScreen.style.color = 'white';
        winScreen.style.fontSize = '2em';
        winScreen.style.fontFamily = 'Arial, sans-serif';
        winScreen.style.zIndex = '1000';
        
        const winTitle = document.createElement('h1');
        winTitle.textContent = 'GOAL!!!';
        winTitle.style.marginBottom = '20px';
        winTitle.style.fontSize = '3em';
        winTitle.style.color = '#ffd700';
        winScreen.appendChild(winTitle);
        
        const winMessage = document.createElement('p');
        winMessage.textContent = 'You scored!';
        winMessage.style.marginBottom = '40px';
        winScreen.appendChild(winMessage);
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '1em';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.cursor = 'pointer';
        restartButton.id = 'restart-button';
        winScreen.appendChild(restartButton);
        
        document.body.appendChild(winScreen);
        this.uiElements.winScreen = winScreen;
        
        // Create lose screen
        const loseScreen = document.createElement('div');
        loseScreen.id = 'lose-screen';
        loseScreen.style.position = 'absolute';
        loseScreen.style.top = '0';
        loseScreen.style.left = '0';
        loseScreen.style.width = '100%';
        loseScreen.style.height = '100%';
        loseScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loseScreen.style.display = 'none';
        loseScreen.style.flexDirection = 'column';
        loseScreen.style.justifyContent = 'center';
        loseScreen.style.alignItems = 'center';
        loseScreen.style.color = 'white';
        loseScreen.style.fontSize = '2em';
        loseScreen.style.fontFamily = 'Arial, sans-serif';
        loseScreen.style.zIndex = '1000';
        
        const loseTitle = document.createElement('h1');
        loseTitle.textContent = 'Out of Bounds!';
        loseTitle.style.marginBottom = '20px';
        loseTitle.style.fontSize = '3em';
        loseTitle.style.color = '#ff4444';
        loseScreen.appendChild(loseTitle);
        
        const loseMessage = document.createElement('p');
        loseMessage.textContent = 'Try again!';
        loseMessage.style.marginBottom = '40px';
        loseScreen.appendChild(loseMessage);
        
        const loseRestartButton = document.createElement('button');
        loseRestartButton.textContent = 'Try Again';
        loseRestartButton.style.padding = '10px 20px';
        loseRestartButton.style.fontSize = '1em';
        loseRestartButton.style.backgroundColor = '#f44336';
        loseRestartButton.style.color = 'white';
        loseRestartButton.style.border = 'none';
        loseRestartButton.style.borderRadius = '5px';
        loseRestartButton.style.cursor = 'pointer';
        loseRestartButton.id = 'lose-restart-button';
        loseScreen.appendChild(loseRestartButton);
        
        document.body.appendChild(loseScreen);
        this.uiElements.loseScreen = loseScreen;
        
        // Create score display
        const scoreContainer = document.createElement('div');
        scoreContainer.id = 'score-container';
        scoreContainer.style.position = 'absolute';
        scoreContainer.style.top = '20px';
        scoreContainer.style.right = '20px';
        scoreContainer.style.padding = '10px 20px';
        scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        scoreContainer.style.color = 'white';
        scoreContainer.style.fontSize = '1.5em';
        scoreContainer.style.fontFamily = 'Arial, sans-serif';
        scoreContainer.style.borderRadius = '5px';
        
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.textContent = 'Score: 0';
        scoreContainer.appendChild(scoreDisplay);
        
        document.body.appendChild(scoreContainer);
        this.uiElements.scoreDisplay = scoreDisplay;
    }
    
    showWinScreen() {
        this.uiElements.winScreen.style.display = 'flex';
    }
    
    showLoseScreen() {
        this.uiElements.loseScreen.style.display = 'flex';
    }
    
    hideAllScreens() {
        this.uiElements.winScreen.style.display = 'none';
        this.uiElements.loseScreen.style.display = 'none';
    }
    
    updateScore(score) {
        this.uiElements.scoreDisplay.textContent = `Score: ${score}`;
    }
    
    addRestartListener(callback) {
        document.getElementById('restart-button').addEventListener('click', callback);
        document.getElementById('lose-restart-button').addEventListener('click', callback);
    }
} 
