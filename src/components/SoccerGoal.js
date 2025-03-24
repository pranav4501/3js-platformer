import * as THREE from 'three';

/**
 * Creates and manages the soccer goal
 */
export default class SoccerGoal {
    constructor() {
        this.goalWidth = 5;
        this.goalHeight = 2.5;
        this.goalDepth = 1.5;
        this.poleRadius = 0.1;
        this.position = new THREE.Vector3(0, 0, -50); // Position at end of corridor
        this.group = new THREE.Group();
        this.trigger = null;
        
        this.createGoal();
    }

    /**
     * Create the soccer goal with all its parts
     */
    createGoal() {
        // Create a group to hold all goal parts
        this.group.position.copy(this.position);
        
        // Goal material (white poles)
        const poleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.2
        });
        
        // Create a simple hollow cube by creating edges
        const edges = [
            // Back frame
            { start: [-this.goalWidth/2, 0, -this.goalDepth], end: [this.goalWidth/2, 0, -this.goalDepth] }, // bottom back
            { start: [-this.goalWidth/2, this.goalHeight, -this.goalDepth], end: [this.goalWidth/2, this.goalHeight, -this.goalDepth] }, // top back
            { start: [-this.goalWidth/2, 0, -this.goalDepth], end: [-this.goalWidth/2, this.goalHeight, -this.goalDepth] }, // left back
            { start: [this.goalWidth/2, 0, -this.goalDepth], end: [this.goalWidth/2, this.goalHeight, -this.goalDepth] }, // right back
            
            // Connections to front (top and sides only)
            { start: [-this.goalWidth/2, this.goalHeight, -this.goalDepth], end: [-this.goalWidth/2, this.goalHeight, 0] }, // top left edge
            { start: [this.goalWidth/2, this.goalHeight, -this.goalDepth], end: [this.goalWidth/2, this.goalHeight, 0] }, // top right edge
            { start: [-this.goalWidth/2, 0, -this.goalDepth], end: [-this.goalWidth/2, 0, 0] }, // bottom left edge
            { start: [this.goalWidth/2, 0, -this.goalDepth], end: [this.goalWidth/2, 0, 0] }, // bottom right edge
            
            // Front frame (no bottom edge to allow ball entry)
            { start: [-this.goalWidth/2, this.goalHeight, 0], end: [this.goalWidth/2, this.goalHeight, 0] }, // top front
            { start: [-this.goalWidth/2, 0, 0], end: [-this.goalWidth/2, this.goalHeight, 0] }, // left front
            { start: [this.goalWidth/2, 0, 0], end: [this.goalWidth/2, this.goalHeight, 0] }  // right front
            // Bottom front edge REMOVED to allow ball to enter
        ];
        
        // Create each edge as a cylinder
        edges.forEach(edge => {
            const start = new THREE.Vector3(edge.start[0], edge.start[1], edge.start[2]);
            const end = new THREE.Vector3(edge.end[0], edge.end[1], edge.end[2]);
            
            // Calculate length and position
            const direction = end.clone().sub(start);
            const length = direction.length();
            const position = start.clone().add(end).multiplyScalar(0.5);
            
            // Create cylinder geometry
            const cylinder = new THREE.Mesh(
                new THREE.CylinderGeometry(this.poleRadius, this.poleRadius, length, 8),
                poleMaterial
            );
            cylinder.castShadow = true;
            
            // Orient cylinder along the edge
            cylinder.position.copy(position);
            cylinder.lookAt(end);
            cylinder.rotateX(Math.PI/2);
            
            this.group.add(cylinder);
        });
        
        // Add a slightly transparent goal area to help visualization
        const netMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        // Create a more detailed net-like geometry (more subdivisions)
        const createNetGeometry = (width, height, widthSegments = 10, heightSegments = 10) => {
            const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
            
            // Store original positions for animation
            const originalPositions = [];
            const positions = geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                originalPositions.push(
                    new THREE.Vector3(positions[i], positions[i+1], positions[i+2])
                );
            }
            
            // Store in userData for animation
            geometry.userData = { originalPositions };
            
            return geometry;
        };
        
        // Back panel with net effect
        const backPanelGeometry = createNetGeometry(this.goalWidth, this.goalHeight);
        const backPanel = new THREE.Mesh(backPanelGeometry, netMaterial);
        backPanel.position.set(0, this.goalHeight/2, -this.goalDepth);
        backPanel.userData.isNet = true; // Mark for animation
        this.group.add(backPanel);
        
        // Top panel with net effect
        const topPanelGeometry = createNetGeometry(this.goalWidth, this.goalDepth);
        const topPanel = new THREE.Mesh(topPanelGeometry, netMaterial);
        topPanel.rotation.x = -Math.PI/2;
        topPanel.position.set(0, this.goalHeight, -this.goalDepth/2);
        topPanel.userData.isNet = true; // Mark for animation
        this.group.add(topPanel);
        
        // Left panel with net effect
        const leftPanelGeometry = createNetGeometry(this.goalDepth, this.goalHeight);
        const leftPanel = new THREE.Mesh(leftPanelGeometry, netMaterial);
        leftPanel.rotation.y = Math.PI/2;
        leftPanel.position.set(-this.goalWidth/2, this.goalHeight/2, -this.goalDepth/2);
        leftPanel.userData.isNet = true; // Mark for animation
        this.group.add(leftPanel);
        
        // Right panel with net effect
        const rightPanelGeometry = createNetGeometry(this.goalDepth, this.goalHeight);
        const rightPanel = new THREE.Mesh(rightPanelGeometry, netMaterial);
        rightPanel.rotation.y = -Math.PI/2;
        rightPanel.position.set(this.goalWidth/2, this.goalHeight/2, -this.goalDepth/2);
        rightPanel.userData.isNet = true; // Mark for animation
        this.group.add(rightPanel);
        
        // Create an invisible trigger box for more reliable goal detection
        const ballRadius = 0.5; // Ball radius
        const triggerGeometry = new THREE.BoxGeometry(
            this.goalWidth - ballRadius*2, 
            this.goalHeight - ballRadius*2, 
            this.goalDepth - ballRadius*2
        );
        const triggerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.0, // Completely invisible
            side: THREE.DoubleSide
        });
        this.trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
        this.trigger.position.set(0, (this.goalHeight - ballRadius*2)/2, -this.goalDepth/2);
        this.group.add(this.trigger);
    }

    /**
     * Animate the goal net panels
     */
    animateNet(time) {
        this.group.children.forEach(child => {
            if (child.userData.isNet) {
                const geometry = child.geometry;
                const originalPositions = geometry.userData.originalPositions;
                const positions = geometry.attributes.position.array;
                
                // Apply subtle wave animation to net
                const amplitude = 0.03; // Smaller amplitude for subtle effect
                const frequency = 2.0;  // Frequency of waves
                
                for (let i = 0, j = 0; i < originalPositions.length; i++, j += 3) {
                    const originalPos = originalPositions[i];
                    
                    // Apply different wave patterns based on position
                    const waveX = Math.sin(time * 0.001 + originalPos.x * frequency) * amplitude;
                    const waveY = Math.sin(time * 0.0015 + originalPos.y * frequency) * amplitude;
                    const waveZ = Math.cos(time * 0.001 + (originalPos.x + originalPos.y) * frequency) * amplitude;
                    
                    // Apply wave offset to original position
                    positions[j] = originalPos.x + waveX;
                    positions[j+1] = originalPos.y + waveY;
                    positions[j+2] = originalPos.z + waveZ;
                }
                
                // Mark geometry for update
                geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    /**
     * Get the goal object
     */
    getGroup() {
        return this.group;
    }

    /**
     * Get the goal trigger for collision detection
     */
    getTrigger() {
        return this.trigger;
    }

    /**
     * Get goal dimensions and position
     */
    getProperties() {
        return {
            width: this.goalWidth,
            height: this.goalHeight,
            depth: this.goalDepth,
            position: this.position
        };
    }
} 
