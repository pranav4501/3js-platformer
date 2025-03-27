import * as THREE from 'three';

/**
 * Handles physics calculations and movement for the football
 */
export default class BallPhysics {
    constructor() {
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, -9.8, 0); // Gravity
        this.maxSpeed = 25; // Maximum speed cap
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

    applyForce(force, deltaTime) {
        // Apply the force taking into account the delta time
        if (deltaTime) {
            const scaledForce = force.clone().multiplyScalar(deltaTime);
            this.velocity.add(scaledForce);
        } else {
            // Original behavior for backward compatibility
            this.velocity.add(force);
        }
    }

    /**
     * Set callback function for collision sounds
     */
    setCollisionCallback(callback) {
        this.collisionCallback = callback;
    }

    /**
     * Update ball physics
     */
    update(ball, deltaTime) {
        // Apply gravity
        const gravityForce = this.acceleration.clone().multiplyScalar(deltaTime);
        this.velocity.add(gravityForce);
        
        // Apply friction
        const frictionFactor = this.onGround ? this.groundFriction : this.airFriction;
        this.velocity.x *= frictionFactor;
        this.velocity.z *= frictionFactor;
        
        // Apply speed cap
        this.capSpeed();
        
        // Update position
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        ball.position.add(movement);
        
        // Track previous ground state for collision detection
        this.wasOnGround = this.onGround;
        
        // Handle ground collision
        this.handleGroundCollision(ball);
    }

    /**
     * Make the ball jump if it's on the ground
     */
    jump(jumpForce) {
        if (this.onGround) {
            this.velocity.y = jumpForce;
            this.onGround = false;
            return true;
        }
        return false;
    }

    /**
     * Cap the ball's speed to prevent it from moving too fast
     */
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

    /**
     * Handle collision with the ground
     */
    handleGroundCollision(ball) {
        // Default floor Y position 
        const floorY = -0.49;
        
        if (ball.position.y - this.radius <= floorY) {
            // Set the ball just above the floor
            ball.position.y = floorY + this.radius + 0.01; // Small offset to prevent jittering
            
            if (this.velocity.y < 0) {
                // Calculate impact velocity for bounce sound
                const impactVelocity = Math.abs(this.velocity.y);
                
                // Bounce when hitting the ground
                this.velocity.y = -this.velocity.y * this.elasticity;
                
                // Dampen horizontal velocity slightly on bounce
                this.velocity.x *= 0.95;
                this.velocity.z *= 0.95;
                
                // Trigger sound callback if available and landing from air
                if (this.collisionCallback && !this.wasOnGround && impactVelocity > 1.5) {
                    this.collisionCallback('ground', ball.position, impactVelocity);
                }
            }
            
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }
} 
