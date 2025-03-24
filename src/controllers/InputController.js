import * as THREE from 'three';

export default class InputController {
    constructor(gameController) {
        this.gameController = gameController;
        this.ballModel = this.gameController.ballModel;
        
        // State for tracking key presses
        this.keys = {
            forward: false,  // W, Up arrow
            back: false,     // S, Down arrow
            left: false,     // A, Left arrow
            right: false,    // D, Right arrow
            jump: false      // Space
        };
        
        // Force values for ball movement
        this.forceValues = {
            movement: 15,    // Force for WASD movement
            jump: 10         // Force for jump
        };
        
        // Touch screen controls
        this.touchStartPosition = null;
        this.touchCurrentPosition = null;
        this.isTouching = false;
        
        // Joystick controls for mobile (only show on touch devices)
        this.mobileDetected = 'ontouchstart' in window;
        this.joystickSize = 120;
        
        // Bind event handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }
    
    init() {
        // Attach keyboard event listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        
        // Attach touch event listeners
        if (this.mobileDetected) {
            window.addEventListener('touchstart', this.onTouchStart);
            window.addEventListener('touchmove', this.onTouchMove);
            window.addEventListener('touchend', this.onTouchEnd);
            
            // Create touch joystick and button if on mobile
            this.createMobileControls();
        }
    }
    
    createMobileControls() {
        // Create joystick container
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'joystick-container';
        joystickContainer.style.position = 'absolute';
        joystickContainer.style.left = '20px';
        joystickContainer.style.bottom = '20px';
        joystickContainer.style.width = `${this.joystickSize}px`;
        joystickContainer.style.height = `${this.joystickSize}px`;
        joystickContainer.style.borderRadius = '50%';
        joystickContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        joystickContainer.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        joystickContainer.style.zIndex = '100';
        joystickContainer.style.touchAction = 'none';
        document.body.appendChild(joystickContainer);
        
        // Create joystick stick
        const joystickStick = document.createElement('div');
        joystickStick.id = 'joystick-stick';
        joystickStick.style.position = 'absolute';
        joystickStick.style.left = '50%';
        joystickStick.style.top = '50%';
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystickStick.style.width = `${this.joystickSize / 2}px`;
        joystickStick.style.height = `${this.joystickSize / 2}px`;
        joystickStick.style.borderRadius = '50%';
        joystickStick.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        joystickStick.style.pointerEvents = 'none';
        joystickContainer.appendChild(joystickStick);
        
        // Create jump button
        const jumpButton = document.createElement('div');
        jumpButton.id = 'jump-button';
        jumpButton.style.position = 'absolute';
        jumpButton.style.right = '30px';
        jumpButton.style.bottom = '30px';
        jumpButton.style.width = '70px';
        jumpButton.style.height = '70px';
        jumpButton.style.borderRadius = '50%';
        jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        jumpButton.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        jumpButton.style.zIndex = '100';
        jumpButton.style.display = 'flex';
        jumpButton.style.justifyContent = 'center';
        jumpButton.style.alignItems = 'center';
        jumpButton.style.color = 'white';
        jumpButton.style.fontSize = '16px';
        jumpButton.style.fontFamily = 'Arial, sans-serif';
        jumpButton.textContent = 'JUMP';
        document.body.appendChild(jumpButton);
        
        // Add jump button event listeners
        jumpButton.addEventListener('touchstart', () => {
            this.keys.jump = true;
        });
        jumpButton.addEventListener('touchend', () => {
            this.keys.jump = false;
        });
        
        // Store elements for touch handling
        this.joystickContainer = joystickContainer;
        this.joystickStick = joystickStick;
        this.jumpButton = jumpButton;
    }
    
    onKeyDown(event) {
        if (!this.gameController.gameModel.isPlaying) return;
        
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.back = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.back = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
        }
    }
    
    onTouchStart(event) {
        if (!this.gameController.gameModel.isPlaying) return;
        
        const touch = event.touches[0];
        
        // Check if touch is on joystick
        if (this.isTouchOnJoystick(touch)) {
            this.isTouching = true;
            this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
            this.touchCurrentPosition = { x: touch.clientX, y: touch.clientY };
            this.updateJoystickPosition();
        }
    }
    
    onTouchMove(event) {
        if (!this.isTouching) return;
        
        const touch = event.touches[0];
        this.touchCurrentPosition = { x: touch.clientX, y: touch.clientY };
        this.updateJoystickPosition();
        
        // Prevent default to avoid scrolling
        event.preventDefault();
    }
    
    onTouchEnd() {
        this.isTouching = false;
        
        // Reset joystick position
        if (this.joystickStick) {
            this.joystickStick.style.left = '50%';
            this.joystickStick.style.top = '50%';
            this.joystickStick.style.transform = 'translate(-50%, -50%)';
        }
        
        // Reset movement keys
        this.keys.forward = false;
        this.keys.back = false;
        this.keys.left = false;
        this.keys.right = false;
    }
    
    isTouchOnJoystick(touch) {
        if (!this.joystickContainer) return false;
        
        const rect = this.joystickContainer.getBoundingClientRect();
        return (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
        );
    }
    
    updateJoystickPosition() {
        if (!this.joystickStick || !this.touchStartPosition || !this.touchCurrentPosition) return;
        
        // Calculate distance from start
        const deltaX = this.touchCurrentPosition.x - this.touchStartPosition.x;
        const deltaY = this.touchCurrentPosition.y - this.touchStartPosition.y;
        
        // Calculate distance for limiting joystick movement
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxRadius = this.joystickSize / 3;
        
        // Apply limits to joystick movement
        let limitedX = deltaX;
        let limitedY = deltaY;
        
        if (distance > maxRadius) {
            const ratio = maxRadius / distance;
            limitedX = deltaX * ratio;
            limitedY = deltaY * ratio;
        }
        
        // Move joystick stick
        this.joystickStick.style.left = `calc(50% + ${limitedX}px)`;
        this.joystickStick.style.top = `calc(50% + ${limitedY}px)`;
        
        // Update movement keys based on joystick position
        const threshold = maxRadius * 0.3;
        this.keys.forward = limitedY < -threshold;
        this.keys.back = limitedY > threshold;
        this.keys.left = limitedX < -threshold;
        this.keys.right = limitedX > threshold;
    }
    
    update() {
        if (!this.gameController.gameModel.isPlaying) return;
        
        // Calculate movement direction
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        // Get camera's orientation
        const camera = this.gameController.sceneView.camera;
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(camera.quaternion);
        cameraDirection.y = 0; // Keep movement horizontal
        cameraDirection.normalize();
        
        // Calculate forward/backward direction (relative to camera)
        const forwardDirection = cameraDirection.clone();
        const rightDirection = new THREE.Vector3().crossVectors(
            new THREE.Vector3(0, 1, 0),
            forwardDirection
        ).normalize();
        
        // Apply forces based on key presses
        if (this.keys.forward) {
            moveDirection.add(forwardDirection);
        }
        if (this.keys.back) {
            moveDirection.sub(forwardDirection);
        }
        if (this.keys.right) {
            moveDirection.add(rightDirection);
        }
        if (this.keys.left) {
            moveDirection.sub(rightDirection);
        }
        
        // Normalize movement direction
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Apply force to ball
            this.ballModel.applyForce({
                x: moveDirection.x * this.forceValues.movement,
                y: 0,
                z: moveDirection.z * this.forceValues.movement
            });
        }
        
        // Apply jump force if on ground
        if (this.keys.jump && this.ballModel.onGround) {
            this.ballModel.applyForce({
                x: 0,
                y: this.forceValues.jump,
                z: 0
            });
        }
    }
} 
