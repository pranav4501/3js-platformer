import * as THREE from 'three';

/**
 * Creates and manages minimal clouds in the sky
 */
export default class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.cloudMeshes = [];
        this.bounds = {
            minX: -200,
            maxX: 200,
            minY: 30,  // Lowered the height to make them more visible
            maxY: 60,  // Lowered the maximum height
            minZ: -200,
            maxZ: 200
        };
        
        // Create clouds
        this.createClouds(25); // Reduced count from 25 to 20
    }
    
    /**
     * Create multiple clouds
     */
    createClouds(count) {
        for (let i = 0; i < count; i++) {
            const cloud = this.createCloud();
            this.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }
    
    /**
     * Create a single minimal cloud
     */
    createCloud() {
        // Create a group for the cloud
        const cloud = new THREE.Group();
        
        // Random position within bounds (higher in the sky)
        const x = Math.random() * (this.bounds.maxX - this.bounds.minX) + this.bounds.minX;
        const y = Math.random() * (this.bounds.maxY - this.bounds.minY) + this.bounds.minY;
        const z = Math.random() * (this.bounds.maxZ - this.bounds.minZ) + this.bounds.minZ;
        cloud.position.set(x, y, z);
        
        // Smaller scale for less dominant clouds
        const scale = 6 + Math.random() * 4; // Reduced from 6-16 to 2-6
        cloud.scale.set(scale, scale * 0.3, scale * 0.8); // Made slightly flatter
        
        // Create cloud material with better visibility
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 1, 1), // Pure white
            transparent: true,
            opacity: 0.6 + Math.random() * 0.3, // Slightly reduced opacity
            side: THREE.DoubleSide // Make clouds visible from both sides
        });
        
        // Create puffs for clouds
        const puffCount = 2 + Math.floor(Math.random() * 2); // Reduced from 3-5 to 2-3
        
        // Create simplified puffs
        for (let i = 0; i < puffCount; i++) {
            // Create a flat disc for wispy cloud
            const puffSize = 0.8 + Math.random() * 1.2; // Reduced from 1.2-3.0 to 0.8-2.0
            const geometry = new THREE.CircleGeometry(puffSize, 8); // Circle for better visibility
            const puff = new THREE.Mesh(geometry, cloudMaterial);
            
            // Spread puffs out horizontally
            const puffX = (i - puffCount / 2) * 1.5; // Reduced spread from 2 to 1.5
            const puffY = Math.random() * 0.3; // Reduced vertical variation from 0.5 to 0.3
            const puffZ = Math.random() * 0.6 - 0.3; // Reduced from 1 to 0.6
            puff.position.set(puffX, puffY, puffZ);
            
            // Make puffs face camera
            puff.lookAt(0, 0, 0);
            
            cloud.add(puff);
            this.cloudMeshes.push(puff);
        }
        
        // Set cloud properties for animation
        cloud.userData = {
            speedX: (Math.random() - 0.5) * 0.2,     // Slightly reduced speed
            originalY: y,                           
            oscillation: 0.2 + Math.random() * 0.3,  // Gentle oscillation
            oscillationPhase: Math.random() * Math.PI * 2
        };
        
        return cloud;
    }
    
    /**
     * Update cloud positions for animation
     */
    update(deltaTime) {
        // Make sure camera is looking at clouds by rotating clouds to face camera
        const cameraPosition = this.scene.getObjectByProperty('type', 'PerspectiveCamera')?.position || new THREE.Vector3(0, 0, 0);
        
        // Update each cloud
        this.clouds.forEach(cloud => {
            // Get cloud properties
            const { speedX, originalY, oscillation, oscillationPhase } = cloud.userData;
            
            // Move cloud horizontally
            cloud.position.x += speedX * deltaTime;
            
            // Very subtle vertical oscillation
            cloud.position.y = originalY + Math.sin((Date.now() * 0.0005 + oscillationPhase) * oscillation) * 0.3;
            
            // Make all cloud puffs face the camera
            cloud.children.forEach(puff => {
                puff.lookAt(cameraPosition);
            });
            
            // Wrap around when out of bounds
            if (cloud.position.x > this.bounds.maxX) {
                cloud.position.x = this.bounds.minX;
            } else if (cloud.position.x < this.bounds.minX) {
                cloud.position.x = this.bounds.maxX;
            }
        });
    }
} 