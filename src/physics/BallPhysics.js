import * as THREE from 'three';

/**
 * Handles physics calculations and movement for the football
 */
export default class BallPhysics {
    constructor() {
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, -9.8, 0); // Gravity
        this.currentAcceleration = new THREE.Vector3(0, 0, 0); // Current frame acceleration from controls
        this.maxSpeed = 25; // Maximum speed cap
        this.rotation = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.friction = 0.98; // Friction coefficient (1 = no friction)
        this.groundFriction = 0.95; // Higher friction when on ground
        this.airFriction = 0.98; // Lower friction when in air
        this.elasticity = 0.8; // Bounce factor
        this.radius = 0.5; // Ball radius
        
        // Collision callback
        this.collisionCallback = null;
        
        // Track previous ground state for collision detection
        this.wasOnGround = false;
    }

    reset() {
        this.velocity.set(0, 0, 0);
        this.onGround = false;
        this.wasOnGround = false;
    }

    applyForce(force) {
        this.velocity.add(force);
    }

    /**
     * Set callback function for collision sounds
     */
    setCollisionCallback(callback) {
        this.collisionCallback = callback;
    }

    update(deltaTime, ball, gameState, gameProperties, keys, floor) {
        // If in falling state, handle special physics
        if (gameState.isFalling) {
            this.handleFallingState(deltaTime, ball, gameState);
            return;
        }

        if (!gameState.isPlaying) return;

        // Reset current acceleration
        this.currentAcceleration.set(0, 0, 0);

        // Handle player movement
        this.handleInput(keys, gameProperties);

        // Apply current acceleration to velocity
        this.velocity.x += this.currentAcceleration.x * deltaTime;
        this.velocity.z += this.currentAcceleration.z * deltaTime;

        // Apply gravity
        this.velocity.y += this.acceleration.y * deltaTime;

        // Apply friction
        const frictionFactor = this.onGround ? this.groundFriction : this.airFriction;
        this.velocity.x *= frictionFactor;
        this.velocity.z *= frictionFactor;

        // Apply speed cap
        this.capSpeed();

        // Update position
        ball.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Add ball rotation based on movement
        this.updateBallRotation(ball, deltaTime);

        // Track previous ground state
        this.wasOnGround = this.onGround;

        // Handle ground collision
        this.handleGroundCollision(ball, floor);
    }

    handleFallingState(deltaTime, ball, gameState) {
        const currentTime = Date.now();
        const fallingTime = (currentTime - gameState.fallStartTime) / 1000;
        
        if (fallingTime >= 1.0) {
            // After 1 second of falling, end the game
            gameState.gameLost();
            return;
        }
        
        // Apply gravity
        this.velocity.y += this.acceleration.y * deltaTime;
        
        // Apply air friction but keep lateral movement
        this.velocity.x *= this.airFriction;
        this.velocity.z *= this.airFriction;
        
        // Update position with all velocity components
        ball.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Add dramatic rotation while falling
        ball.rotation.x += deltaTime * 5;
        ball.rotation.z += deltaTime * 3;
    }

    handleInput(keys, gameProperties) {
        // Forward/backward control using Up/Down arrows or W/S keys
        if (keys.ArrowUp || keys.KeyW) {
            this.currentAcceleration.z = -gameProperties.forwardAcceleration;
        }
        if (keys.ArrowDown || keys.KeyS) {
            this.currentAcceleration.z = gameProperties.backwardAcceleration;
        }
        
        // Left/right control using Left/Right arrows or A/D keys
        if (keys.ArrowLeft || keys.KeyA) {
            this.currentAcceleration.x = -gameProperties.lateralAcceleration;
        }
        if (keys.ArrowRight || keys.KeyD) {
            this.currentAcceleration.x = gameProperties.lateralAcceleration;
        }
        
        // Jump control using Space (handled by the Game class for cooldown timing)
    }

    jump(jumpForce) {
        if (this.onGround) {
            this.velocity.y = jumpForce;
            this.onGround = false;
            return true;
        }
        return false;
    }

    capSpeed() {
        const horizontalSpeed = Math.sqrt(
            this.velocity.x * this.velocity.x + 
            this.velocity.z * this.velocity.z
        );
        
        if (horizontalSpeed > this.maxSpeed) {
            const reductionFactor = this.maxSpeed / horizontalSpeed;
            this.velocity.x *= reductionFactor;
            this.velocity.z *= reductionFactor;
        }
    }

    updateBallRotation(ball, deltaTime) {
        const horizontalSpeed = Math.sqrt(
            this.velocity.x * this.velocity.x + 
            this.velocity.z * this.velocity.z
        );
        
        if (horizontalSpeed > 0.1) {
            // Calculate rotation axis (perpendicular to movement direction)
            const rotationAxis = new THREE.Vector3(-this.velocity.z, 0, this.velocity.x).normalize();
            const rotationAmount = horizontalSpeed * deltaTime / this.radius;
            ball.rotateOnAxis(rotationAxis, rotationAmount);
        }
    }

    handleGroundCollision(ball, floor) {
        // Get the floor's Y position from the floor mesh
        // Floor is at y = -0.49 in the FootballField class
        const floorY = (floor && floor.parent) ? floor.parent.position.y : -0.49;
        
        if (ball.position.y - this.radius <= floorY) {
            // Set the ball just above the floor
            ball.position.y = floorY + this.radius + 0.01; // Small offset to prevent jittering
            
            if (this.velocity.y < 0) {
                // Calculate impact velocity for bounce sound
                const impactVelocity = Math.abs(this.velocity.y);
                
                // Bounce when hitting the ground
                this.velocity.y = -this.velocity.y * this.elasticity;
                
                // Trigger sound callback if available and landing from air
                if (this.collisionCallback && !this.wasOnGround && impactVelocity > 2) {
                    this.collisionCallback('ground', ball.position, impactVelocity);
                }
            }
            
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }
} 
