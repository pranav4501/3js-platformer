import * as THREE from 'three';
import FootballPlayer from './FootballPlayer.js';

/**
 * Creates and manages obstacles in the game
 */
export default class ObstacleSystem {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.players = []; // Track the player objects for animation updates
    }

    /**
     * Create all obstacles in the game
     */
    createObstacles() {
        // Clear existing obstacles
        this.clearObstacles();
        
        // Create obstacle material - used only for debugging now
        const obstacleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x964b00,  // Brown color
            roughness: 0.7,
            visible: false // Hide the debug geometry
        });
        
        // Get field boundaries to ensure obstacles are within playable area
        const corridorWidth = 10;
        const fieldLength = 60;
        const minX = -corridorWidth/2 + 1;  // Left edge of field + buffer
        const maxX = corridorWidth/2 - 1;   // Right edge of field - buffer
        const minZ = -45;  // Near the goal but not too close
        const maxZ = 0;    // Up to the start area
        
        // Create football player obstacles with movement paths - increased speeds
        
        // Obstacle 1 - Left-right movement
        const player1 = new FootballPlayer(
            this.scene,
            new THREE.Vector3(-3, 0, -8),
            Math.PI / 2, // Rotation to face the direction of movement
            1 // Scale
        );
        const player1Mesh = player1.getMesh();
        // Add movement path data
        player1Mesh.userData.movement = {
            type: 'horizontal',
            speed: 4,
            startX: -3,
            endX: 3,
            direction: 1 // 1 for right, -1 for left
        };
        this.scene.add(player1Mesh);
        this.obstacles.push(player1Mesh);
        this.players.push(player1);
        
        // Obstacle 2 - Right-left movement
        const player2 = new FootballPlayer(
            this.scene,
            new THREE.Vector3(3, 0, -15),
            -Math.PI / 2, // Facing left
            1
        );
        const player2Mesh = player2.getMesh();
        // Add movement path data
        player2Mesh.userData.movement = {
            type: 'horizontal',
            speed: 3,
            startX: -3,
            endX: 3,
            direction: -1 // Start moving left
        };
        this.scene.add(player2Mesh);
        this.obstacles.push(player2Mesh);
        this.players.push(player2);
        
        // Obstacle 3 - Diagonal movement
        const player3 = new FootballPlayer(
            this.scene,
            new THREE.Vector3(0, 0, -22),
            Math.PI / 4, // Rotated 45 degrees to face direction
            1
        );
        const player3Mesh = player3.getMesh();
        // Add movement path data
        player3Mesh.userData.movement = {
            type: 'diagonal',
            speed: 5,
            startX: -3,
            endX: 3,
            startZ: -25,
            endZ: -20,
            progress: 0,
            direction: 1 // Starting direction
        };
        this.scene.add(player3Mesh);
        this.obstacles.push(player3Mesh);
        this.players.push(player3);
        
        // Obstacle 4 - Circular movement
        const player4 = new FootballPlayer(
            this.scene,
            new THREE.Vector3(-3, 0, -30),
            0, // Will be dynamically rotated in update
            1
        );
        const player4Mesh = player4.getMesh();
        // Add movement path data
        player4Mesh.userData.movement = {
            type: 'circular',
            speed: 2,
            centerX: -2,
            centerZ: -32,
            radius: 2,
            angle: 0
        };
        this.scene.add(player4Mesh);
        this.obstacles.push(player4Mesh);
        this.players.push(player4);
        
        // Obstacle 5 - Up-down movement (floating)
        const player5 = new FootballPlayer(
            this.scene,
            new THREE.Vector3(2, 1, -38),
            Math.PI, // Facing forward
            1
        );
        const player5Mesh = player5.getMesh();
        // Add movement path data
        player5Mesh.userData.movement = {
            type: 'vertical',
            speed: 2,
            startY: 0.5,
            endY: 1.5,
            direction: 1 // 1 for up, -1 for down
        };
        this.scene.add(player5Mesh);
        this.obstacles.push(player5Mesh);
        this.players.push(player5);
        
        // Obstacle 6 - Zigzag movement
        const player6 = new FootballPlayer(
            this.scene,
            new THREE.Vector3(-1, 0, -12),
            Math.PI / 4, // 45 degrees rotation
            1
        );
        const player6Mesh = player6.getMesh();
        // Add movement path data
        player6Mesh.userData.movement = {
            type: 'zigzag',
            speed: 6,
            leftX: -3,
            rightX: 3,
            direction: 1,
            amplitude: 2
        };
        this.scene.add(player6Mesh);
        this.obstacles.push(player6Mesh);
        this.players.push(player6);
        
        // Obstacle 7 - Static (doesn't move)
        const player7 = new FootballPlayer(
            this.scene,
            new THREE.Vector3(1, 0, -28),
            -Math.PI / 4, // -45 degrees rotation
            1
        );
        const player7Mesh = player7.getMesh();
        // No movement data for static obstacle
        this.scene.add(player7Mesh);
        this.obstacles.push(player7Mesh);
        this.players.push(player7);
        
        return this.obstacles;
    }

    /**
     * Clear all obstacles from the scene
     */
    clearObstacles() {
        this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
        this.obstacles = [];
        this.players = [];
    }

    /**
     * Update obstacle positions based on their movement paths
     */
    updateObstacles(deltaTime) {
        // Update player animations
        this.players.forEach(player => {
            player.update(deltaTime);
        });
        
        // Update obstacle positions
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
                    
                case 'diagonal':
                    // Move along diagonal path
                    movement.progress += deltaTime * movement.speed * 0.1 * (movement.direction || 1);
                    
                    // Reverse direction at endpoints instead of teleporting
                    if (movement.progress >= 1) {
                        movement.progress = 1;
                        movement.direction = -1; // Start moving back
                        // Rotate player to face the new direction
                        obstacle.rotation.y = -Math.PI / 4; // Face back diagonal
                    } else if (movement.progress <= 0) {
                        movement.progress = 0;
                        movement.direction = 1;  // Start moving forward
                        // Rotate player to face the new direction
                        obstacle.rotation.y = Math.PI / 4; // Face forward diagonal
                    }
                    
                    // Interpolate position
                    obstacle.position.x = movement.startX + (movement.endX - movement.startX) * movement.progress;
                    obstacle.position.z = movement.startZ + (movement.endZ - movement.startZ) * movement.progress;
                    break;
                    
                case 'circular':
                    // Circular movement
                    movement.angle += deltaTime * movement.speed;
                    obstacle.position.x = movement.centerX + Math.cos(movement.angle) * movement.radius;
                    obstacle.position.z = movement.centerZ + Math.sin(movement.angle) * movement.radius;
                    
                    // Rotate player to face tangent to circle
                    obstacle.rotation.y = movement.angle + Math.PI/2;
                    break;
                    
                case 'vertical':
                    // Up-down floating movement
                    obstacle.position.y += movement.speed * movement.direction * deltaTime;
                    
                    // Change direction at height limits
                    if (obstacle.position.y >= movement.endY) {
                        obstacle.position.y = movement.endY;
                        movement.direction = -1;
                    } else if (obstacle.position.y <= movement.startY) {
                        obstacle.position.y = movement.startY;
                        movement.direction = 1;
                    }
                    break;
                    
                case 'zigzag':
                    // Zigzag movement along x axis while moving forward
                    obstacle.position.x += movement.speed * movement.direction * deltaTime;
                    
                    // Change direction at boundaries
                    if (obstacle.position.x >= movement.rightX) {
                        obstacle.position.x = movement.rightX;
                        movement.direction = -1;
                        // Rotate to face new direction
                        obstacle.rotation.y = -Math.PI / 4; // Face left diagonal
                    } else if (obstacle.position.x <= movement.leftX) {
                        obstacle.position.x = movement.leftX;
                        movement.direction = 1;
                        // Rotate to face new direction
                        obstacle.rotation.y = Math.PI / 4; // Face right diagonal
                    }
                    break;
            }
        });
    }

    /**
     * Get the list of obstacles
     */
    getObstacles() {
        return this.obstacles;
    }
} 
