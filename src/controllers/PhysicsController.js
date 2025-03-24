import * as THREE from 'three';

export default class PhysicsController {
    constructor(gameController) {
        this.gameController = gameController;
        
        // Get models and views from game controller
        this.ballModel = this.gameController.ballModel;
        this.obstacleModels = this.gameController.obstacleModels;
        this.fieldModel = this.gameController.fieldModel;
        
        this.ballView = this.gameController.ballView;
        this.obstacleView = this.gameController.obstacleView;
        this.fieldView = this.gameController.fieldView;
        this.sceneView = this.gameController.sceneView;
    }
    
    updateBallPhysics(deltaTime) {
        // Update velocity based on acceleration (gravity)
        this.ballModel.update(deltaTime);
        
        // Check for ground collision
        this.checkGroundCollision();
    }
    
    checkGroundCollision() {
        // Get floor mesh for collision testing
        const floor = this.fieldView.getFloorMeshForCollision();
        if (!floor) return;
        
        // Get floor y position in world space
        const floorWorldPosition = new THREE.Vector3();
        floor.getWorldPosition(floorWorldPosition);
        
        // Check if ball is at or below floor level plus its radius
        if (this.ballModel.position.y <= floorWorldPosition.y + this.ballModel.radius) {
            // Set ball position to be on the floor
            this.ballModel.position.y = floorWorldPosition.y + this.ballModel.radius;
            
            // Only bounce if coming down with some velocity
            if (this.ballModel.velocity.y < 0) {
                // Bounce - reverse y velocity and apply restitution
                this.ballModel.velocity.y = -this.ballModel.velocity.y * this.ballModel.restitution;
                
                // Apply some friction to x and z velocities
                this.ballModel.velocity.x *= 0.95;
                this.ballModel.velocity.z *= 0.95;
                
                // Create bounce effect if velocity is significant
                if (Math.abs(this.ballModel.velocity.y) > 1) {
                    const bouncePosition = new THREE.Vector3(
                        this.ballModel.position.x,
                        floorWorldPosition.y,
                        this.ballModel.position.z
                    );
                    const bounceNormal = new THREE.Vector3(0, 1, 0);
                    
                    // Create particles based on impact velocity
                    const impactStrength = Math.min(Math.abs(this.ballModel.velocity.y) * 0.5, 1);
                    const particleCount = Math.floor(impactStrength * 10);
                    
                    if (particleCount > 0) {
                        this.ballView.createCollisionEffect(bouncePosition, bounceNormal, particleCount);
                        
                        // Add camera shake based on impact
                        if (impactStrength > 0.6) {
                            this.sceneView.shakeCamera(impactStrength * 0.3);
                        }
                    }
                }
            }
            
            // Track if ball is on the ground
            this.ballModel.onGround = true;
            this.ballModel.lastGroundY = floorWorldPosition.y;
        } else {
            this.ballModel.onGround = false;
        }
    }
    
    checkCollisions() {
        this.checkObstacleCollisions();
        this.checkWallCollisions();
    }
    
    checkObstacleCollisions() {
        // For each obstacle, check collision with ball
        this.obstacleModels.forEach((obstacle, index) => {
            // Get obstacle mesh
            const obstacleMesh = this.obstacleView.getMeshById(obstacle.id);
            if (!obstacleMesh) return;
            
            // Get obstacle dimensions and position in world space
            const obstacleWorldPosition = new THREE.Vector3();
            obstacleMesh.getWorldPosition(obstacleWorldPosition);
            
            const { width, height, depth } = obstacle.size;
            
            // Calculate distances between ball and obstacle centers
            const dx = Math.abs(this.ballModel.position.x - obstacleWorldPosition.x);
            const dy = Math.abs(this.ballModel.position.y - obstacleWorldPosition.y);
            const dz = Math.abs(this.ballModel.position.z - obstacleWorldPosition.z);
            
            // Check if collision is possible
            if (dx > (width / 2 + this.ballModel.radius) || 
                dy > (height / 2 + this.ballModel.radius) || 
                dz > (depth / 2 + this.ballModel.radius)) {
                return; // No collision
            }
            
            // Check if collision is definite (inside obstacle)
            if (dx <= width / 2 || dy <= height / 2 || dz <= depth / 2) {
                this.handleObstacleCollision(obstacle, obstacleMesh);
                return;
            }
            
            // Check corner collision (distance formula)
            const cornerDistanceSq = 
                Math.pow(dx - width / 2, 2) + 
                Math.pow(dy - height / 2, 2) + 
                Math.pow(dz - depth / 2, 2);
                
            if (cornerDistanceSq <= Math.pow(this.ballModel.radius, 2)) {
                this.handleObstacleCollision(obstacle, obstacleMesh);
            }
        });
    }
    
    handleObstacleCollision(obstacle, obstacleMesh) {
        // Get obstacle position
        const obstacleWorldPosition = new THREE.Vector3();
        obstacleMesh.getWorldPosition(obstacleWorldPosition);
        
        // Calculate collision vector (from obstacle to ball)
        const collisionVector = new THREE.Vector3(
            this.ballModel.position.x - obstacleWorldPosition.x,
            this.ballModel.position.y - obstacleWorldPosition.y,
            this.ballModel.position.z - obstacleWorldPosition.z
        );
        
        // Normalize collision vector
        const collisionNormal = collisionVector.clone().normalize();
        
        // Calculate velocity component along collision normal
        const velocityAlongNormal = 
            this.ballModel.velocity.x * collisionNormal.x + 
            this.ballModel.velocity.y * collisionNormal.y + 
            this.ballModel.velocity.z * collisionNormal.z;
            
        // Only bounce if moving toward obstacle
        if (velocityAlongNormal < 0) {
            // Calculate bounce velocity
            const bounceVelocity = -velocityAlongNormal * this.ballModel.restitution;
            
            // Apply bounce force
            this.ballModel.velocity.x += bounceVelocity * collisionNormal.x * 2;
            this.ballModel.velocity.y += bounceVelocity * collisionNormal.y * 2;
            this.ballModel.velocity.z += bounceVelocity * collisionNormal.z * 2;
            
            // Move ball out of obstacle
            const minDistance = this.ballModel.radius + Math.max(obstacle.size.width, obstacle.size.height, obstacle.size.depth) / 2;
            const currentDistance = collisionVector.length();
            const correctionDistance = minDistance - currentDistance;
            
            if (correctionDistance > 0) {
                this.ballModel.position.x += collisionNormal.x * correctionDistance;
                this.ballModel.position.y += collisionNormal.y * correctionDistance;
                this.ballModel.position.z += collisionNormal.z * correctionDistance;
            }
            
            // Create collision effect
            const collisionPosition = new THREE.Vector3(
                this.ballModel.position.x - collisionNormal.x * this.ballModel.radius,
                this.ballModel.position.y - collisionNormal.y * this.ballModel.radius,
                this.ballModel.position.z - collisionNormal.z * this.ballModel.radius
            );
            
            // Determine impact strength
            const impactStrength = Math.min(Math.abs(velocityAlongNormal) * 0.5, 1);
            const particleCount = Math.floor(impactStrength * 10);
            
            if (particleCount > 0) {
                this.ballView.createCollisionEffect(collisionPosition, collisionNormal, particleCount);
                
                // Add camera shake based on impact
                if (impactStrength > 0.4) {
                    this.sceneView.shakeCamera(impactStrength * 0.3);
                }
            }
        }
    }
    
    checkWallCollisions() {
        // Get wall positions from field view
        const walls = this.gameController.fieldView.walls;
        walls.forEach(wall => {
            // Get wall position and dimensions
            const wallWorldPosition = new THREE.Vector3();
            wall.getWorldPosition(wallWorldPosition);
            
            const wallSize = new THREE.Vector3();
            wall.geometry.computeBoundingBox();
            wall.geometry.boundingBox.getSize(wallSize);
            
            // Apply wall's scaling
            wallSize.multiply(wall.scale);
            
            // Calculate distances between ball and wall
            const dx = Math.abs(this.ballModel.position.x - wallWorldPosition.x);
            const dy = Math.abs(this.ballModel.position.y - wallWorldPosition.y);
            const dz = Math.abs(this.ballModel.position.z - wallWorldPosition.z);
            
            // Check if collision is possible
            if (dx > (wallSize.x / 2 + this.ballModel.radius) || 
                dy > (wallSize.y / 2 + this.ballModel.radius) || 
                dz > (wallSize.z / 2 + this.ballModel.radius)) {
                return; // No collision
            }
            
            // Only handle lateral collision (x-axis)
            if (dx <= wallSize.x / 2 + this.ballModel.radius && 
                dy < wallSize.y / 2 && 
                dz < wallSize.z / 2) {
                
                // Determine collision side
                const collisionNormal = new THREE.Vector3(
                    (this.ballModel.position.x > wallWorldPosition.x) ? 1 : -1,
                    0,
                    0
                );
                
                // Calculate velocity component along collision normal
                const velocityAlongNormal = 
                    this.ballModel.velocity.x * collisionNormal.x;
                    
                // Only bounce if moving toward wall
                if (velocityAlongNormal * collisionNormal.x < 0) {
                    // Calculate bounce velocity
                    const bounceVelocity = -velocityAlongNormal * this.ballModel.restitution;
                    
                    // Apply bounce force
                    this.ballModel.velocity.x = bounceVelocity;
                    
                    // Move ball out of wall
                    const penetrationDepth = wallSize.x / 2 + this.ballModel.radius - dx;
                    this.ballModel.position.x += collisionNormal.x * penetrationDepth;
                    
                    // Create collision effect
                    const collisionPosition = new THREE.Vector3(
                        this.ballModel.position.x - collisionNormal.x * this.ballModel.radius,
                        this.ballModel.position.y,
                        this.ballModel.position.z
                    );
                    
                    // Determine impact strength
                    const impactStrength = Math.min(Math.abs(velocityAlongNormal) * 0.5, 1);
                    const particleCount = Math.floor(impactStrength * 10);
                    
                    if (particleCount > 0) {
                        this.ballView.createCollisionEffect(collisionPosition, collisionNormal, particleCount);
                        
                        // Add camera shake based on impact
                        if (impactStrength > 0.4) {
                            this.sceneView.shakeCamera(impactStrength * 0.3);
                        }
                    }
                }
            }
        });
    }
} 
