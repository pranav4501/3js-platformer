import * as THREE from 'three';

export default class FieldView {
    constructor(scene, fieldModel) {
        this.scene = scene;
        this.fieldModel = fieldModel;
        
        // Create field elements
        this.corridorFloor = this.createCorridorFloor();
        this.walls = this.createWalls();
        this.goal = this.createSoccerGoal();
        
        // Add elements to scene
        this.scene.add(this.corridorFloor);
        this.walls.forEach(wall => this.scene.add(wall));
        this.scene.add(this.goal);
    }
    
    createCorridorFloor() {
        const { width, length, position } = this.fieldModel;
        
        // Create a group to hold all floor elements
        const floorGroup = new THREE.Group();
        floorGroup.position.set(position.x, position.y, position.z);
        
        // Main floor - simple grass material
        const floorGeometry = new THREE.PlaneGeometry(width, length);
        
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
        const leftLineGeometry = new THREE.PlaneGeometry(sideLineWidth, length);
        const leftLine = new THREE.Mesh(leftLineGeometry, lineMaterial);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-width/2 + 0.5, 0.01, 0);
        leftLine.receiveShadow = true;
        leftLine.userData.isLine = true;
        floorGroup.add(leftLine);
        
        const rightLineGeometry = new THREE.PlaneGeometry(sideLineWidth, length);
        const rightLine = new THREE.Mesh(rightLineGeometry, lineMaterial);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(width/2 - 0.5, 0.01, 0);
        rightLine.receiveShadow = true;
        rightLine.userData.isLine = true;
        floorGroup.add(rightLine);
        
        // Goal area markings
        const { goalAreaWidth, goalAreaDepth } = this.fieldModel;
        
        // Goal line
        const goalLineGeometry = new THREE.PlaneGeometry(goalAreaWidth, sideLineWidth);
        const goalLine = new THREE.Mesh(goalLineGeometry, lineMaterial);
        goalLine.rotation.x = -Math.PI / 2;
        goalLine.position.set(0, 0.01, -length/2 + goalAreaDepth);
        goalLine.receiveShadow = true;
        goalLine.userData.isLine = true;
        floorGroup.add(goalLine);
        
        // Goal area side lines
        const leftGoalLineGeometry = new THREE.PlaneGeometry(sideLineWidth, goalAreaDepth);
        const leftGoalLine = new THREE.Mesh(leftGoalLineGeometry, lineMaterial);
        leftGoalLine.rotation.x = -Math.PI / 2;
        leftGoalLine.position.set(-goalAreaWidth/2, 0.01, -length/2 + goalAreaDepth/2);
        leftGoalLine.receiveShadow = true;
        leftGoalLine.userData.isLine = true;
        floorGroup.add(leftGoalLine);
        
        const rightGoalLineGeometry = new THREE.PlaneGeometry(sideLineWidth, goalAreaDepth);
        const rightGoalLine = new THREE.Mesh(rightGoalLineGeometry, lineMaterial);
        rightGoalLine.rotation.x = -Math.PI / 2;
        rightGoalLine.position.set(goalAreaWidth/2, 0.01, -length/2 + goalAreaDepth/2);
        rightGoalLine.receiveShadow = true;
        rightGoalLine.userData.isLine = true;
        floorGroup.add(rightGoalLine);
        
        return floorGroup;
    }
    
    createWalls() {
        const { width, length, position } = this.fieldModel;
        const wallHeight = 4;
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xAED581, 
            roughness: 0.7,
            metalness: 0.1
        });
        
        const walls = [];
        
        // Left wall
        const leftWallGeometry = new THREE.BoxGeometry(1, wallHeight, length);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-width/2 - 0.5, wallHeight/2, position.z);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        walls.push(leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.BoxGeometry(1, wallHeight, length);
        const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
        rightWall.position.set(width/2 + 0.5, wallHeight/2, position.z);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        walls.push(rightWall);
        
        return walls;
    }
    
    createSoccerGoal() {
        const { goalWidth, goalHeight, goalDepth, goalPosition } = this.fieldModel;
        
        // Create a group to hold the goal
        const goalGroup = new THREE.Group();
        goalGroup.position.set(goalPosition.x, goalPosition.y - goalHeight/2, goalPosition.z);
        
        // Create goal frame
        const goalFrameMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Goal frame dimensions
        const postRadius = 0.1;
        
        // Create the goal posts (vertical posts)
        const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 8);
        const leftPost = new THREE.Mesh(postGeometry, goalFrameMaterial);
        leftPost.position.set(-goalWidth/2, goalHeight/2, 0);
        leftPost.castShadow = true;
        leftPost.receiveShadow = true;
        goalGroup.add(leftPost);
        
        const rightPost = new THREE.Mesh(postGeometry, goalFrameMaterial);
        rightPost.position.set(goalWidth/2, goalHeight/2, 0);
        rightPost.castShadow = true;
        rightPost.receiveShadow = true;
        goalGroup.add(rightPost);
        
        // Create the crossbar (horizontal post)
        const crossbarGeometry = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 8);
        crossbarGeometry.rotateZ(Math.PI/2); // Rotate to be horizontal
        const crossbar = new THREE.Mesh(crossbarGeometry, goalFrameMaterial);
        crossbar.position.set(0, goalHeight, 0);
        crossbar.castShadow = true;
        crossbar.receiveShadow = true;
        goalGroup.add(crossbar);
        
        // Create side supports
        const supportGeometry = new THREE.CylinderGeometry(postRadius, postRadius, goalDepth, 8);
        supportGeometry.rotateX(Math.PI/2); // Rotate to be horizontal along z-axis
        
        const leftTopSupport = new THREE.Mesh(supportGeometry, goalFrameMaterial);
        leftTopSupport.position.set(-goalWidth/2, goalHeight, -goalDepth/2);
        leftTopSupport.castShadow = true;
        leftTopSupport.receiveShadow = true;
        goalGroup.add(leftTopSupport);
        
        const rightTopSupport = new THREE.Mesh(supportGeometry, goalFrameMaterial);
        rightTopSupport.position.set(goalWidth/2, goalHeight, -goalDepth/2);
        rightTopSupport.castShadow = true;
        rightTopSupport.receiveShadow = true;
        goalGroup.add(rightTopSupport);
        
        const leftBottomSupport = new THREE.Mesh(supportGeometry, goalFrameMaterial);
        leftBottomSupport.position.set(-goalWidth/2, 0, -goalDepth/2);
        leftBottomSupport.castShadow = true;
        leftBottomSupport.receiveShadow = true;
        goalGroup.add(leftBottomSupport);
        
        const rightBottomSupport = new THREE.Mesh(supportGeometry, goalFrameMaterial);
        rightBottomSupport.position.set(goalWidth/2, 0, -goalDepth/2);
        rightBottomSupport.castShadow = true;
        rightBottomSupport.receiveShadow = true;
        goalGroup.add(rightBottomSupport);
        
        // Rear crossbar
        const rearCrossbarGeometry = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 8);
        rearCrossbarGeometry.rotateZ(Math.PI/2); // Rotate to be horizontal
        const rearCrossbar = new THREE.Mesh(rearCrossbarGeometry, goalFrameMaterial);
        rearCrossbar.position.set(0, goalHeight, -goalDepth);
        rearCrossbar.castShadow = true;
        rearCrossbar.receiveShadow = true;
        goalGroup.add(rearCrossbar);
        
        // Rear posts
        const rearLeftPost = new THREE.Mesh(postGeometry, goalFrameMaterial);
        rearLeftPost.position.set(-goalWidth/2, goalHeight/2, -goalDepth);
        rearLeftPost.castShadow = true;
        rearLeftPost.receiveShadow = true;
        goalGroup.add(rearLeftPost);
        
        const rearRightPost = new THREE.Mesh(postGeometry, goalFrameMaterial);
        rearRightPost.position.set(goalWidth/2, goalHeight/2, -goalDepth);
        rearRightPost.castShadow = true;
        rearRightPost.receiveShadow = true;
        goalGroup.add(rearRightPost);
        
        // Create the net
        const netMesh = this.createNetMesh(goalWidth, goalHeight, goalDepth);
        netMesh.position.set(0, goalHeight/2, -goalDepth/2);
        goalGroup.add(netMesh);
        
        return goalGroup;
    }
    
    createNetMesh(width, height, depth) {
        // Function to create a detailed net geometry
        const createNetGeometry = (width, height, widthSegments = 10, heightSegments = 10) => {
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const indices = [];
            
            // Create a grid of horizontal and vertical lines
            const widthStep = width / widthSegments;
            const heightStep = height / heightSegments;
            
            // Create vertices for the top face
            for (let j = 0; j <= heightSegments; j++) {
                const y = height - (j * heightStep);
                for (let i = 0; i <= widthSegments; i++) {
                    const x = -width / 2 + (i * widthStep);
                    // Add slight randomization for a more natural net look
                    const xOffset = (j > 0 && j < heightSegments && i > 0 && i < widthSegments) ? 
                        (Math.random() - 0.5) * 0.05 : 0;
                    const yOffset = (j > 0 && j < heightSegments && i > 0 && i < widthSegments) ? 
                        (Math.random() - 0.5) * 0.05 : 0;
                    positions.push(x + xOffset, y + yOffset, 0);
                }
            }
            
            // Create lines (indices)
            for (let j = 0; j < heightSegments; j++) {
                for (let i = 0; i < widthSegments; i++) {
                    const a = i + j * (widthSegments + 1);
                    const b = i + 1 + j * (widthSegments + 1);
                    const c = i + (j + 1) * (widthSegments + 1);
                    const d = i + 1 + (j + 1) * (widthSegments + 1);
                    
                    // Add the two triangles that make up a square
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
            
            geometry.setIndex(indices);
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.computeVertexNormals();
            
            return geometry;
        };
        
        // Create the net materials
        const netMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        // Create a group to hold all net parts
        const netGroup = new THREE.Group();
        
        // Create the net sides
        // Top panel
        const topNet = new THREE.Mesh(createNetGeometry(width, depth, 20, 8), netMaterial);
        topNet.rotation.x = -Math.PI / 2;
        topNet.position.set(0, height, -depth / 2);
        netGroup.add(topNet);
        
        // Left panel
        const leftNet = new THREE.Mesh(createNetGeometry(depth, height, 8, 20), netMaterial);
        leftNet.rotation.y = Math.PI / 2;
        leftNet.position.set(-width / 2, 0, -depth / 2);
        netGroup.add(leftNet);
        
        // Right panel
        const rightNet = new THREE.Mesh(createNetGeometry(depth, height, 8, 20), netMaterial);
        rightNet.rotation.y = -Math.PI / 2;
        rightNet.position.set(width / 2, 0, -depth / 2);
        netGroup.add(rightNet);
        
        // Back panel
        const backNet = new THREE.Mesh(createNetGeometry(width, height, 20, 20), netMaterial);
        backNet.position.set(0, 0, -depth);
        netGroup.add(backNet);
        
        // Store for animation
        netGroup.userData.netMeshes = [topNet, leftNet, rightNet, backNet];
        
        return netGroup;
    }
    
    getFloorMeshForCollision() {
        // Extract the floor mesh (not the line markings) for collision detection
        return this.corridorFloor.children.find(child => !child.userData.isLine);
    }
    
    animateNet(time) {
        if (!this.goal.userData.netMeshes) return;
        
        this.goal.children.forEach(child => {
            if (child.userData.netMeshes) {
                child.userData.netMeshes.forEach(netMesh => {
                    if (netMesh.geometry.attributes.position) {
                        const positions = netMesh.geometry.attributes.position.array;
                        const count = positions.length / 3;
                        
                        for (let i = 0; i < count; i++) {
                            // Skip vertices on the edges
                            const isEdgeVertex = 
                                positions[i * 3] === -this.fieldModel.goalWidth / 2 ||
                                positions[i * 3] === this.fieldModel.goalWidth / 2 ||
                                positions[i * 3 + 1] === 0 ||
                                positions[i * 3 + 1] === this.fieldModel.goalHeight;
                            
                            if (!isEdgeVertex) {
                                // Apply slight undulation effect
                                const noise = Math.sin(time * 3 + i) * 0.02;
                                positions[i * 3 + 2] = noise;
                            }
                        }
                        
                        netMesh.geometry.attributes.position.needsUpdate = true;
                    }
                });
            }
        });
    }
} 
