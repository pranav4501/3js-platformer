import * as THREE from 'three';

/**
 * Provides touch controls for mobile devices
 * - Virtual joystick for movement
 * - Tap area for jumping
 */
export default class TouchControls {
    constructor(onJump, camera) {
        this.onJump = onJump;
        this.camera = camera;
        this.active = false;
        this.joystickActive = false;
        this.joystickOrigin = { x: 0, y: 0 };
        this.joystickPosition = { x: 0, y: 0 };
        this.joystickRadius = 50;
        this.maxDistance = 75;
        this.moveDirection = { x: 0, z: 0 };
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        
        if (this.isMobile) {
            // Only activate controls on mobile devices
            this.setupTouchElements();
            this.setupEventListeners();
            this.active = true;
        }
    }
    
    /**
     * Simple mobile device detection
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth < 768; // Also enable for small screens
    }
    
    /**
     * Create DOM elements for touch controls
     */
    setupTouchElements() {
        // Container for all touch controls
        this.container = document.createElement('div');
        this.container.id = 'touch-controls';
        this.container.style.position = 'absolute';
        this.container.style.bottom = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1000';
        this.container.style.pointerEvents = 'none'; // Allow click-through
        document.body.appendChild(this.container);
        
        // Left side - Joystick area
        this.joystickArea = document.createElement('div');
        this.joystickArea.id = 'joystick-area';
        this.joystickArea.style.position = 'absolute';
        this.joystickArea.style.bottom = '0';
        this.joystickArea.style.left = '0';
        this.joystickArea.style.width = '50%';
        this.joystickArea.style.height = '100%';
        this.joystickArea.style.pointerEvents = 'auto';
        this.joystickArea.style.touchAction = 'none'; // Prevent scrolling while using joystick
        this.container.appendChild(this.joystickArea);
        
        // Right side - Jump area
        this.jumpArea = document.createElement('div');
        this.jumpArea.id = 'jump-area';
        this.jumpArea.style.position = 'absolute';
        this.jumpArea.style.bottom = '0';
        this.jumpArea.style.right = '0';
        this.jumpArea.style.width = '50%';
        this.jumpArea.style.height = '100%';
        this.jumpArea.style.pointerEvents = 'auto';
        this.container.appendChild(this.jumpArea);
        
        // Joystick base (outer circle)
        this.joystickBase = document.createElement('div');
        this.joystickBase.id = 'joystick-base';
        this.joystickBase.style.position = 'absolute';
        this.joystickBase.style.width = `${this.joystickRadius * 2}px`;
        this.joystickBase.style.height = `${this.joystickRadius * 2}px`;
        this.joystickBase.style.borderRadius = '50%';
        this.joystickBase.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        this.joystickBase.style.border = '2px solid rgba(255, 255, 255, 0.7)';
        this.joystickBase.style.display = 'none'; // Hide initially
        this.container.appendChild(this.joystickBase);
        
        // Joystick handle (inner circle)
        this.joystickHandle = document.createElement('div');
        this.joystickHandle.id = 'joystick-handle';
        this.joystickHandle.style.position = 'absolute';
        this.joystickHandle.style.width = `${this.joystickRadius}px`;
        this.joystickHandle.style.height = `${this.joystickRadius}px`;
        this.joystickHandle.style.borderRadius = '50%';
        this.joystickHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        this.joystickHandle.style.display = 'none'; // Hide initially
        this.container.appendChild(this.joystickHandle);
        
        // Jump button indicator (shows on tap)
        this.jumpIndicator = document.createElement('div');
        this.jumpIndicator.id = 'jump-indicator';
        this.jumpIndicator.style.position = 'absolute';
        this.jumpIndicator.style.bottom = '20%';
        this.jumpIndicator.style.right = '20%';
        this.jumpIndicator.style.width = '60px';
        this.jumpIndicator.style.height = '60px';
        this.jumpIndicator.style.borderRadius = '50%';
        this.jumpIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        this.jumpIndicator.style.border = '2px solid rgba(255, 255, 255, 0.6)';
        this.jumpIndicator.style.display = 'block';
        this.jumpIndicator.innerHTML = '<div style="text-align: center; line-height: 60px; color: white;">JUMP</div>';
        this.container.appendChild(this.jumpIndicator);
        
        // Instructions banner for first-time users
        this.instructionsBanner = document.createElement('div');
        this.instructionsBanner.id = 'touch-instructions';
        this.instructionsBanner.style.position = 'absolute';
        this.instructionsBanner.style.top = '20%';
        this.instructionsBanner.style.left = '50%';
        this.instructionsBanner.style.transform = 'translate(-50%, -50%)';
        this.instructionsBanner.style.padding = '15px 20px';
        this.instructionsBanner.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.instructionsBanner.style.color = 'white';
        this.instructionsBanner.style.borderRadius = '10px';
        this.instructionsBanner.style.fontFamily = 'Arial, sans-serif';
        this.instructionsBanner.style.fontSize = '14px';
        this.instructionsBanner.style.textAlign = 'center';
        this.instructionsBanner.style.zIndex = '2000';
        this.instructionsBanner.style.pointerEvents = 'none';
        this.instructionsBanner.innerHTML = 
            '<div style="margin-bottom: 10px; font-weight: bold; font-size: 16px;">MOBILE CONTROLS</div>' +
            '<div>Left side: Touch and drag to move</div>' +
            '<div>Right side: Tap anywhere to jump</div>';
        this.container.appendChild(this.instructionsBanner);
        
        // Auto-hide instructions after a few seconds
        setTimeout(() => {
            this.instructionsBanner.style.opacity = '0';
            this.instructionsBanner.style.transition = 'opacity 1s ease-out';
            
            // Remove from DOM after fade out
            setTimeout(() => {
                if (this.instructionsBanner.parentNode) {
                    this.instructionsBanner.parentNode.removeChild(this.instructionsBanner);
                }
            }, 1000);
        }, 5000);
    }
    
    /**
     * Setup event listeners for touch controls
     */
    setupEventListeners() {
        // Joystick touch events
        this.joystickArea.addEventListener('touchstart', this.handleJoystickStart.bind(this));
        this.joystickArea.addEventListener('touchmove', this.handleJoystickMove.bind(this));
        this.joystickArea.addEventListener('touchend', this.handleJoystickEnd.bind(this));
        
        // Jump area touch event
        this.jumpArea.addEventListener('touchstart', this.handleJump.bind(this));
    }
    
    /**
     * Handle joystick touch start
     */
    handleJoystickStart(event) {
        event.preventDefault();
        
        const touch = event.touches[0];
        this.joystickActive = true;
        
        // Position joystick at touch point
        this.joystickOrigin.x = touch.clientX;
        this.joystickOrigin.y = touch.clientY;
        this.joystickPosition.x = touch.clientX;
        this.joystickPosition.y = touch.clientY;
        
        // Show joystick at touch position
        this.joystickBase.style.display = 'block';
        this.joystickBase.style.left = `${this.joystickOrigin.x - this.joystickRadius}px`;
        this.joystickBase.style.top = `${this.joystickOrigin.y - this.joystickRadius}px`;
        
        this.joystickHandle.style.display = 'block';
        this.joystickHandle.style.left = `${this.joystickPosition.x - this.joystickRadius / 2}px`;
        this.joystickHandle.style.top = `${this.joystickPosition.y - this.joystickRadius / 2}px`;
    }
    
    /**
     * Handle joystick touch move
     */
    handleJoystickMove(event) {
        if (!this.joystickActive) return;
        event.preventDefault();
        
        const touch = event.touches[0];
        this.joystickPosition.x = touch.clientX;
        this.joystickPosition.y = touch.clientY;
        
        // Calculate distance from origin
        const dx = this.joystickPosition.x - this.joystickOrigin.x;
        const dy = this.joystickPosition.y - this.joystickOrigin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction and limit to max distance
        if (distance > this.maxDistance) {
            this.joystickPosition.x = this.joystickOrigin.x + (dx / distance) * this.maxDistance;
            this.joystickPosition.y = this.joystickOrigin.y + (dy / distance) * this.maxDistance;
        }
        
        // Calculate normalized direction values (-1 to 1)
        this.moveDirection.x = (this.joystickPosition.x - this.joystickOrigin.x) / this.maxDistance;
        this.moveDirection.z = (this.joystickPosition.y - this.joystickOrigin.y) / this.maxDistance;
        
        // Update joystick handle position
        this.joystickHandle.style.left = `${this.joystickPosition.x - this.joystickRadius / 2}px`;
        this.joystickHandle.style.top = `${this.joystickPosition.y - this.joystickRadius / 2}px`;
    }
    
    /**
     * Handle joystick touch end
     */
    handleJoystickEnd(event) {
        event.preventDefault();
        
        this.joystickActive = false;
        this.moveDirection.x = 0;
        this.moveDirection.z = 0;
        
        // Hide joystick
        this.joystickBase.style.display = 'none';
        this.joystickHandle.style.display = 'none';
    }
    
    /**
     * Handle jump touch
     */
    handleJump(event) {
        event.preventDefault();
        
        // Call the jump callback
        this.onJump();
        
        // Visual feedback
        this.jumpIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        setTimeout(() => {
            this.jumpIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }, 200);
    }
    
    /**
     * Get the current movement direction for use in the game
     */
    getMovementDirection() {
        if (!this.active || !this.isMobile) return { x: 0, z: 0 };
        
        // For camera-relative controls, first get the camera rotation
        // This ensures movement is relative to camera view (forward is always away from camera)
        const cameraAngle = Math.atan2(
            this.camera.matrix.elements[8], 
            this.camera.matrix.elements[10]
        );
        
        // Apply camera rotation to convert screen coordinates to world coordinates
        const rotatedX = this.moveDirection.x * Math.cos(cameraAngle) - this.moveDirection.z * Math.sin(cameraAngle);
        const rotatedZ = this.moveDirection.x * Math.sin(cameraAngle) + this.moveDirection.z * Math.cos(cameraAngle);
        
        return { 
            x: rotatedX, 
            z: rotatedZ 
        };
    }
    
    /**
     * Check if controls are active
     */
    isActive() {
        return this.active;
    }
    
    /**
     * Update method for any animations or state changes
     */
    update() {
        // Future animations or state updates can go here
    }
    
    /**
     * Resize handler for responsive design
     */
    resize() {
        // Update sizes if needed when window is resized
    }
    
    /**
     * Clean up event listeners and DOM elements
     */
    dispose() {
        if (this.container && this.container.parentNode) {
            // Remove event listeners
            this.joystickArea.removeEventListener('touchstart', this.handleJoystickStart);
            this.joystickArea.removeEventListener('touchmove', this.handleJoystickMove);
            this.joystickArea.removeEventListener('touchend', this.handleJoystickEnd);
            this.jumpArea.removeEventListener('touchstart', this.handleJump);
            
            // Remove DOM elements
            document.body.removeChild(this.container);
        }
    }
} 