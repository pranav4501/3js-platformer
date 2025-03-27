import * as THREE from 'three';

/**
 * Controls camera movement and positioning
 */
export default class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.target = null;
        this.smoothFactor = 0.1; // Camera smoothing factor
        
        // Store the default camera position
        this.defaultPosition = new THREE.Vector3(0, 5, 10);
        
        // Camera shake properties
        this.cameraShake = {
            active: false,
            intensity: 0,
            duration: 0,
            startTime: 0
        };
        
        // Celebration camera properties
        this.celebration = {
            active: false,
            startTime: 0,
            duration: 5000, // 5 seconds
            orbitSpeed: 0.5,
            orbitRadius: 8,
            orbitAngle: 0,
            ballPosition: null,
            goalPosition: null
        };
    }

    /**
     * Set the target for the camera to follow
     */
    setTarget(target) {
        this.target = target;
    }

    /**
     * Reset the camera to its default position
     */
    reset() {
        this.camera.position.copy(this.defaultPosition);
        if (this.target) {
            this.camera.lookAt(this.target.position);
        }
        
        // Reset camera shake
        this.cameraShake.active = false;
        
        // Reset celebration
        this.celebration.active = false;
    }
    
    /**
     * Start a camera celebration animation
     */
    startCelebration(ballPosition, goalPosition) {
        this.celebration.active = true;
        this.celebration.startTime = Date.now();
        this.celebration.orbitAngle = 0;
        this.celebration.ballPosition = ballPosition.clone();
        this.celebration.goalPosition = goalPosition.clone();
    }
    
    /**
     * Stop any ongoing celebration animation
     */
    stopCelebration() {
        this.celebration.active = false;
    }

    /**
     * Update camera position based on game state
     */
    update(deltaTime, gameState) {
        if (!this.target) return;
        
        // Handle celebration camera
        if (this.celebration.active) {
            this.handleCelebrationCamera(deltaTime);
            return;
        }
        
        // If game is over, keep camera fixed at the last position
        if (!gameState.isPlaying && gameState.lastCameraPosition) {
            this.camera.position.copy(gameState.lastCameraPosition);
            this.camera.lookAt(gameState.lastCameraLookAt);
            return;
        }
        
        // When ball is falling, keep camera at ground level
        if (gameState.isFalling) {
            this.handleFallingCamera();
            return;
        }
        
        // Normal gameplay - camera follows the ball from behind
        this.handleGameplayCamera(deltaTime);
    }

    /**
     * Handle camera during falling state
     */
    handleFallingCamera() {
        if (!this.target) return;
        
        // Get horizontal position from the ball, but keep fixed height
        const cameraPosition = new THREE.Vector3();
        cameraPosition.x = this.target.position.x;
        cameraPosition.y = 1.5; // Fixed camera height at ground level
        
        // Pull camera back a bit to get a wider view of the falling ball
        const distanceBehind = 8;
        cameraPosition.z = this.target.position.z + distanceBehind;
        
        // Apply camera position with some smoothing during falling
        this.camera.position.lerp(cameraPosition, 0.05);
        this.camera.lookAt(this.target.position);
    }
    
    /**
     * Handle celebration camera movement
     */
    handleCelebrationCamera(deltaTime) {
        const elapsed = Date.now() - this.celebration.startTime;
        
        // End celebration after duration
        if (elapsed >= this.celebration.duration) {
            this.celebration.active = false;
            return;
        }
        
        // Calculate a midpoint between ball and goal for camera to orbit around
        const orbitCenter = new THREE.Vector3();
        orbitCenter.copy(this.celebration.ballPosition);
        
        // Increase the angle
        this.celebration.orbitAngle += deltaTime * this.celebration.orbitSpeed;
        
        // Calculate camera position in orbit
        const cameraPosition = new THREE.Vector3();
        cameraPosition.x = orbitCenter.x + Math.cos(this.celebration.orbitAngle) * this.celebration.orbitRadius;
        cameraPosition.z = orbitCenter.z + Math.sin(this.celebration.orbitAngle) * this.celebration.orbitRadius;
        cameraPosition.y = 3 + Math.sin(elapsed / 500) * 1; // Slight up and down movement
        
        // Set camera position and look at the midpoint
        this.camera.position.lerp(cameraPosition, this.smoothFactor * 2);
        this.camera.lookAt(orbitCenter);
    }

    /**
     * Handle camera during normal gameplay
     */
    handleGameplayCamera(deltaTime) {
        let cameraPosition = new THREE.Vector3();
        cameraPosition.copy(this.target.position);
        cameraPosition.z += 7; // Camera is 7 units behind the ball
        cameraPosition.y += 3; // Camera is 3 units above the ball
        
        // Set the camera position with smoothing (lerp)
        this.camera.position.lerp(cameraPosition, this.smoothFactor);
        this.camera.lookAt(this.target.position);
    }
} 
