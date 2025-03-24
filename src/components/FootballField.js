import * as THREE from 'three';

/**
 * Creates and manages the football field
 */
export default class FootballField {
    constructor() {
        this.fieldWidth = 10; // Match the space between walls
        this.fieldLength = 60; // Match the wall length
        this.floorGroup = this.createCorridorFloor();
    }

    /**
     * Create a proper floor for the corridor
     */
    createCorridorFloor() {
        // Create a group to hold all floor elements
        const floorGroup = new THREE.Group();
        floorGroup.position.set(0, -0.49, -25); // Slightly above ground to prevent z-fighting
        
        // Main floor - simple grass material
        const floorGeometry = new THREE.PlaneGeometry(this.fieldWidth, this.fieldLength);
        
        // Create simple grass material
        const grassMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50,  // Simple grass green color
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        const floor = new THREE.Mesh(floorGeometry, grassMaterial);
        floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        floor.receiveShadow = true;
        floorGroup.add(floor);
        
        // Add simple field markings (white lines)
        const lineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,  // White line
            side: THREE.DoubleSide
        });
        
        // Side lines
        const sideLineWidth = 0.1;
        const leftLineGeometry = new THREE.PlaneGeometry(sideLineWidth, this.fieldLength);
        const leftLine = new THREE.Mesh(leftLineGeometry, lineMaterial);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-this.fieldWidth/2 + 0.5, 0.01, 0);
        leftLine.receiveShadow = true;
        leftLine.userData.isLine = true;
        floorGroup.add(leftLine);
        
        const rightLineGeometry = new THREE.PlaneGeometry(sideLineWidth, this.fieldLength);
        const rightLine = new THREE.Mesh(rightLineGeometry, lineMaterial);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(this.fieldWidth/2 - 0.5, 0.01, 0);
        rightLine.receiveShadow = true;
        rightLine.userData.isLine = true;
        floorGroup.add(rightLine);
        
        // Simple goal area outline
        const goalAreaWidth = 8;
        const goalAreaDepth = 5;
        
        // Goal line
        const goalLineGeometry = new THREE.PlaneGeometry(goalAreaWidth, sideLineWidth);
        const goalLine = new THREE.Mesh(goalLineGeometry, lineMaterial);
        goalLine.rotation.x = -Math.PI / 2;
        goalLine.position.set(0, 0.01, -this.fieldLength/2 + goalAreaDepth);
        goalLine.receiveShadow = true;
        goalLine.userData.isLine = true;
        floorGroup.add(goalLine);
        
        // Goal area side lines
        const leftGoalLineGeometry = new THREE.PlaneGeometry(sideLineWidth, goalAreaDepth);
        const leftGoalLine = new THREE.Mesh(leftGoalLineGeometry, lineMaterial);
        leftGoalLine.rotation.x = -Math.PI / 2;
        leftGoalLine.position.set(-goalAreaWidth/2, 0.01, -this.fieldLength/2 + goalAreaDepth/2);
        leftGoalLine.receiveShadow = true;
        leftGoalLine.userData.isLine = true;
        floorGroup.add(leftGoalLine);
        
        const rightGoalLineGeometry = new THREE.PlaneGeometry(sideLineWidth, goalAreaDepth);
        const rightGoalLine = new THREE.Mesh(rightGoalLineGeometry, lineMaterial);
        rightGoalLine.rotation.x = -Math.PI / 2;
        rightGoalLine.position.set(goalAreaWidth/2, 0.01, -this.fieldLength/2 + goalAreaDepth/2);
        rightGoalLine.receiveShadow = true;
        rightGoalLine.userData.isLine = true;
        floorGroup.add(rightGoalLine);
        
        return floorGroup;
    }

    /**
     * Get the field boundaries
     */
    getBoundaries() {
        const goalPosition = new THREE.Vector3(0, 0, -50);
        const goalDepth = 1.5;
        
        return {
            minX: -this.fieldWidth/2,        // Left edge of field
            maxX: this.fieldWidth/2,         // Right edge of field
            minZ: goalPosition.z - goalDepth - 1, // Behind goal
            maxZ: 5                          // Start area (don't go backward)
        };
    }

    /**
     * Get the floor group
     */
    getFloorGroup() {
        return this.floorGroup;
    }

    /**
     * Get the main floor mesh (for collision detection)
     */
    getFloor() {
        return this.floorGroup.children.find(child => !child.userData.isLine);
    }
} 
