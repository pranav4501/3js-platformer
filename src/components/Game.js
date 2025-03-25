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
            KeyD: false
        };
        
        // Game properties
        this.gameProperties = {
            forwardAcceleration: 40.0,   // Acceleration for forward movement
            backwardAcceleration: 20.0,  // Acceleration for backward movement
            lateralAcceleration: 35.0,   // Acceleration for side-to-side movement
            obstacleRepulsionForce: 20.0, // Force for obstacle collisions (reduced from 30.0)
            jumpForce: 7.4,             // Force applied when jumping (reduced by factor of 5, from 12.0)
            jumpCooldown: 0.3           // Time in seconds before player can jump again
        };
        
        // Jump cooldown timer
        this.jumpCooldownTimer = 0;
        
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
        
        // Create obstacles
        this.obstacleSystem = new ObstacleSystem(this.scene);
        const obstacles = this.obstacleSystem.createObstacles();
        this.gameState.setObstacles(obstacles);
        
        // Create physics system
        this.ballPhysics = new BallPhysics();
        
        // Create collision system
        this.collisionSystem = new CollisionSystem(this.scene);
        
        // Create UI manager with reset callback
        this.uiManager = new UIManager(this.gameState, this.reset.bind(this));
        
        // Create effects manager
        this.effectsManager = new EffectsManager(this.scene);
        
        // Create camera controller
        this.cameraController = new CameraController(this.camera);
        this.cameraController.setTarget(this.football.getMesh());
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
        });
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
            }
        }
    }

    /**
     * Check if the ball has reached the goal
     */
    checkGoal() {
        if (this.gameState.hasWon) return;
        
        const isInGoal = this.collisionSystem.checkGoal(
            this.football.getMesh(), 
            this.goal.getTrigger()
        );
        
        if (isInGoal) {
            this.gameState.gameWon();
            this.effectsManager.celebrateGoal(this.goal.getProperties().position);
            this.uiManager.showWinScreen();
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
            
            // Store the camera position to keep it fixed when game is lost
            this.gameState.lastCameraPosition = this.camera.position.clone();
            this.gameState.lastCameraLookAt = this.football.getMesh().position.clone();
        }
    }

    /**
     * Reset the game
     */
    reset() {
        // Reset game state
        this.gameState.reset();
        
        // Reset ball position and physics
        this.football.reset();
        this.ballPhysics.reset();
        
        // Hide effects
        this.effectsManager.hideParticles();
        
        // Hide UI
        this.uiManager.hideAllScreens();
        
        // Reset jump cooldown
        this.jumpCooldownTimer = 0;
        
        // Reset camera position using the camera controller
        this.cameraController.reset();
    }

    /**
     * Animation loop
     */
    animate(currentTime) {
        requestAnimationFrame(this.animate.bind(this));

        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Skip first frame with zero deltaTime
        if (deltaTime <= 0) return;
        
        // Handle jump input
        this.handleJump(deltaTime);
        
        // Update obstacles
        this.obstacleSystem.updateObstacles(deltaTime);
        
        // Apply wind forces from wind blowers
        this.obstacleSystem.applyWindForces(this.football.getMesh(), this.ballPhysics);
        
        // Update ball physics
        this.ballPhysics.update(
            deltaTime, 
            this.football.getMesh(), 
            this.gameState, 
            this.gameProperties, 
            this.keys,
            this.field.getFloor()
        );
        
        // Debug positions
        this.debugPositions();
        
        // Check for obstacle collisions
        this.collisionSystem.checkObstacleCollisions(
            this.football.getMesh(),
            this.ballPhysics,
            this.gameState.obstacles,
            this.gameProperties
        );
        
        // Check for goal frame collisions
        this.collisionSystem.checkGoalFrameCollision(
            this.football.getMesh(),
            this.ballPhysics,
            this.goal.getGroup(),
            this.gameProperties
        );
        
        // Check if reached goal
        this.checkGoal();
        
        // Check if out of bounds
        this.checkOutOfBounds();
        
        // Update camera
        this.cameraController.update(this.gameState, deltaTime, this.collisionSystem);
        
        // Update UI
        this.uiManager.update();
        
        // Update special effects
        this.effectsManager.updateParticles(deltaTime);
        this.collisionSystem.updateCollisionEffects(deltaTime);
        
        // Animate goal net
        this.goal.animateNet(currentTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
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
