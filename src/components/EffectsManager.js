import * as THREE from 'three';

/**
 * Manages particle effects and visual effects
 */
export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = null;
        
        this.createParticleSystem();
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
     * Hide celebration particles
     */
    hideParticles() {
        this.particles.visible = false;
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
    }
} 
