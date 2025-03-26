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
        this.fans = []; // Store fan objects for animation
        this.fanTimer = 0; // Timer for fan animations
        
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
            position.x + width/2 + buffer + 13, // x position (increased distance from 7.5 to 15)
            position.y - 2.0, // y position - lowered by 2 units to make it appear grounded
            position.z, // z position (centered)
            Math.PI/2, // rotation (90 degrees to face right/center)
            length * 0.9, // stand width (now using length for width since rotated)
            25, // stand depth (now using former width for depth)
            6, // number of rows
            1.5 // base height
        );
        
        this.createStandSection(
            "right",
            position.x - width/2 - buffer - 13, // x position (increased distance from 7.5 to 15)
            position.y - 2.0, // y position - lowered by 2 units to make it appear grounded
            position.z, // z position (centered)
            -Math.PI/2, // rotation (-90 degrees to face left/center)
            length * 0.9, // stand width (now using length for width since rotated)
            25, // stand depth (now using former width for depth)
            6, // number of rows
            1.5 // base height
        );
        
        // Create stand behind the goal
        this.createStandSection(
            "goal",
            position.x, // Centered on field width
            position.y - 2.0, // Same height as other stands
            position.z - length/2 - buffer - 13, // Behind the goal (further in -z direction)
            -Math.PI, // No rotation (facing the field directly)
            width * 4, // Wider than the field
            25, // Not as deep as side stands
            7, // Fewer rows
            1.5 // Same base height
        );

        // Start fan animation loop
        this.animateFans();
    }
    
    /**
     * Create a section of stadium seating
     */
    createStandSection(name, xPos, yPos, zPos, rotation, width, depth, numRows, baseHeight) {
        // Create a group for this stand section
        const standGroup = new THREE.Group();
        standGroup.position.set(xPos, yPos, zPos);
        standGroup.rotation.y = rotation;
        
        // Create concrete base - changed to white
        const baseGeometry = new THREE.BoxGeometry(width, baseHeight, depth);
        const concreteMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, // Changed from gray to white
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
        
        // Burgundy color for all seats - changed to black
        const seatMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Changed from burgundy to black
            roughness: 0.9,  // Matte finish
            metalness: 0.0   // No metallic look
        });
        
        // Add steps and seats for each row
        for (let row = 0; row < numRows; row++) {
            // Calculate the step height
            const stepHeight = baseHeight + row * rowHeight;
            
            // Create step/tier - changed to white
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
                
                // Add fans to seats based on row number
                // First and second rows (0 & 1) are completely filled
                // Higher rows have 85% capacity with some gaps
                const shouldAddFan = ((row === 0 || row === 1) && Math.random() < 0.9) || 
                                    (row > 1 && Math.random() < 0.7);
                
                if (shouldAddFan) {
                    const fanGroup = this.createFan(
                        seatX, 
                        seatY + seatHeight/2 + 0.7, // Position on top of seat
                        seatZ,
                        standGroup,
                        row,
                        seat
                    );
                    
                    // Add fan to the fans array for animation
                    if (fanGroup) {
                        this.fans.push({
                            group: fanGroup,
                            initialY: fanGroup.position.y,
                            animationPhase: Math.random() * Math.PI * 2, // Random starting phase
                            animationSpeed: 0.5 + Math.random() * 2, // Random animation speed
                            holdingSign: fanGroup.userData.holdingSign || false
                        });
                    }
                }
            }
        }
        
        // Add railings at the top - changed to white
        const railingHeight = 1.2;
        const railingGeometry = new THREE.CylinderGeometry(0.05, 0.05, width, 8);
        railingGeometry.rotateZ(Math.PI / 2);
        const railingMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Changed from gray to white
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
     * Create a fan character
     */
    createFan(x, y, z, parent, row, seatIndex) {
        // Create fan group
        const fanGroup = new THREE.Group();
        fanGroup.position.set(x, y, z);
        
        // Randomize fan height and width 
        const fanHeight = 0.7 + Math.random() * 0.2;
        const fanWidth = 0.3 + Math.random() * 0.05;
        
        // Determine jersey type - 50% striped, 50% white with black shoulder (changed from 70/30)
        const jerseyType = Math.random() < 0.5 ? 'striped' : 'white';
        
        // Create fan jersey material
        let jerseyMaterial;
        
        if (jerseyType === 'striped') {
            // Create striped jersey texture with VERTICAL red and blue stripes
            const stripeCanvas = document.createElement('canvas');
            stripeCanvas.width = 128;
            stripeCanvas.height = 128;
            const stripeCtx = stripeCanvas.getContext('2d');
            
            // Draw vertical red and blue stripes
            const stripeWidth = 35;
            for (let i = 0; i < stripeCanvas.width; i += stripeWidth * 2) {
                // Red stripe
                stripeCtx.fillStyle = '#003399';
                stripeCtx.fillRect(i, 0, stripeWidth, stripeCanvas.height);
                
                // Blue stripe
                stripeCtx.fillStyle = '#880033';
                stripeCtx.fillRect(i + stripeWidth, 0, stripeWidth, stripeCanvas.height);
            }
            
            // Create texture and material
            const stripeTexture = new THREE.CanvasTexture(stripeCanvas);
            stripeTexture.wrapS = THREE.RepeatWrapping;
            stripeTexture.wrapT = THREE.RepeatWrapping;
            stripeTexture.repeat.set(4, 4);
            
            jerseyMaterial = new THREE.MeshStandardMaterial({ 
                map: stripeTexture,
                roughness: 0.8,
                metalness: 0.1
            });
        } else {
            // Create white jersey with black shoulders texture and neck stripe
            const jerseyCanvas = document.createElement('canvas');
            jerseyCanvas.width = 128;
            jerseyCanvas.height = 128;
            const jerseyCtx = jerseyCanvas.getContext('2d');
            
            // White base
            jerseyCtx.fillStyle = '#ffffff';
            jerseyCtx.fillRect(0, 0, jerseyCanvas.width, jerseyCanvas.height);
            
            // Black shoulder lines (top 20% of canvas)
            jerseyCtx.fillStyle = '#000000';
            jerseyCtx.fillRect(0, 0, jerseyCanvas.width, jerseyCanvas.height * 0.2);
            
            // Add back the thin horizontal black stripe
            jerseyCtx.fillStyle = '#000000';
            const stripeY = jerseyCanvas.height * 0.49; // 40% from the top
            const stripeThickness = jerseyCanvas.height * 0.01; // Thin stripe
            jerseyCtx.fillRect(0, stripeY, jerseyCanvas.width, stripeThickness);
            
            const jerseyTexture = new THREE.CanvasTexture(jerseyCanvas);
            jerseyTexture.wrapS = THREE.RepeatWrapping;
            jerseyTexture.wrapT = THREE.RepeatWrapping;
            
            jerseyMaterial = new THREE.MeshStandardMaterial({ 
                map: jerseyTexture,
                roughness: 0.8,
                metalness: 0.1
            });
        }
        
        // Create skin material
        const skinColors = [0xffe0bd, 0xffcd94, 0xe0ac69, 0xc68642, 0x8d5524];
        const skinColorIndex = Math.floor(Math.random() * skinColors.length);
        const skinMaterial = new THREE.MeshStandardMaterial({ 
            color: skinColors[skinColorIndex],
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create pants material
        const pantsColors = [0x333333, 0x0a1f3a, 0x1a3c6e];
        const pantsColorIndex = Math.floor(Math.random() * pantsColors.length);
        const pantsMaterial = new THREE.MeshStandardMaterial({ 
            color: pantsColors[pantsColorIndex],
            roughness: 0.9,
            metalness: 0.0
        });
        
        // Create upper body (torso with jersey)
        const torsoHeight = fanHeight * 0.5;
        const torsoGeometry = new THREE.CapsuleGeometry(fanWidth, torsoHeight, 4, 8);
        const torso = new THREE.Mesh(torsoGeometry, jerseyMaterial);
        torso.position.set(0, fanHeight * 0.25, 0);
        torso.rotation.x = Math.PI * 0.1; // Slight forward lean
        torso.castShadow = true;
        fanGroup.add(torso);
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(fanWidth * 1.2, 8, 8);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.set(0, fanHeight * 0.7, 0);
        head.castShadow = true;
        fanGroup.add(head);
        
        // Create legs (sitting position)
        // Left thigh
        const thighGeometry = new THREE.CapsuleGeometry(fanWidth * 0.4, fanHeight * 0.3, 4, 8);
        const leftThigh = new THREE.Mesh(thighGeometry, pantsMaterial);
        leftThigh.position.set(-fanWidth * 0.5, 0, fanWidth * 0.7);
        leftThigh.rotation.set(-Math.PI * 0.25, 0, 0); // Angled forward
        leftThigh.castShadow = true;
        fanGroup.add(leftThigh);
        
        // Right thigh
        const rightThigh = new THREE.Mesh(thighGeometry.clone(), pantsMaterial);
        rightThigh.position.set(fanWidth * 0.5, 0, fanWidth * 0.7);
        rightThigh.rotation.set(-Math.PI * 0.25, 0, 0); // Angled forward
        rightThigh.castShadow = true;
        fanGroup.add(rightThigh);
        
        // Cheering arms
        const armGeometry = new THREE.CapsuleGeometry(fanWidth * 0.25, fanHeight * 0.4, 4, 8);
        
        // Random arm position - some fans have raised arms, some don't
        const armsRaised = Math.random() < 0.4;
        const armYPos = armsRaised ? fanHeight * 0.5 : fanHeight * 0.3;
        const armZRot = armsRaised ? -Math.PI * 0.4 : Math.PI * 0.1;
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(-fanWidth * 0.8, armYPos, 0);
        leftArm.rotation.set(0, 0, armZRot); // Up angle for cheering
        leftArm.castShadow = true;
        fanGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry.clone(), skinMaterial);
        rightArm.position.set(fanWidth * 0.8, armYPos, 0);
        rightArm.rotation.set(0, 0, -armZRot); // Up angle for cheering
        rightArm.castShadow = true;
        fanGroup.add(rightArm);
        
        // Store jersey type and whether arms are raised for animation
        fanGroup.userData.jerseyType = jerseyType;
        fanGroup.userData.armsRaised = armsRaised;
        fanGroup.userData.leftArm = leftArm;
        fanGroup.userData.rightArm = rightArm;
        
        // Determine if this fan should hold a sign (about 1 in 10 fans)
        const holdingSign = Math.random() < 0.1;
        
        if (holdingSign) {
            // Position arms for holding sign
            leftArm.position.set(-fanWidth * 0.6, fanHeight * 0.5, fanWidth * 0.5);
            leftArm.rotation.set(-Math.PI * 0.2, 0, Math.PI * 0.2);
            
            rightArm.position.set(fanWidth * 0.6, fanHeight * 0.5, fanWidth * 0.5);
            rightArm.rotation.set(-Math.PI * 0.2, 0, -Math.PI * 0.2);
            
            // Create sign
            const signWidth = 1.0 + Math.random() * 0.5;
            const signHeight = 0.6 + Math.random() * 0.3;
            const signGeometry = new THREE.PlaneGeometry(signWidth, signHeight);
            
            // Create random sign color and message
            const signMessages = ["GOAL!", "GO TEAM!", "WE WIN!", "#1", "CHAMPIONS"];
            const signMessage = signMessages[Math.floor(Math.random() * signMessages.length)];
            
            // Create canvas for text
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const context = canvas.getContext('2d');
            
            // Random background color
            const bgColor = `rgb(${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)})`;
            context.fillStyle = bgColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Text styling
            context.fillStyle = 'white';
            context.font = 'bold 48px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(signMessage, canvas.width/2, canvas.height/2);
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            
            // Create materials for front and back to fix mirroring
            const frontMaterial = new THREE.MeshBasicMaterial({ 
                map: texture
            });
            
            const backMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xdddddd // Plain back side color
            });
            
            // Use separate materials for front and back
            const materials = [frontMaterial, backMaterial];
            
            // Create sign with double-sided geometry (front-facing on both sides)
            const sign = new THREE.Mesh(
                signGeometry, 
                materials
            );
            
            // Fix the rotation to display text correctly
            sign.material[0].side = THREE.FrontSide;
            sign.material[1].side = THREE.BackSide;
            
            // Position sign higher
            sign.position.y = fanHeight * 1.1;
            sign.position.z = fanWidth * 1.2;
            sign.rotation.x = -Math.PI / 8; // Tilt sign forward slightly
            sign.castShadow = true;
            fanGroup.add(sign);
            
            // Mark this fan as holding a sign for animation
            fanGroup.userData.holdingSign = true;
        }
        
        // Add to parent group
        parent.add(fanGroup);
        
        return fanGroup;
    }
    
    /**
     * Animate fans in the stadium
     */
    animateFans() {
        // Set up animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Update animation timer
            this.fanTimer += 0.016; // Roughly 60fps
            
            // Update each fan
            this.fans.forEach(fan => {
                // Skip if fan no longer exists
                if (!fan.group || !fan.group.parent) return;
                
                // Calculate vertical bounce
                const verticalOffset = Math.sin(this.fanTimer * fan.animationSpeed + fan.animationPhase) * 0.1;
                fan.group.position.y = fan.initialY + verticalOffset;
                
                // Get arm references
                const leftArm = fan.group.userData.leftArm;
                const rightArm = fan.group.userData.rightArm;
                
                // Animate arms if raised (for cheering fans)
                if (fan.group.userData.armsRaised && leftArm && rightArm && !fan.group.userData.holdingSign) {
                    const armPhase = this.fanTimer * fan.animationSpeed * 2 + fan.animationPhase;
                    const armMovement = Math.sin(armPhase) * 0.2;
                    
                    leftArm.rotation.z = -Math.PI * 0.4 + armMovement;
                    rightArm.rotation.z = Math.PI * 0.4 - armMovement;
                }
                
                // More energetic movement for fans with signs
                if (fan.holdingSign) {
                    // Rotate the sign a bit
                    const rotationOffset = Math.sin(this.fanTimer * fan.animationSpeed * 1.5 + fan.animationPhase) * 0.1;
                    fan.group.rotation.x = rotationOffset;
                    
                    // Bounce more
                    fan.group.position.y += Math.sin(this.fanTimer * fan.animationSpeed * 2) * 0.05;
                }
            });
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Get all wall meshes (for collision detection)
     */
    getWalls() {
        return this.walls;
    }
} 
