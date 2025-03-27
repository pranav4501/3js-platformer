import * as THREE from 'three';

/**
 * Manages particle effects and visual effects
 */
export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = null;
        this.goalParticles = null;
        
        this.createParticleSystem();
        this.createGoalParticleSystem();
    }

    /**
     * Create the celebration particle system
     */
    createParticleSystem() {
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
    }
    
    /**
     * Create goal-specific particle system
     */
    createGoalParticleSystem() {
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
    }

    /**
     * Show celebration particles at the goal
     */
    celebrateGoal(goalPosition) {
        // Show particles
        this.particles.visible = true;
        
        // Position particles at the goal
        this.particles.position.copy(goalPosition);
        this.particles.position.y = 1;
    }
    
    /**
     * Show goal effect particles
     */
    showGoalEffect(position) {
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
    }

    /**
     * Hide celebration particles
     */
    hideParticles() {
        this.particles.visible = false;
        this.goalParticles.visible = false;
    }

    /**
     * Update particle animations
     */
    updateParticles(deltaTime) {
        if (this.particles && this.particles.visible) {
            this.particles.rotation.y += deltaTime * 0.5;
            
            // Make particles move upward
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += deltaTime * 1.0; // Move up
                
                // Reset particles that go too high
                if (positions[i + 1] > 10) {
                    positions[i + 1] = 0;
                }
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update goal particles
        if (this.goalParticles && this.goalParticles.visible) {
            const positions = this.goalParticles.geometry.attributes.position.array;
            const velocities = this.goalParticles.userData.velocities;
            
            // Apply gravity and move particles
            for (let i = 0; i < velocities.length; i++) {
                // Update position based on velocity
                positions[i * 3] += velocities[i].x * deltaTime;
                positions[i * 3 + 1] += velocities[i].y * deltaTime;
                positions[i * 3 + 2] += velocities[i].z * deltaTime;
                
                // Apply gravity to y velocity
                velocities[i].y -= 3 * deltaTime;
            }
            
            this.goalParticles.geometry.attributes.position.needsUpdate = true;
            
            // Add rotation for visual appeal
            this.goalParticles.rotation.y += deltaTime * 0.2;
        }
    }
} 
