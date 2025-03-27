import * as THREE from 'three';

/**
 * Manages particle effects and visual effects
 */
export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = null;
        this.goalParticles = null;
        this.confetti = null;
        this.goalPosition = new THREE.Vector3(0, 0, -45); // Store goal position for confetti reset
        
        // Create confetti system
        this.createConfettiSystem();
    }

    /**
     * Create the celebration particle system
     */
    createParticleSystem() {
        /* Commented out as requested
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3); // xyz
        const particleColors = new Float32Array(particleCount * 3); // rgb
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions in a sphere
            const x = (Math.random() - 0.5) * 10;
            const y = Math.random() * 10;
            const z = (Math.random() - 0.5) * 10;
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
            
            // Random rainbow colors
            particleColors[i * 3] = Math.random();
            particleColors[i * 3 + 1] = Math.random();
            particleColors[i * 3 + 2] = Math.random();
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.particles.visible = false; // Hide initially
        this.scene.add(this.particles);
        */
    }
    
    /**
     * Create goal-specific confetti system
     */
    createConfettiSystem() {
        const particleCount = 90;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleColors = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        // Create confetti with random positions behind the goal
        for (let i = 0; i < particleCount; i++) {
            // Random positions in a rectangular area behind the goal
            const x = (Math.random() - 0.5) * 8;     // -4 to 4 (width of goal area)
            const y = Math.random() * 8 + 3;         // 3 to 11 (above the ground)
            const z = -45 + (Math.random() - 0.5);   // Just behind the goal at -45
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
            
            // Vibrant random colors for confetti
            particleColors[i * 3] = Math.random();     // R
            particleColors[i * 3 + 1] = Math.random(); // G
            particleColors[i * 3 + 2] = Math.random(); // B
            
            // Random sizes for confetti pieces
            particleSizes[i] = Math.random() * 0.3 + 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        // Create texture for confetti particles
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Draw a small rectangle to represent confetti
        context.fillStyle = 'white';
        context.fillRect(16, 16, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create material with the texture
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            map: texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            alphaTest: 0.1
        });
        
        this.confetti = new THREE.Points(particleGeometry, particleMaterial);
        this.confetti.visible = false;
        
        // Store velocity and rotation data for each particle
        this.confetti.userData = {
            velocities: new Array(particleCount).fill().map(() => 
                new THREE.Vector3(
                    (Math.random() - 0.5) * 2,     // Random X velocity
                    -1 - Math.random() * 2,         // Falling (negative Y velocity)
                    (Math.random() - 0.5) * 0.5     // Slight Z movement
                )
            ),
            rotations: new Array(particleCount).fill().map(() => 
                new THREE.Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                )
            ),
            startTime: 0
        };
        
        this.scene.add(this.confetti);
    }
    
    /**
     * Create goal-specific particle system
     */
    createGoalParticleSystem() {
        /* Commented out as requested
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        // Create particles with random positions
        for (let i = 0; i < particleCount; i++) {
            // Random positions in a sphere
            const radius = 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
            
            // Random sizes
            particleSizes[i] = Math.random() * 0.3 + 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        // Create textures for particles - using a simple circle
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 64;
        textureCanvas.height = 64;
        const context = textureCanvas.getContext('2d');
        
        // Draw a circle
        context.beginPath();
        context.arc(32, 32, 28, 0, Math.PI * 2);
        context.fillStyle = 'white';
        context.fill();
        
        const texture = new THREE.CanvasTexture(textureCanvas);
        
        // Create material with the texture
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            map: texture,
            transparent: true,
            vertexColors: false,
            alphaTest: 0.1
        });
        
        this.goalParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.goalParticles.visible = false;
        this.goalParticles.userData = {
            velocities: new Array(particleCount).fill().map(() => 
                new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.2) * 3 + 1,
                    (Math.random() - 0.5) * 3
                )
            ),
            startTime: 0,
            duration: 2000 // milliseconds
        };
        
        this.scene.add(this.goalParticles);
        */
    }

    /**
     * Show celebration particles at the goal
     */
    celebrateGoal(goalPosition) {
        // Commented out as requested
        /*
        // Show particles
        this.particles.visible = true;
        
        // Position particles at the goal
        this.particles.position.copy(goalPosition);
        this.particles.position.y = 1;
        */
    }
    
    /**
     * Show goal effect particles
     */
    showGoalEffect(position) {
        // Commented out as requested
        /*
        // Show the goal particles
        this.goalParticles.visible = true;
        
        // Position the particles at the ball's position
        this.goalParticles.position.copy(position);
        
        // Record start time
        this.goalParticles.userData.startTime = Date.now();
        
        // Make celebration particles visible too
        this.particles.visible = true;
        this.particles.position.copy(position);
        
        // Automatically hide goal particles after their duration
        setTimeout(() => {
            this.goalParticles.visible = false;
        }, this.goalParticles.userData.duration);
        */
    }
    
    /**
     * Show confetti celebration at the goal
     * @param {THREE.Vector3} goalPosition - Position of the goal
     */
    showConfetti(goalPosition) {
        if (this.confetti) {
            // Store goal position for resetting particles
            if (goalPosition) {
                this.goalPosition.copy(goalPosition);
            }
            
            // Reset all confetti positions to start from the goal
            this.resetConfettiToGoal();
            
            // Make confetti visible
            this.confetti.visible = true;
            
            // Record start time
            this.confetti.userData.startTime = Date.now();
        }
    }
    
    /**
     * Reset all confetti particles to the goal position
     */
    resetConfettiToGoal() {
        if (!this.confetti) return;
        
        // Reset confetti positions
        const positions = this.confetti.geometry.attributes.position.array;
        const particleCount = positions.length / 3;
        
        // Use the stored goal position
        const goalX = this.goalPosition.x;
        const goalY = this.goalPosition.y;
        const goalZ = this.goalPosition.z;
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions in a rectangular area inside the goal
            positions[i * 3] = goalX + (Math.random() - 0.5) * 8;     // -4 to 4 (width of goal area)
            positions[i * 3 + 1] = goalY + Math.random() * 5 + 1;     // 1 to 6 (above the ground inside goal)
            positions[i * 3 + 2] = goalZ + (Math.random() - 0.5) * 2; // Inside the goal depth
        }
        this.confetti.geometry.attributes.position.needsUpdate = true;
        
        // Reset velocities
        this.confetti.userData.velocities = new Array(particleCount).fill().map(() => 
            new THREE.Vector3(
                (Math.random() - 0.5) * 2,     // Random X velocity
                -1 - Math.random() * 2,         // Falling (negative Y velocity)
                (Math.random() - 0.5) * 0.5     // Slight Z movement
            )
        );
        
        // Reset the confetti mesh position and rotation
        this.confetti.position.set(0, 0, 0);
        this.confetti.rotation.set(0, 0, 0);
    }

    /**
     * Hide celebration particles
     */
    hideParticles() {
        if (this.particles) {
            this.particles.visible = false;
        }
        if (this.goalParticles) {
            this.goalParticles.visible = false;
        }
        if (this.confetti) {
            this.confetti.visible = false;
        }
    }

    /**
     * Update particle animations
     */
    updateParticles(deltaTime) {
        /* Commented out as requested */
        
        // Update confetti particles
        if (this.confetti && this.confetti.visible) {
            const positions = this.confetti.geometry.attributes.position.array;
            const velocities = this.confetti.userData.velocities;
            
            // Update each confetti particle
            for (let i = 0; i < velocities.length; i++) {
                // Update position based on velocity
                positions[i * 3] += velocities[i].x * deltaTime;
                positions[i * 3 + 1] += velocities[i].y * deltaTime;
                positions[i * 3 + 2] += velocities[i].z * deltaTime;
                
                // Apply slight gravity effect
                velocities[i].y -= 0.5 * deltaTime;
                
                // Add slight wind effect - reduced to minimize drift
                velocities[i].x += (Math.random() - 0.5) * 0.1 * deltaTime;
                
                // If confetti falls below ground or drifts too far, reset it to the goal position
                if (positions[i * 3 + 1] < 0 || 
                    Math.abs(positions[i * 3] - this.goalPosition.x) > 15 ||
                    Math.abs(positions[i * 3 + 2] - this.goalPosition.z) > 15) {
                    positions[i * 3 + 1] = this.goalPosition.y + Math.random() * 5 + 1;
                    positions[i * 3] = this.goalPosition.x + (Math.random() - 0.5) * 8;
                    positions[i * 3 + 2] = this.goalPosition.z + (Math.random() - 0.5) * 2;
                    velocities[i].y = -1 - Math.random() * 2;
                    velocities[i].x = (Math.random() - 0.5) * 2;
                    velocities[i].z = (Math.random() - 0.5) * 0.5;
                }
            }
            
            this.confetti.geometry.attributes.position.needsUpdate = true;
            
            // Reduced rotation speed to minimize drift
            this.confetti.rotation.y += deltaTime * 0.05;
        }
    }
} 
