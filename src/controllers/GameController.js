import InputController from './InputController.js';
import PhysicsController from './PhysicsController.js';

export default class GameController {
    constructor(gameModel, ballModel, obstacleModels, fieldModel, sceneView, ballView, obstacleView, fieldView, uiView) {
        // Store model references
        this.gameModel = gameModel;
        this.ballModel = ballModel;
        this.obstacleModels = obstacleModels;
        this.fieldModel = fieldModel;
        
        // Store view references
        this.sceneView = sceneView;
        this.ballView = ballView;
        this.obstacleView = obstacleView;
        this.fieldView = fieldView;
        this.uiView = uiView;
        
        // Create sub-controllers
        this.inputController = new InputController(this);
        this.physicsController = new PhysicsController(this);
        
        // Set up animation loop
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        
        // Add restart event listener
        this.uiView.addRestartListener(this.restartGame.bind(this));
    }
    
    init() {
        // Initialize the game
        this.inputController.init();
        
        // Start the animation loop
        this.animate();
    }
    
    animate(currentTime = 0) {
        // Request next frame
        requestAnimationFrame(this.animate);
        
        // Calculate time difference for physics
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap to 100ms
        this.lastTime = currentTime;
        
        // Skip updates if game is not playing
        if (!this.gameModel.isPlaying) {
            // Just render the scene
            this.sceneView.render();
            return;
        }
        
        // Update obstacle positions
        this.updateObstacles(deltaTime);
        
        // Update ball physics
        this.physicsController.updateBallPhysics(deltaTime);
        
        // Update ball view with new position
        this.ballView.update(this.ballModel.position, {
            x: this.ballModel.velocity.x * 0.01,
            y: this.ballModel.velocity.z * 0.01,
            z: -this.ballModel.velocity.x * 0.01
        });
        
        // Update camera
        this.sceneView.updateCamera(this.ballModel.position, deltaTime);
        
        // Check for collisions
        this.physicsController.checkCollisions();
        
        // Check for goal
        this.checkGoal();
        
        // Check for out of bounds
        this.checkOutOfBounds();
        
        // Animate goal net
        this.fieldView.animateNet(currentTime / 1000);
        
        // Update particle effects
        this.ballView.updateParticles(deltaTime);
        
        // Render the scene
        this.sceneView.render();
    }
    
    updateObstacles(deltaTime) {
        // Update obstacle models
        this.obstacleModels.forEach(obstacle => {
            obstacle.update(deltaTime);
        });
        
        // Update obstacle views
        this.obstacleView.updateObstacles(this.obstacleModels);
    }
    
    checkGoal() {
        // Get goal position from field model
        const goalPosition = this.fieldModel.goalPosition;
        
        // Check if ball is in goal area
        if (
            Math.abs(this.ballModel.position.x - goalPosition.x) < this.fieldModel.goalWidth / 2 &&
            this.ballModel.position.y < goalPosition.y &&
            Math.abs(this.ballModel.position.z - goalPosition.z) < 2 // Small tolerance
        ) {
            // Ball is in goal!
            this.gameWon();
        }
    }
    
    gameWon() {
        if (this.gameModel.hasWon) return; // Already won
        
        // Update game model
        this.gameModel.setWin();
        this.gameModel.score++;
        
        // Update UI
        this.uiView.updateScore(this.gameModel.score);
        this.uiView.showWinScreen();
        
        // Store camera position for win celebration
        this.gameModel.lastCameraPosition = this.sceneView.camera.position.clone();
        this.gameModel.lastCameraLookAt = this.sceneView.cameraTarget.clone();
        
        // Move camera to celebration view
        const celebrationPosition = new THREE.Vector3(
            0, 
            5, 
            this.fieldModel.goalPosition.z - 5
        );
        this.sceneView.setCameraEndPosition(celebrationPosition, this.fieldModel.goalPosition);
        
        // Celebrate!
        this.sceneView.shakeCamera(0.5);
    }
    
    checkOutOfBounds() {
        // Check if ball is out of bounds
        if (this.fieldModel.isOutOfBounds(this.ballModel.position)) {
            // Check if ball is falling
            if (!this.gameModel.isFalling) {
                this.gameModel.setFalling();
            }
            
            // Check if ball has been falling for a while
            const fallingTime = (performance.now() - this.gameModel.fallStartTime) / 1000;
            if (fallingTime > 2) {
                this.gameLost();
            }
        }
    }
    
    gameLost() {
        if (this.gameModel.hasLost) return; // Already lost
        
        // Update game model
        this.gameModel.setLose();
        
        // Update UI
        this.uiView.showLoseScreen();
    }
    
    restartGame() {
        // Reset all models
        this.gameModel.reset();
        this.ballModel.reset();
        
        // Reset views
        this.uiView.hideAllScreens();
        
        // Resume game
        this.gameModel.isPlaying = true;
    }
} 
