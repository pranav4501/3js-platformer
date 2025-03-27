import * as THREE from 'three';
import GameState from '../utils/GameState.js';
import BallPhysics from '../physics/BallPhysics.js';
import CollisionSystem from '../physics/CollisionSystem.js';
import Football from './Football.js';
import SoccerGoal from './SoccerGoal.js';
import ObstacleSystem from './ObstacleSystem.js';
import FootballField from './FootballField.js';
import UIManager from './UIManager.js';
import EffectsManager from './EffectsManager.js';
import CameraController from './CameraController.js';
import StadiumWalls from './StadiumWalls.js';
import Scoreboard from './Scoreboard.js';
import SoundManager from './SoundManager.js';
import TouchControls from './TouchControls.js';
import CloudSystem from './CloudSystem.js';
import LevelSystem from './LevelSystem.js';

/**
 * Main game class that coordinates all game systems
 */
export default class Game {
    constructor() {
        // Initialize game state
        this.gameState = new GameState();
        
        // Initialize Three.js components
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Setup keyboard input
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false,
            KeyW: false,
            KeyS: false,
            KeyA: false,
            KeyD: false,
            KeyP: false
        };
        
        // Game properties
        this.gameProperties = {
            forwardAcceleration: 40.0,   // Acceleration for forward movement
            backwardAcceleration: 20.0,  // Acceleration for backward movement
            lateralAcceleration: 35.0,   // Acceleration for side-to-side movement
            obstacleRepulsionForce: 20.0, // Force for obstacle collisions
            jumpForce: 7.4,             // Force applied when jumping
            jumpCooldown: 0.3           // Time in seconds before player can jump again
        };
        
        // Jump cooldown timer
        this.jumpCooldownTimer = 0;
        
        // Sound cooldown for frequent sounds
        this.soundCooldowns = {
            bounce: 0,
            collision: 0,
            roll: 0
        };
        
        // Initialize physics and components
        this.initializeComponents();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start the animation loop
        this.lastTime = 0;
        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Initialize game components
     */
    initializeComponents() {
        // Add lighting
        this.setupLighting();
        
        // Create field
        this.field = new FootballField();
        this.scene.add(this.field.getFloorGroup());
        
        // Create football
        this.football = new Football();
        this.scene.add(this.football.getMesh());
        
        // Create goal
        this.goal = new SoccerGoal();
        this.scene.add(this.goal.getGroup());
        
        // Create stadium walls
        this.stadiumWalls = new StadiumWalls(this.scene, this.field.getProperties());
        
        // Create scoreboard
        this.scoreboard = new Scoreboard(this.scene);
        this.scoreboard.create(
            this.field.getProperties().position,
            this.field.getProperties().width,
            this.field.getProperties().length,
            2 // buffer
        );
        
        // Create level system
        this.levelSystem = new LevelSystem(this.scene);
        const obstacles = this.levelSystem.loadCurrentLevel();
        this.gameState.setObstacles(obstacles);
        
        // Create physics system
        this.ballPhysics = new BallPhysics();
        
        // Create collision system
        this.collisionSystem = new CollisionSystem(this.scene);
        
        // Create UI manager with callbacks
        this.uiManager = new UIManager(
            this.gameState,
            this.reset.bind(this),
            this.nextLevel.bind(this)
        );
        
        // Create effects manager
        this.effectsManager = new EffectsManager(this.scene);
        
        // Create camera controller
        this.cameraController = new CameraController(this.camera);
        this.cameraController.setTarget(this.football.getMesh());
        
        // Create sound manager
        this.soundManager = new SoundManager(this.camera);
        
        // Create touch controls for mobile devices
        this.touchControls = new TouchControls(this.handleTouchJump.bind(this), this.camera);
        
        // Create cloud system
        this.cloudSystem = new CloudSystem(this.scene);
        
        // Simulate touch inputs by updating keyboard inputs
        if (this.touchControls && this.touchControls.isActive()) {
            this.setupTouchKeyboardEmulation();
        }
        
        // Set collision callback for sounds
        this.collisionSystem.setCollisionCallback(this.handleCollisionSound.bind(this));
        
        // Set collision callback for ball physics
        this.ballPhysics.setCollisionCallback(this.handleCollisionSound.bind(this));
        
        // Position the ball based on level
        this.resetBallPosition();
    }
    
    /**
     * Handle collision sound effects
     */
    handleCollisionSound(collisionType, position, velocity) {
        const currentTime = Date.now();
        
        switch(collisionType) {
            case 'obstacle':
                // Play collision sound with at least 100ms between sounds
                if (currentTime - this.soundCooldowns.collision > 100) {
                    this.soundManager.playAt('collision', position, 0.8);
                    this.soundCooldowns.collision = currentTime;
                }
                break;
                
            case 'ground':
                // Play bounce sound based on velocity - consistent volume
                if (velocity > 1.5 && currentTime - this.soundCooldowns.bounce > 200) {
                    // Use a fixed volume for consistent bounce sounds
                    this.soundManager.play('bounce', 0.8); 
                    this.soundCooldowns.bounce = currentTime;
                }
                break;
                
            case 'wall':
                // Play bounce sound with consistent volume for walls
                if (velocity > 1 && currentTime - this.soundCooldowns.bounce > 150) {
                    this.soundManager.play('bounce', 0.7);
                    this.soundCooldowns.bounce = currentTime;
                }
                break;
                
            case 'goal_frame':
                // Play special goal post sound - fixed volume
                this.soundManager.play('kick', 0.6);
                break;
        }
    }

    /**
     * Setup touch input to emulate keyboard inputs
     */
    setupTouchKeyboardEmulation() {
        // Update our keys object based on touch controls 60 times per second
        this.touchInputInterval = setInterval(() => {
            if (!this.touchControls || !this.gameState.isPlaying) return;
            
            const touchDirection = this.touchControls.getMovementDirection();
            
            // Reset movement keys
            this.keys.ArrowUp = false;
            this.keys.ArrowDown = false;
            this.keys.ArrowLeft = false;
            this.keys.ArrowRight = false;
            this.keys.KeyW = false;
            this.keys.KeyS = false;
            this.keys.KeyA = false;
            this.keys.KeyD = false;
            
            // Set keys based on touch direction
            if (touchDirection.z < -0.2) {
                this.keys.ArrowUp = true;
                this.keys.KeyW = true;
            } else if (touchDirection.z > 0.2) {
                this.keys.ArrowDown = true;
                this.keys.KeyS = true;
            }
            
            if (touchDirection.x < -0.2) {
                this.keys.ArrowLeft = true;
                this.keys.KeyA = true;
            } else if (touchDirection.x > 0.2) {
                this.keys.ArrowRight = true;
                this.keys.KeyD = true;
            }
        }, 16); // ~60fps
    }

    /**
     * Setup scene lighting
     */
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle keyboard input
        window.addEventListener('keydown', (e) => {
            if (this.keys[e.code] !== undefined) {
                this.keys[e.code] = true;
            }
            
            // Handle pause key (P or Escape)
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.gameState.gameStarted && !this.gameState.hasWon && !this.gameState.hasLost) {
                    this.gameState.togglePause();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.keys[e.code] !== undefined) {
                this.keys[e.code] = false;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Update touch controls if active
            if (this.touchControls) {
                this.touchControls.resize();
            }
        });
    }

    /**
     * Handle jumping input from touch controls
     */
    handleTouchJump() {
        if (this.gameState.isPlaying && this.ballPhysics.onGround && this.jumpCooldownTimer <= 0) {
            // Simulate pressing space key
            this.keys.Space = true;
            
            // Reset after a short delay to simulate a key press
            setTimeout(() => {
                this.keys.Space = false;
            }, 100);
        }
    }

    /**
     * Handle jumping input
     */
    handleJump(deltaTime) {
        // Update jump cooldown timer
        if (this.jumpCooldownTimer > 0) {
            this.jumpCooldownTimer -= deltaTime;
        }
        
        // Jump control using Space
        if ((this.keys.Space) && this.ballPhysics.onGround && this.jumpCooldownTimer <= 0) {
            const jumped = this.ballPhysics.jump(this.gameProperties.jumpForce);
            if (jumped) {
                this.jumpCooldownTimer = this.gameProperties.jumpCooldown;
                
                // Play jump sound
                this.soundManager.play('jump', 0.6);
                
                // Start roll sound cooldown so it doesn't immediately play when landing
                this.soundCooldowns.roll = Date.now() + 300;
            }
        }
    }

    /**
     * Check if the ball has reached the goal
     */
    checkGoal() {
        const goalTrigger = this.goal.getTrigger();
        if (this.collisionSystem.checkGoal(this.football.getMesh(), goalTrigger)) {
            if (!this.gameState.hasWon) {
                this.gameState.gameWon();
                
                // Trigger confetti behind the goal
                this.effectsManager.showConfetti();
                
                // Play goal sound
                if (!this.gameState.goalSoundPlayed) {
                    this.soundManager.play('goal', 1.0);
                    this.gameState.goalSoundPlayed = true;
                }
                
                // Add camera celebration view
                this.cameraController.startCelebration(
                    this.football.getMesh().position,
                    this.goal.getGroup().position
                );
                
                // Stop ball physics after goal
                this.ballPhysics.velocity.set(0, 0, 0);
            }
        }
    }

    /**
     * Check if the ball is out of bounds
     */
    checkOutOfBounds() {
        if (this.gameState.hasWon || this.gameState.hasLost || this.gameState.isFalling) return;
        
        const isOutOfBounds = this.collisionSystem.checkOutOfBounds(
            this.football.getMesh(),
            this.field.getBoundaries()
        );
        
        if (isOutOfBounds) {
            this.gameState.startFalling();
            
            // Mark the ball as falling to prevent ground collisions
            this.football.getMesh().userData.isFalling = true;
            
            // Store the camera position to keep it fixed when game is lost
            this.gameState.lastCameraPosition = this.camera.position.clone();
            this.gameState.lastCameraLookAt = this.football.getMesh().position.clone();
            
            // Play whistle sound when out of bounds
            this.soundManager.play('whistle', 0.8);
            
            // Show out of bounds message immediately
            // Short timeout to ensure whistle sound plays first
            setTimeout(() => {
                if (this.gameState.isFalling) {
                    this.gameState.gameLost();
                }
            }, 500);
        }
    }

    /**
     * Position the ball based on current level configuration
     */
    resetBallPosition() {
        const ballPosition = this.levelSystem.getBallStartPosition();
        this.football.getMesh().position.copy(ballPosition);
    }
    
    /**
     * Go to the next level
     */
    nextLevel(skipCelebration = false) {
        // Skip any ongoing camera celebration if requested
        if (skipCelebration) {
            this.cameraController.stopCelebration();
            this.soundManager.stopCelebrationSounds();
        }
        
        // Check if there are more levels
        if (this.levelSystem.nextLevel()) {
            // Stop all sounds, especially the goal sound
            if (this.soundManager) {
                this.soundManager.stopAllSounds();
            }
            
            // Hide any particles
            this.effectsManager.hideParticles();
            
            // Load the next level
            const obstacles = this.levelSystem.loadCurrentLevel();
            this.gameState.setObstacles(obstacles);
            
            // Reset game state for new level
            this.gameState.reset();
            
            // Reset ball position
            this.resetBallPosition();
            
            // Reset ball physics
            this.ballPhysics.reset();
            
            // Reset the ball's falling flag
            if (this.football && this.football.getMesh()) {
                this.football.getMesh().userData.isFalling = false;
            }
        } else {
            // No more levels, game completed
            this.gameState.completeGame();
        }
    }

    /**
     * Reset the game state (restart level)
     */
    reset(skipCelebration = false) {
        // Stop any ongoing celebrations if requested
        if (skipCelebration) {
            this.cameraController.stopCelebration();
            this.soundManager.stopCelebrationSounds();
        }
        
        // Reset game state
        this.gameState.reset();
        
        // Hide any particles
        this.effectsManager.hideParticles();
        
        // Reset ball position based on current level
        this.resetBallPosition();
        
        // Reset physics
        this.ballPhysics.reset();
        
        // Reset the ball's falling flag
        if (this.football && this.football.getMesh()) {
            this.football.getMesh().userData.isFalling = false;
        }
        
        // Reset camera
        this.cameraController.reset();
    }

    /**
     * Update rolling sound based on ball velocity
     */
    updateRollSound(deltaTime) {
        const currentTime = Date.now();
        
        // Only play rolling sound when on ground and moving
        if (this.ballPhysics.onGround) {
            const horizontalSpeed = Math.sqrt(
                this.ballPhysics.velocity.x * this.ballPhysics.velocity.x + 
                this.ballPhysics.velocity.z * this.ballPhysics.velocity.z
            );
            
            // Play rolling sound if moving and cooldown elapsed
            if (horizontalSpeed > 3 && currentTime - this.soundCooldowns.roll > 300) {
                const volume = Math.min(horizontalSpeed / 15, 1) * 0.3; // Max 30% volume for roll
                
                // Start or update rolling sound
                const rollSound = this.soundManager.sounds['roll'];
                if (rollSound && !rollSound.isPlaying) {
                    this.soundManager.play('roll', volume);
                } else if (rollSound) {
                    rollSound.setVolume(volume * this.soundManager.masterVolume);
                }
            } else if (horizontalSpeed < 2) {
                // Stop rolling sound when almost stopped
                this.soundManager.stop('roll');
            }
        } else {
            // Stop rolling sound when in air
            this.soundManager.stop('roll');
        }
    }

    /**
     * Animation loop
     */
    animate(currentTime) {
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Limit delta time to avoid large jumps during pauses or slow frames
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        
        // Update ball position based on physics - always update to handle falling state
        this.ballPhysics.update(this.football.getMesh(), clampedDeltaTime, this.gameState);
        
        // Update game logic if the game is active
        if (this.gameState.isPlaying) {
            // Check keyboard input
            if (this.keys.ArrowUp || this.keys.KeyW) {
                this.ballPhysics.applyForce(new THREE.Vector3(0, 0, -this.gameProperties.forwardAcceleration), clampedDeltaTime);
            }
            if (this.keys.ArrowDown || this.keys.KeyS) {
                this.ballPhysics.applyForce(new THREE.Vector3(0, 0, this.gameProperties.backwardAcceleration), clampedDeltaTime);
            }
            if (this.keys.ArrowLeft || this.keys.KeyA) {
                this.ballPhysics.applyForce(new THREE.Vector3(-this.gameProperties.lateralAcceleration, 0, 0), clampedDeltaTime);
            }
            if (this.keys.ArrowRight || this.keys.KeyD) {
                this.ballPhysics.applyForce(new THREE.Vector3(this.gameProperties.lateralAcceleration, 0, 0), clampedDeltaTime);
            }
            if (this.keys.Space) {
                this.handleJump(clampedDeltaTime);
            }
            
            // Update jump cooldown
            if (this.jumpCooldownTimer > 0) {
                this.jumpCooldownTimer -= clampedDeltaTime;
            }
            
            // Check for goal
            this.checkGoal();
            
            // Check if ball is out of bounds
            this.checkOutOfBounds();
            
            // Check obstacle collisions
            this.collisionSystem.checkObstacleCollisions(
                this.football.getMesh(),
                this.ballPhysics,
                this.gameState.obstacles,
                this.gameProperties
            );
            
            // Check goal frame collisions
            this.collisionSystem.checkGoalFrameCollision(
                this.football.getMesh(),
                this.ballPhysics,
                this.goal.getGroup(),
                this.gameProperties
            );
            
            // Update obstacles
            this.levelSystem.updateObstacles(clampedDeltaTime);
            
            // Apply wind forces
            this.levelSystem.applyWindForces(this.football.getMesh(), this.ballPhysics);
            
            // Update roll sound based on ball velocity
            this.updateRollSound(clampedDeltaTime);
        }
        
        // Update ball rotation based on movement (skip when falling as rotation is handled there)
        if (!this.gameState.isFalling) {
            this.football.updateRotation(this.ballPhysics.velocity, clampedDeltaTime);
        }
        
        // Update camera position
        this.cameraController.update(clampedDeltaTime, this.gameState);
        
        // Update clouds
        this.cloudSystem.update(clampedDeltaTime);
        
        // Update UI
        this.uiManager.update(this.levelSystem);
        
        // Update confetti and other effects
        this.effectsManager.updateParticles(clampedDeltaTime);
        this.collisionSystem.updateCollisionEffects(clampedDeltaTime);
        
        // Update camera shake if active
        if (this.cameraController.cameraShake.active) {
            this.collisionSystem.updateCameraShake(
                this.camera,
                this.cameraController.defaultPosition,
                clampedDeltaTime
            );
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Request next frame
        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Debug ball and floor positions
     */
    debugPositions() {
        const ball = this.football.getMesh();
        const floor = this.field.getFloor();
        const floorY = (floor && floor.parent) ? floor.parent.position.y : -0.49;
        
        // Check if the ball is on the ground
        const isOnGround = this.ballPhysics.onGround;
        const ballBottom = ball.position.y - this.football.radius;
        const distanceToGround = ballBottom - floorY;
        
        // Log only once every 60 frames to avoid console spam
        if (Math.floor(Date.now() / 1000) % 3 === 0 && !this._lastDebugTime) {
            console.log(`Ball position: (${ball.position.x.toFixed(2)}, ${ball.position.y.toFixed(2)}, ${ball.position.z.toFixed(2)})`);
            console.log(`Floor Y: ${floorY.toFixed(2)}`);
            console.log(`Ball bottom: ${ballBottom.toFixed(2)}`);
            console.log(`Distance to ground: ${distanceToGround.toFixed(2)}`);
            console.log(`Ball on ground: ${isOnGround}`);
            this._lastDebugTime = Date.now();
        } else if (Date.now() - this._lastDebugTime > 1000) {
            this._lastDebugTime = null;
        }
    }
} 
