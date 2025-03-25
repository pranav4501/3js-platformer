import * as THREE from 'three';

/**
 * Creates stadium environment elements
 */
export default class StadiumWalls {
    constructor(scene, fieldModel) {
        this.scene = scene;
        this.fieldModel = fieldModel;
        this.walls = [];  // Array to store collision objects
        this.decorativeObjects = []; // Non-collision decorative elements
        
        this.createStadiumEnvironment();
    }
    
    /**
     * Create the stadium environment
     */
    createStadiumEnvironment() {
        const { width, length, position } = this.fieldModel;
        const buffer = 2; // Extra space between field edge and elements
        
        // Create stands on both sides only
        this.createStands(position, width, length, buffer);
    }
    
    /**
     * Create stands around the field
     */
    createStands(position, width, length, buffer) {
        // Create stands on the sides (moved further away from the pitch)
        this.createStandSection(
            "left",
            position.x + width/2 + buffer + 15, // x position (increased distance from 7.5 to 15)
            position.y, // y position
            position.z, // z position (centered)
            Math.PI/2, // rotation (90 degrees to face right/center)
            length * 0.8, // stand width (now using length for width since rotated)
            30, // stand depth (now using former width for depth)
            8, // number of rows
            2 // base height
        );
        
        this.createStandSection(
            "right",
            position.x - width/2 - buffer - 15, // x position (increased distance from 7.5 to 15)
            position.y, // y position
            position.z, // z position (centered)
            -Math.PI/2, // rotation (-90 degrees to face left/center)
            length * 0.8, // stand width (now using length for width since rotated)
            30, // stand depth (now using former width for depth)
            8, // number of rows
            2 // base height
        );
    }
    
    /**
     * Create a section of stadium seating
     */
    createStandSection(name, xPos, yPos, zPos, rotation, width, depth, numRows, baseHeight) {
        // Create a group for this stand section
        const standGroup = new THREE.Group();
        standGroup.position.set(xPos, yPos, zPos);
        standGroup.rotation.y = rotation;
        
        // Create concrete base
        const baseGeometry = new THREE.BoxGeometry(width, baseHeight, depth);
        const concreteMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x999999,
            roughness: 0.7,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, concreteMaterial);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        standGroup.add(base);
        this.walls.push(base);
        
        // Create rows of seats
        const rowDepth = depth / numRows;
        const rowHeight = 0.7; // Height of each row
        
        // Burgundy color for all seats
        const seatMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x800020, // Burgundy color
            roughness: 0.9,  // Matte finish
            metalness: 0.0   // No metallic look
        });
        
        // Add steps and seats for each row
        for (let row = 0; row < numRows; row++) {
            // Calculate the step height
            const stepHeight = baseHeight + row * rowHeight;
            
            // Create step/tier
            const stepGeometry = new THREE.BoxGeometry(width, rowHeight, rowDepth);
            const step = new THREE.Mesh(stepGeometry, concreteMaterial);
            step.position.set(0, stepHeight + rowHeight/2, -depth/2 + rowDepth/2 + row * rowDepth);
            step.castShadow = true;
            step.receiveShadow = true;
            standGroup.add(step);
            this.walls.push(step);
            
            // Add seats to this row
            const seatWidth = 1.2;
            const seatHeight = 0.4;
            const seatDepth = rowDepth * 0.7;
            const numSeatsPerRow = Math.floor(width / seatWidth) - 1;
            
            for (let seat = 0; seat < numSeatsPerRow; seat++) {
                // Create seat with burgundy material
                const seatGeometry = new THREE.BoxGeometry(seatWidth * 0.8, seatHeight, seatDepth);
                const seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
                
                // Position the seat
                const seatX = -width/2 + seatWidth/2 + seat * seatWidth + seatWidth;
                const seatY = stepHeight + rowHeight + seatHeight/2;
                const seatZ = -depth/2 + row * rowDepth + rowDepth * 0.6;
                
                seatMesh.position.set(seatX, seatY, seatZ);
                seatMesh.castShadow = true;
                seatMesh.receiveShadow = true;
                standGroup.add(seatMesh);
                this.decorativeObjects.push(seatMesh);
            }
        }
        
        // Add railings at the top
        const railingHeight = 1.2;
        const railingGeometry = new THREE.CylinderGeometry(0.05, 0.05, width, 8);
        railingGeometry.rotateZ(Math.PI / 2);
        const railingMaterial = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.8,
            roughness: 0.2
        });
        
        // Top railing (across the top row)
        const topRailing = new THREE.Mesh(railingGeometry, railingMaterial);
        topRailing.position.set(0, baseHeight + numRows * rowHeight + railingHeight, -depth/2 + depth);
        standGroup.add(topRailing);
        this.decorativeObjects.push(topRailing);
        
        // Support railings
        const supportGeometry = new THREE.CylinderGeometry(0.05, 0.05, railingHeight, 8);
        
        // Add supports every few meters
        const numSupports = Math.floor(width / 4) + 1;
        for (let i = 0; i < numSupports; i++) {
            const supportX = -width/2 + (i * (width / (numSupports - 1)));
            const support = new THREE.Mesh(supportGeometry, railingMaterial);
            support.position.set(
                supportX, 
                baseHeight + numRows * rowHeight + railingHeight/2, 
                -depth/2 + depth
            );
            standGroup.add(support);
            this.decorativeObjects.push(support);
        }
        
        // Add the stand group to the scene
        this.scene.add(standGroup);
    }
    
    /**
     * Get all wall meshes (for collision detection)
     */
    getWalls() {
        return this.walls;
    }
} 
