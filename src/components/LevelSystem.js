import * as THREE from 'three';
import FootballPlayer from './FootballPlayer.js';
import WindBlower from './WindBlower.js';

/**
 * Manages game levels with different configurations
 */
export default class LevelSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 0;
        this.obstacles = [];
        this.players = [];
        this.windBlowers = [];
        
        // Define level configurations
        this.levels = [
            // Level 1: Basic controls - Just ball and goal
            {
                name: "Level 1: Getting Started",
                description: "Move the ball to the goal. Don't fall off the field!",
                obstacles: [],
                windBlowers: [],
                ballStartPosition: new THREE.Vector3(0, 0.5, 0)
            },
            
            // Level 2: Single static player
            {
                name: "Level 2: First Obstacle",
                description: "Avoid the player! The ball will bounce off if you collide.",
                obstacles: [
                    {
                        type: 'player',
                        position: new THREE.Vector3(0, 0, -15),
                        rotation: 0,
                        scale: 1,
                        movement: null // static obstacle
                    }
                ],
                windBlowers: [],
                ballStartPosition: new THREE.Vector3(0, 0.5, 0)
            },
            
            // Level 3: Two static players
            {
                name: "Level 3: Double Trouble",
                description: "Navigate between two players to reach the goal.",
                obstacles: [
                    {
                        type: 'player',
                        position: new THREE.Vector3(-2, 0, -15),
                        rotation: 0,
                        scale: 1,
                        movement: null
                    },
                    {
                        type: 'player',
                        position: new THREE.Vector3(2, 0, -25),
                        rotation: Math.PI,
                        scale: 1,
                        movement: null
                    }
                ],
                windBlowers: [],
                ballStartPosition: new THREE.Vector3(0, 0.5, 0)
            },
            
            // Level 4: Single Moving player
            {
                name: "Level 4: Moving Target",
                description: "Time your movement to avoid the patrolling player.",
                obstacles: [
                    {
                        type: 'player',
                        position: new THREE.Vector3(-3, 0, -20),
                        rotation: Math.PI / 2, // Face right
                        scale: 1,
                        movement: {
                            type: 'horizontal',
                            speed: 3.5,
                            startX: -3,
                            endX: 3,
                            direction: 1 // moving right initially
                        }
                    }
                ],
                windBlowers: [],
                ballStartPosition: new THREE.Vector3(0, 0.5, 0)
            },
            
            // Level 5: Wind Blower
            {
                name: "Level 5: Against the Wind",
                description: "Watch out for the wind blower - it will push your ball!",
                obstacles: [],
                windBlowers: [
                    {
                        position: new THREE.Vector3(-4, 0.5, -15),
                        direction: new THREE.Vector3(1, 0, 0), // Blowing right
                        force: 15,
                        width: 2,
                        height: 1.5
                    }
                ],
                ballStartPosition: new THREE.Vector3(0, 0.5, 0)
            }
        ];
    }
    
    /**
     * Load the current level
     */
    loadCurrentLevel() {
        // Clear existing obstacles
        this.clearObstacles();
        
        // Get the current level configuration
        const levelConfig = this.levels[this.currentLevel];
        if (!levelConfig) return this.obstacles;
        
        // Create obstacles based on level configuration
        levelConfig.obstacles.forEach(obstacleConfig => {
            switch (obstacleConfig.type) {
                case 'player':
                    this.createPlayerObstacle(obstacleConfig);
                    break;
                // Add more obstacle types here as needed
            }
        });
        
        // Create wind blowers
        levelConfig.windBlowers.forEach(blowerConfig => {
            this.createWindBlower(blowerConfig);
        });
        
        return this.obstacles;
    }
    
    /**
     * Create a player obstacle
     */
    createPlayerObstacle(config) {
        const player = new FootballPlayer(
            this.scene,
            config.position,
            config.rotation,
            config.scale
        );
        const playerMesh = player.getMesh();
        
        // Add movement data if specified
        if (config.movement) {
            playerMesh.userData.movement = config.movement;
        }
        
        this.scene.add(playerMesh);
        this.obstacles.push(playerMesh);
        this.players.push(player);
        
        return playerMesh;
    }
    
    /**
     * Create a wind blower
     */
    createWindBlower(config) {
        const windBlower = new WindBlower(
            this.scene,
            config.position,
            config.direction,
            config.force,
            config.width,
            config.height
        );
        
        this.windBlowers.push(windBlower);
        
        return windBlower;
    }
    
    /**
     * Clear all obstacles from the scene
     */
    clearObstacles() {
        // Remove obstacles
        this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
        this.obstacles = [];
        this.players = [];
        
        // Remove wind blowers
        this.windBlowers.forEach(blower => {
            this.scene.remove(blower.getMesh());
        });
        this.windBlowers = [];
    }
    
    /**
     * Go to the next level
     */
    nextLevel() {
        if (this.currentLevel < this.levels.length - 1) {
            this.currentLevel++;
            return true;
        }
        return false; // No more levels
    }
    
    /**
     * Reset to first level
     */
    resetToFirstLevel() {
        this.currentLevel = 0;
    }
    
    /**
     * Get current level data
     */
    getCurrentLevel() {
        return this.levels[this.currentLevel];
    }
    
    /**
     * Update obstacles positions
     */
    updateObstacles(deltaTime) {
        // Update player animations
        this.players.forEach(player => {
            player.update(deltaTime);
        });
        
        // Update wind blowers
        this.windBlowers.forEach(blower => {
            blower.update(deltaTime);
        });
        
        // Update obstacle positions based on movement data
        this.obstacles.forEach(obstacle => {
            const movement = obstacle.userData.movement;
            if (!movement) return; // Skip obstacles with no movement data
            
            switch (movement.type) {
                case 'horizontal':
                    // Left-right movement
                    obstacle.position.x += movement.speed * movement.direction * deltaTime;
                    
                    // Change direction at boundaries
                    if (obstacle.position.x >= movement.endX) {
                        obstacle.position.x = movement.endX;
                        movement.direction = -1;
                        // Rotate to face new direction
                        obstacle.rotation.y = -Math.PI / 2; // Face left
                    } else if (obstacle.position.x <= movement.startX) {
                        obstacle.position.x = movement.startX;
                        movement.direction = 1;
                        // Rotate to face new direction
                        obstacle.rotation.y = Math.PI / 2; // Face right
                    }
                    break;
                    
                // Other movement types can be added here as needed
            }
        });
    }
    
    /**
     * Apply wind forces to the ball
     */
    applyWindForces(ball, ballPhysics) {
        this.windBlowers.forEach(blower => {
            blower.applyWindForce(ball, ballPhysics);
        });
    }
    
    /**
     * Get all obstacles
     */
    getObstacles() {
        return this.obstacles;
    }
    
    /**
     * Get all wind blowers
     */
    getWindBlowers() {
        return this.windBlowers;
    }
    
    /**
     * Get ball starting position for current level
     */
    getBallStartPosition() {
        const levelConfig = this.levels[this.currentLevel];
        return levelConfig ? levelConfig.ballStartPosition.clone() : new THREE.Vector3(0, 0.5, 0);
    }
    
    /**
     * Get total number of levels
     */
    getTotalLevels() {
        return this.levels.length;
    }
    
    /**
     * Get current level index (0-based)
     */
    getCurrentLevelIndex() {
        return this.currentLevel;
    }
    
    /**
     * Get current level name
     */
    getCurrentLevelName() {
        const levelConfig = this.levels[this.currentLevel];
        return levelConfig ? levelConfig.name : "Unknown Level";
    }
    
    /**
     * Get current level description
     */
    getCurrentLevelDescription() {
        const levelConfig = this.levels[this.currentLevel];
        return levelConfig ? levelConfig.description : "";
    }
} 