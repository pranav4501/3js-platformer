export default class BallModel {
    constructor() {
        this.radius = 0.5;
        this.position = { x: 0, y: this.radius, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: -9.8, z: 0 }; // Gravity
        this.damping = 0.98; // Air resistance
        this.restitution = 0.7; // Bounciness
        this.onGround = false;
        this.lastGroundY = 0;
    }

    reset() {
        this.position = { x: 0, y: this.radius, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.onGround = false;
    }

    applyForce(force) {
        this.velocity.x += force.x;
        this.velocity.y += force.y;
        this.velocity.z += force.z;
    }

    update(deltaTime) {
        // Update velocity based on acceleration
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.velocity.z += this.acceleration.z * deltaTime;
        
        // Apply damping
        this.velocity.x *= this.damping;
        this.velocity.y *= this.damping;
        this.velocity.z *= this.damping;
        
        // Update position based on velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
    }
} 
