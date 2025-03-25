import * as THREE from 'three';

/**
 * Represents a wind blower obstacle that pushes the ball
 */
export default class WindBlower {
    constructor(scene, position, direction, force = 15, width = 2, height = 1.5) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.clone().normalize();
        this.force = force;
        this.width = width;
        this.height = height;
        this.mesh = new THREE.Group();
        this.effectRadius = 4; // How far the wind effect reaches
        
        // Create the wind blower visual model
        this.createModel();
        
        // Create the wind effect visualization
        this.createWindEffect();
        
        // Position the entire group
        this.mesh.position.copy(this.position);
        
        // Rotate to face the wind direction
        const lookAtPos = new THREE.Vector3().copy(this.position).add(this.direction);
        this.mesh.lookAt(lookAtPos);
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    /**
     * Create the wind blower model
     */
    createModel() {
        // Create fan housing
        const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.9, 0.8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.7,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Rotate to point forward
        
        // Create fan blades
        const bladeGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.05);
        const bladeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Fan rotation group
        this.fanGroup = new THREE.Group();
        
        // Create 4 blades
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.y = 0.25; // Half the blade height
            blade.rotation.z = (Math.PI / 2) * i;
            this.fanGroup.add(blade);
        }
        
        // Position fan blades
        this.fanGroup.position.z = 0.1;
        
        // Create stand
        const standGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
        const standMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.8,
            metalness: 0.2
        });
        const stand = new THREE.Mesh(standGeometry, standMaterial);
        stand.position.y = -0.9; // Position below the fan
        
        // Add all components to main mesh
        this.mesh.add(body);
        this.mesh.add(this.fanGroup);
        this.mesh.add(stand);
    }
    
    /**
     * Create visual effect for the wind
     */
    createWindEffect() {
        // Create particles for wind effect
        const particleCount = 150;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        // Wind cone extends in the direction of the wind
        for (let i = 0; i < particleCount; i++) {
            // Random position within conical area
            const distance = Math.random() * this.effectRadius;
            const angle = Math.random() * Math.PI * 2;
            const spreadFactor = distance / this.effectRadius * this.width;
            
            particlePositions[i * 3] = Math.cos(angle) * spreadFactor;
            particlePositions[i * 3 + 1] = Math.sin(angle) * spreadFactor;
            particlePositions[i * 3 + 2] = distance;
            
            // Particles get smaller further from source
            particleSizes[i] = (1 - distance / this.effectRadius) * 0.2 + 0.05;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        // Semi-transparent wind particle
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xadd8e6, // Light blue
            size: 0.2,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.windParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.windParticles.position.z = 0.4; // Position in front of fan
        this.mesh.add(this.windParticles);
        
        // Add helper to visualize wind force area
        const visualizerGeometry = new THREE.ConeGeometry(this.width, this.effectRadius, 16);
        const visualizerMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const visualizer = new THREE.Mesh(visualizerGeometry, visualizerMaterial);
        visualizer.rotation.x = Math.PI / 2; // Rotate to point forward
        visualizer.position.z = this.effectRadius / 2 + 0.4; // Center cone in front of fan
        this.mesh.add(visualizer);
    }
    
    /**
     * Update the wind blower (rotating fan, etc)
     */
    update(deltaTime) {
        // Rotate the fan blades
        this.fanGroup.rotation.z += deltaTime * 10;
        
        // Animate the wind particles
        if (this.windParticles) {
            const positions = this.windParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                // Move particles forward
                positions[i + 2] += deltaTime * 5;
                
                // If particle reaches end of cone, reset to beginning
                if (positions[i + 2] > this.effectRadius) {
                    positions[i + 2] = 0;
                    
                    // Reset x/y position as well
                    const angle = Math.random() * Math.PI * 2;
                    positions[i] = Math.cos(angle) * 0.2;
                    positions[i + 1] = Math.sin(angle) * 0.2;
                } else {
                    // Expand particle position as it moves away (cone shape)
                    const distanceFactor = positions[i + 2] / this.effectRadius;
                    const spreadFactor = this.width * distanceFactor;
                    
                    // Gradually move to wider area
                    positions[i] *= 1 + deltaTime;
                    positions[i + 1] *= 1 + deltaTime;
                    
                    // Keep within cone bounds
                    const currentDist = Math.sqrt(positions[i] * positions[i] + positions[i + 1] * positions[i + 1]);
                    if (currentDist > spreadFactor) {
                        const scaleFactor = spreadFactor / currentDist;
                        positions[i] *= scaleFactor;
                        positions[i + 1] *= scaleFactor;
                    }
                }
            }
            this.windParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    /**
     * Apply wind force to the ball if it's in range
     */
    applyWindForce(ball, ballPhysics) {
        // Convert ball position to local space of the wind blower
        const ballLocal = new THREE.Vector3();
        ballLocal.copy(ball.position).sub(this.mesh.position);
        
        // Transform to wind blower's local coordinate system
        const windMatrix = new THREE.Matrix4().extractRotation(this.mesh.matrix);
        ballLocal.applyMatrix4(windMatrix.invert());
        
        // Check if ball is in front of the fan (positive z in local space)
        if (ballLocal.z > 0 && ballLocal.z < this.effectRadius) {
            // Check if ball is within the cone
            const maxRadius = (ballLocal.z / this.effectRadius) * this.width;
            const horizontalDist = Math.sqrt(ballLocal.x * ballLocal.x + ballLocal.y * ballLocal.y);
            
            if (horizontalDist < maxRadius) {
                // Calculate force based on distance
                const forceFactor = 1 - (ballLocal.z / this.effectRadius);
                const windForce = new THREE.Vector3().copy(this.direction).multiplyScalar(this.force * forceFactor);
                
                // Apply force to ball
                ballPhysics.applyForce(windForce);
                
                // Create a visual effect for strong wind
                if (forceFactor > 0.7 && Math.random() > 0.9) {
                    this.createWindImpactEffect(ball.position);
                }
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * Visual effect when wind strongly impacts the ball
     */
    createWindImpactEffect(position) {
        // Simple particle burst
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Set initial positions
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xadd8e6,
            size: 0.2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const effect = new THREE.Points(particleGeometry, particleMaterial);
        effect.userData = {
            isWindEffect: true,
            creationTime: Date.now(),
            velocities: Array(particleCount).fill().map(() => {
                return new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(Math.random() * 2 + 1);
            })
        };
        
        this.scene.add(effect);
        
        // Remove after 500ms
        setTimeout(() => {
            this.scene.remove(effect);
        }, 500);
    }
    
    /**
     * Get the mesh of the wind blower
     */
    getMesh() {
        return this.mesh;
    }
} 