import Game from './components/Game.js';
import HomeScreen from './components/HomeScreen.js';

// First show the home screen
const homeScreen = new HomeScreen(() => {
    // This callback will be called when the Play button is clicked
    // Initialize the game after hiding the home screen
    const game = new Game();
}); 

