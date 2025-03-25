import * as THREE from 'three';

/**
 * Handles collision detection and response
 */
export default class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.cameraShake = {
            active: false,
            intensity: 0,
            duration: 0,
            startTime: 0
        };
    }

    /**
     * Check and handle collisions between the ball and obstacles
     */
    checkObstacleCollisions(ball, ballPhysics, obstacles, gameProperties) {
        for (const obstacle of obstacles) {
            // Get obstacle bounds
            const obstacleBounds = new THREE.Box3().setFromObject(obstacle);
            
            // Get ball position
            const ballPosition = ball.position.clone();
            
            // Check if the ball is colliding with the obstacle
            if (obstacleBounds.distanceToPoint(ballPosition) < ballPhysics.radius) {
                // Handle collision
                this.handleObstacleCollision(ball, ballPosition, ballPhysics, obstacle, obstacleBounds, gameProperties);
            }
        }
    }

    /**
     * Handle collision between the ball and an obstacle
     */
    handleObstacleCollision(ball, ballPosition, ballPhysics, obstacle, obstacleBounds, gameProperties) {
        // Get obstacle center
        const obstacleCenter = new THREE.Vector3();
        obstacleBounds.getCenter(obstacleCenter);
        
        // Calculate collision normal (direction from obstacle center to ball)
        const normal = ballPosition.clone().sub(obstacleCenter).normalize();
        
        // Calculate impact velocity magnitude
        const impactSpeed = Math.abs(ballPhysics.velocity.dot(normal));
        
        // Calculate obstacle velocity (if it has movement data)
        const obstacleVelocity = this.getObstacleVelocity(obstacle);
        
        // Move the ball outside the obstacle with extra margin to prevent sticking
        const penetrationDepth = ballPhysics.radius - obstacleBounds.distanceToPoint(ballPosition);
        ball.position.add(normal.clone().multiplyScalar(penetrationDepth + 0.2)); // Increased margin
        
        // Get the relative velocity - how fast the ball is moving relative to the obstacle
        const relativeVelocity = ballPhysics.velocity.clone().sub(obstacleVelocity);
        const relativeVelocityAlongNormal = relativeVelocity.dot(normal);
        
        // Only bounce if the ball is moving toward the obstacle relative to the obstacle's movement
        if (relativeVelocityAlongNormal < 0) {
            // First, cancel out the component of the ball's velocity that's moving toward the obstacle
            ballPhysics.velocity.sub(normal.clone().multiplyScalar(relativeVelocityAlongNormal * 2.0));
            
            // Apply strong repulsion in the normal direction (away from obstacle)
            // Higher force for higher impact speeds
            const baseRepulsionForce = gameProperties.obstacleRepulsionForce * 1.5; // Increased base force
            const speedBonus = impactSpeed * 0.8; // More influence from impact speed
            const totalRepulsionForce = baseRepulsionForce + speedBonus;
            
            // Add repulsion with high force
            ballPhysics.velocity.add(normal.clone().multiplyScalar(totalRepulsionForce));
            
            // Ensure minimal energy loss to prevent sticking behavior
            const energyConservation = 0.9; // High conservation to prevent slowing down too much
            ballPhysics.velocity.multiplyScalar(energyConservation);
            
            // Add upward component to prevent floor sticking (reduced from 1.0 to 0.4)
            ballPhysics.velocity.y = Math.max(ballPhysics.velocity.y, 0.4);
            
            // Add random slight variance to make bounces feel natural
            const randomFactor = 0.05; // Very small randomness for predictable bounces
            ballPhysics.velocity.x += (Math.random() - 0.5) * randomFactor * totalRepulsionForce;
            ballPhysics.velocity.z += (Math.random() - 0.5) * randomFactor * totalRepulsionForce;
            
            // Add visual feedback for collision
            const particleCount = Math.floor(7 + impactSpeed / 1.5); // More particles
            this.createCollisionEffect(ball.position.clone(), normal, particleCount);
            
            // Add screen shake for dramatic effect on hard impacts
            if (impactSpeed > 5) { // Reduced threshold for more frequent shake
                this.shakeCamera(impactSpeed / 5);
            }
        }
    }

    /**
     * Get the velocity of an obstacle based on its movement pattern
     */
    getObstacleVelocity(obstacle) {
        const obstacleVelocity = new THREE.Vector3(0, 0, 0);
        if (obstacle.userData.movement) {
            const movement = obstacle.userData.movement;
            switch (movement.type) {
                case 'horizontal':
                    obstacleVelocity.x = movement.speed * movement.direction;
                    break;
                case 'diagonal':
                    const progressRate = movement.speed * 0.1 * (movement.direction || 1);
                    obstacleVelocity.x = (movement.endX - movement.startX) * progressRate;
                    obstacleVelocity.z = (movement.endZ - movement.startZ) * progressRate;
                    break;
                case 'circular':
                    // Tangential velocity in circular motion
                    obstacleVelocity.x = -Math.sin(movement.angle) * movement.speed * movement.radius;
                    obstacleVelocity.z = Math.cos(movement.angle) * movement.speed * movement.radius;
                    break;
                case 'vertical':
                    obstacleVelocity.y = movement.speed * movement.direction;
                    break;
                case 'zigzag':
                    obstacleVelocity.x = movement.speed * movement.direction;
                    break;
            }
        }
        return obstacleVelocity;
    }

    /**
     * Create a visual effect for collision (simple particles)
     */
    createCollisionEffect(position, normal, particleCount = 5) {
        // Skip if too many effects are already present (performance)
        if (this.scene.children.filter(child => child.userData.isCollisionEffect).length > 5) return;
        
        // Create a small particle group at the collision point
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Set all particles at the collision point
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Use a simple white material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3, // Larger particles
            transparent: true,
            opacity: 0.8
        });
        
        const collisionEffect = new THREE.Points(particleGeometry, particleMaterial);
        collisionEffect.userData = {
            isCollisionEffect: true,
            creationTime: Date.now(),
            velocities: Array(particleCount).fill().map(() => {
                // Create velocity in the general direction of the normal with more randomness
                return new THREE.Vector3(
                    normal.x + (Math.random() - 0.5) * 3,
                    normal.y + (Math.random() * 2), // More upward bias
                    normal.z + (Math.random() - 0.5) * 3
                ).normalize().multiplyScalar(Math.random() * 5 + 2); // Faster particles
            })
        };
        
        this.scene.add(collisionEffect);
        
        // Remove after 600ms
        setTimeout(() => {
            this.scene.remove(collisionEffect);
        }, 600);
    }

    /**
     * Add camera shake effect for more impact feedback
     */
    shakeCamera(intensity = 1.0) {
        this.cameraShake = {
            active: true,
            intensity: intensity,
            duration: 0.3, // seconds
            startTime: Date.now()
        };
    }

    /**
     * Check if the ball is in the goal
     */
    checkGoal(ball, goalTrigger) {
        // Get the world position of the ball
        const ballWorldPos = new THREE.Vector3();
        ball.getWorldPosition(ballWorldPos);
        
        // Get ball radius (assume it's the same as in the SoccerGoal class)
        const ballRadius = 0.5;
        
        // Get the goal trigger box in world space
        const goalBox = new THREE.Box3().setFromObject(goalTrigger);
        
        // Check if the ball's center is inside the goal trigger box OR if the ball intersects the goal box
        // Using sphere-box intersection test which is more accurate than just checking the center point
        return goalBox.containsPoint(ballWorldPos) || goalBox.intersectsSphere(new THREE.Sphere(ballWorldPos, ballRadius));
    }

    /**
     * Check if the ball is out of bounds
     */
    checkOutOfBounds(ball, boundaries) {
        const { minX, maxX, minZ, maxZ, maxY } = boundaries;
        const ballPosition = ball.position;
        
        return (
            ballPosition.x < minX || 
            ballPosition.x > maxX || 
            ballPosition.z < minZ ||
            ballPosition.z > maxZ ||
            ballPosition.y > maxY  // Check if above the ceiling
        );
    }

    /**
     * Update collision effects
     */
    updateCollisionEffects(deltaTime) {
        this.scene.children.forEach(child => {
            if (child.userData.isCollisionEffect) {
                // Update positions based on velocities
                const positions = child.geometry.attributes.position.array;
                const velocities = child.userData.velocities;
                
                for (let i = 0, j = 0; i < velocities.length; i++, j += 3) {
                    positions[j] += velocities[i].x * deltaTime;
                    positions[j+1] += velocities[i].y * deltaTime;
                    positions[j+2] += velocities[i].z * deltaTime;
                }
                
                child.geometry.attributes.position.needsUpdate = true;
                
                // Fade out based on age
                const age = (Date.now() - child.userData.creationTime) / 600; // 0 to 1 over 600ms
                child.material.opacity = 0.8 * (1 - age);
            }
        });
    }

    /**
     * Update camera shake effect
     */
    updateCameraShake(camera, cameraPosition, deltaTime) {
        if (this.cameraShake.active) {
            const elapsed = (Date.now() - this.cameraShake.startTime) / 1000;
            if (elapsed < this.cameraShake.duration) {
                // Calculate shake intensity based on remaining duration
                const shakeFactor = 1 - (elapsed / this.cameraShake.duration);
                // Apply random offset to camera position
                cameraPosition.x += (Math.random() - 0.5) * 2 * this.cameraShake.intensity * shakeFactor;
                cameraPosition.y += (Math.random() - 0.5) * 2 * this.cameraShake.intensity * shakeFactor;
            } else {
                this.cameraShake.active = false;
            }
        }
        return cameraPosition;
    }

    /**
     * Check for collisions between the ball and the goal frame
     */
    checkGoalFrameCollision(ball, ballPhysics, goalGroup, gameProperties) {
        // Loop through all children of the goal group (which include the frame poles)
        for (let i = 0; i < goalGroup.children.length; i++) {
            const child = goalGroup.children[i];
            
            // Skip the goal trigger and nets (only check collision with solid parts)
            if (child === goalGroup.getObjectByName('trigger') || child.userData.isNet) {
                continue;
            }
            
            // Only handle collisions with cylinders (the goal posts and crossbar)
            if (child.geometry && child.geometry.type === 'CylinderGeometry') {
                // Get ball position
                const ballPosition = ball.position.clone();
                
                // Get world position and size of the post
                const postWorldPosition = new THREE.Vector3();
                child.getWorldPosition(postWorldPosition);
                
                // Convert cylinder to a line segment for collision detection
                const axis = new THREE.Vector3(0, 1, 0);  // Default cylinder axis
                // Apply the object's rotation to get the actual axis
                axis.applyQuaternion(child.getWorldQuaternion(new THREE.Quaternion()));
                
                // Calculate half-length of the cylinder
                const halfLength = child.geometry.parameters.height / 2;
                
                // Get points at the ends of the cylinder
                const point1 = postWorldPosition.clone().add(axis.clone().multiplyScalar(halfLength));
                const point2 = postWorldPosition.clone().add(axis.clone().multiplyScalar(-halfLength));
                
                // Calculate closest point on the line segment to the ball center
                const closestPoint = this.closestPointOnLineSegment(ballPosition, point1, point2);
                
                // Get the distance from the ball center to the closest point on the post
                const distance = ballPosition.distanceTo(closestPoint);
                
                // Check for collision (distance < ball radius + post radius)
                const postRadius = child.geometry.parameters.radiusTop; // Assuming uniform radius
                if (distance < ballPhysics.radius + postRadius) {
                    // Calculate collision normal (direction from closest point to ball)
                    const normal = ballPosition.clone().sub(closestPoint).normalize();
                    
                    // Calculate impact speed
                    const impactSpeed = Math.abs(ballPhysics.velocity.dot(normal));
                    
                    // Apply collision response
                    this.handleGoalPostCollision(ball, ballPosition, ballPhysics, normal, impactSpeed, gameProperties);
                    
                    // Only handle one collision per frame to avoid physics instability
                    break;
                }
            }
        }
    }

    /**
     * Find the closest point on a line segment to a point
     */
    closestPointOnLineSegment(point, lineStart, lineEnd) {
        const line = lineEnd.clone().sub(lineStart);
        const len = line.length();
        const lineDir = line.clone().divideScalar(len);
        
        // Calculate projection of point onto line
        const projection = point.clone().sub(lineStart).dot(lineDir);
        
        // Clamp projection to line segment
        const clampedProjection = Math.max(0, Math.min(len, projection));
        
        // Calculate the closest point
        return lineStart.clone().add(lineDir.clone().multiplyScalar(clampedProjection));
    }

    /**
     * Handle collision between the ball and a goal post
     */
    handleGoalPostCollision(ball, ballPosition, ballPhysics, normal, impactSpeed, gameProperties) {
        // Move the ball outside the post with a small margin
        const pushDistance = ballPhysics.radius + 0.1 - ballPosition.clone().dot(normal);
        if (pushDistance > 0) {
            ball.position.add(normal.clone().multiplyScalar(pushDistance));
        }
        
        // Calculate the velocity component along the collision normal
        const velocityAlongNormal = ballPhysics.velocity.dot(normal);
        
        // Only bounce if the ball is moving toward the post
        if (velocityAlongNormal < 0) {
            // Reflect the velocity component along the normal
            ballPhysics.velocity.sub(normal.clone().multiplyScalar(velocityAlongNormal * 2.0 * ballPhysics.elasticity));
            
            // Add some random variation to make bounces feel more natural
            const randomFactor = 0.1;
            ballPhysics.velocity.x += (Math.random() - 0.5) * randomFactor;
            ballPhysics.velocity.z += (Math.random() - 0.5) * randomFactor;
            
            // Add visual feedback for collision
            const particleCount = Math.floor(5 + impactSpeed / 2);
            this.createCollisionEffect(ball.position.clone(), normal, particleCount);
            
            // Add screen shake for hard impacts
            if (impactSpeed > 5) {
                this.shakeCamera(impactSpeed / 10);
            }
        }
    }
} 
