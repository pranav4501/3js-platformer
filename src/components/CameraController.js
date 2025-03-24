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
    }

    /**
     * Update camera position based on game state
     */
    update(gameState, deltaTime, collisionSystem) {
        if (!this.target) return;
        
        // If game is over, keep camera fixed at the last position
        if (gameState.hasLost && gameState.lastCameraPosition) {
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
        this.handleGameplayCamera(collisionSystem);
    }

    /**
     * Handle camera during falling state
     */
    handleFallingCamera() {
        // Get horizontal position from the ball, but keep fixed height
        const cameraPosition = new THREE.Vector3();
        cameraPosition.x = this.target.position.x;
        cameraPosition.y = 1.5; // Fixed camera height at ground level
        
        // Pull camera back a bit to get a wider view of the falling ball
        const distanceBehind = 8;
        cameraPosition.z = this.target.position.z + distanceBehind;
        
        // Apply camera position immediately, without smoothing
        this.camera.position.copy(cameraPosition);
        this.camera.lookAt(this.target.position);
    }

    /**
     * Handle camera during normal gameplay
     */
    handleGameplayCamera(collisionSystem) {
        let cameraPosition = new THREE.Vector3();
        cameraPosition.copy(this.target.position);
        cameraPosition.z += 7; // Camera is 7 units behind the ball
        cameraPosition.y += 3; // Camera is 3 units above the ball
        
        // Apply camera shake if active
        if (collisionSystem && collisionSystem.cameraShake) {
            cameraPosition = collisionSystem.updateCameraShake(
                this.camera, 
                cameraPosition
            );
        }
        
        // Set the camera position with smoothing (lerp)
        this.camera.position.lerp(cameraPosition, this.smoothFactor);
        this.camera.lookAt(this.target.position);
    }
} 
