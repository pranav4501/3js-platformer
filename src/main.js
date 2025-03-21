import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Initialize the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Set up camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Game state
const gameState = {
    isPlaying: true,
    hasWon: false,
    hasLost: false,
    isFalling: false,
    fallStartTime: 0,
    lastCameraPosition: null, // Store camera position when game ends
    lastCameraLookAt: null,   // Store look target when game ends
    obstacles: [],
    reset: function() {
        this.isPlaying = true;
        this.hasWon = false;
        this.hasLost = false;
        this.isFalling = false;
        this.fallStartTime = 0;
        this.lastCameraPosition = null;
        this.lastCameraLookAt = null;
        // Reset ball position
        football.position.set(0, radius, 0);
        // Reset ball physics
        ballPhysics.velocity.set(0, 0, 0);
        // Hide restart UI
        document.getElementById('win-screen').style.display = 'none';
        document.getElementById('lose-screen').style.display = 'none';
    }
};

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Create a proper floor for the corridor
function createCorridorFloor() {
    const floorWidth = 10; // Match the space between walls
    const floorLength = 60; // Match the wall length
    
    // Create a group to hold all floor elements
    const floorGroup = new THREE.Group();
    floorGroup.position.set(0, -0.49, -25); // Slightly above ground to prevent z-fighting
    scene.add(floorGroup);
    
    // Main floor - simple grass material
    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorLength);
    
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
    const leftLineGeometry = new THREE.PlaneGeometry(sideLineWidth, floorLength);
    const leftLine = new THREE.Mesh(leftLineGeometry, lineMaterial);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-floorWidth/2 + 0.5, 0.01, 0);
    leftLine.receiveShadow = true;
    floorGroup.add(leftLine);
    
    const rightLineGeometry = new THREE.PlaneGeometry(sideLineWidth, floorLength);
    const rightLine = new THREE.Mesh(rightLineGeometry, lineMaterial);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(floorWidth/2 - 0.5, 0.01, 0);
    rightLine.receiveShadow = true;
    floorGroup.add(rightLine);
    
    // Simple goal area outline
    const goalAreaWidth = 8;
    const goalAreaDepth = 5;
    
    // Goal line
    const goalLineGeometry = new THREE.PlaneGeometry(goalAreaWidth, sideLineWidth);
    const goalLine = new THREE.Mesh(goalLineGeometry, lineMaterial);
    goalLine.rotation.x = -Math.PI / 2;
    goalLine.position.set(0, 0.01, -floorLength/2 + goalAreaDepth);
    goalLine.receiveShadow = true;
    floorGroup.add(goalLine);
    
    // Goal area side lines
    const leftGoalLineGeometry = new THREE.PlaneGeometry(sideLineWidth, goalAreaDepth);
    const leftGoalLine = new THREE.Mesh(leftGoalLineGeometry, lineMaterial);
    leftGoalLine.rotation.x = -Math.PI / 2;
    leftGoalLine.position.set(-goalAreaWidth/2, 0.01, -floorLength/2 + goalAreaDepth/2);
    leftGoalLine.receiveShadow = true;
    floorGroup.add(leftGoalLine);
    
    const rightGoalLineGeometry = new THREE.PlaneGeometry(sideLineWidth, goalAreaDepth);
    const rightGoalLine = new THREE.Mesh(rightGoalLineGeometry, lineMaterial);
    rightGoalLine.rotation.x = -Math.PI / 2;
    rightGoalLine.position.set(goalAreaWidth/2, 0.01, -floorLength/2 + goalAreaDepth/2);
    rightGoalLine.receiveShadow = true;
    floorGroup.add(rightGoalLine);
    
    return floorGroup;
}

// Create the floor
const corridorFloor = createCorridorFloor();
// Extract the floor mesh for collision detection
const floor = corridorFloor.children.find(child => !child.userData.isLine);

// Create a football
const radius = 0.5;
const segments = 32;
const ballGeometry = new THREE.SphereGeometry(radius, segments, segments);

// Create a soccer ball texture using a canvas
function createSoccerBallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Fill background white
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a pentagon
    const drawPentagon = (x, y, size, fill = true, stroke = false) => {
        context.save();
        context.translate(x, y);
        context.beginPath();
        
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            if (i === 0) context.moveTo(px, py);
            else context.lineTo(px, py);
        }
        
        context.closePath();
        if (fill) {
            context.fillStyle = 'black';
            context.fill();
        }
        if (stroke) {
            context.strokeStyle = 'black';
            context.lineWidth = 2;
            context.stroke();
        }
        context.restore();
    };
    
    // Draw a hexagon
    const drawHexagon = (x, y, size, fill = false, stroke = true) => {
        context.save();
        context.translate(x, y);
        context.beginPath();
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            if (i === 0) context.moveTo(px, py);
            else context.lineTo(px, py);
        }
        
        context.closePath();
        if (fill) {
            context.fillStyle = 'white';
            context.fill();
        }
        if (stroke) {
            context.strokeStyle = 'black';
            context.lineWidth = 2;
            context.stroke();
        }
        context.restore();
    };
    
    // Create a realistic soccer ball pattern with alternating pentagons and hexagons
    
    // First row of pentagons and hexagons
    drawPentagon(130, 130, 60);
    drawHexagon(260, 130, 60, true);
    drawPentagon(390, 130, 60);
    drawHexagon(520, 130, 60, true);
    drawPentagon(650, 130, 60);
    drawHexagon(780, 130, 60, true);
    drawPentagon(910, 130, 60);
    
    // Second row (shifted pattern)
    drawHexagon(65, 240, 60, true);
    drawPentagon(195, 240, 60);
    drawHexagon(325, 240, 60, true);
    drawPentagon(455, 240, 60);
    drawHexagon(585, 240, 60, true);
    drawPentagon(715, 240, 60);
    drawHexagon(845, 240, 60, true);
    
    // Third row
    drawPentagon(130, 350, 60);
    drawHexagon(260, 350, 60, true);
    drawPentagon(390, 350, 60);
    drawHexagon(520, 350, 60, true);
    drawPentagon(650, 350, 60);
    drawHexagon(780, 350, 60, true);
    drawPentagon(910, 350, 60);
    
    // Add connecting seams between shapes
    context.strokeStyle = 'black';
    context.lineWidth = 3;
    
    // Draw some connecting lines to enhance the pattern
    const drawConnector = (x1, y1, x2, y2) => {
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    };
    
    // Add connectors between rows
    for (let x = 130; x <= 910; x += 130) {
        if (x % 260 === 0) {
            // Connect hexagons to pentagons
            drawConnector(x, 190, x - 65, 240);
            drawConnector(x, 190, x + 65, 240);
        } else {
            // Connect pentagons to hexagons
            drawConnector(x, 190, x - 65, 240);
            drawConnector(x, 190, x + 65, 240);
        }
    }
    
    for (let x = 65; x <= 845; x += 130) {
        if (x % 260 === 65) {
            // Connect hexagons to pentagons
            drawConnector(x, 300, x + 65, 350);
        } else {
            // Connect pentagons to hexagons
            drawConnector(x, 300, x + 65, 350);
        }
    }
    
    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Create a material with a football texture
const ballMaterial = new THREE.MeshStandardMaterial({ 
    map: createSoccerBallTexture(),
    roughness: 0.4,
    metalness: 0.1,
    bumpScale: 0.01
});

// Create the football mesh
const football = new THREE.Mesh(ballGeometry, ballMaterial);
football.position.set(0, radius, 0); // Position it on the ground
football.castShadow = true;
football.receiveShadow = true;
scene.add(football);

// Football physics properties
const ballPhysics = {
    velocity: new THREE.Vector3(0, 0, 0),
    acceleration: new THREE.Vector3(0, -9.8, 0), // Gravity
    currentAcceleration: new THREE.Vector3(0, 0, 0), // Current frame acceleration from controls
    maxSpeed: 25, // Maximum speed cap
    rotation: new THREE.Vector3(0, 0, 0),
    onGround: false,
    friction: 0.98, // Friction coefficient (1 = no friction)
    groundFriction: 0.95, // Higher friction when on ground
    airFriction: 0.98,    // Lower friction when in air
    elasticity: 0.8 // Bounce factor
};

// Handle keyboard input for ball movement
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false
};

window.addEventListener('keydown', (e) => {
    if (keys[e.code] !== undefined) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys[e.code] !== undefined) {
        keys[e.code] = false;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game properties
const gameProperties = {
    forwardAcceleration: 40.0, // Acceleration for forward movement
    backwardAcceleration: 20.0, // Acceleration for backward movement
    lateralAcceleration: 35.0, // Acceleration for side-to-side movement
    obstacleRepulsionForce: 30.0, // Increased from 15.0 for more dramatic collisions
    jumpForce: 12.0, // Force applied when jumping
    jumpCooldown: 0.3 // Time in seconds before player can jump again
};

// Create obstacles
function createObstacles() {
    // Clear existing obstacles
    gameState.obstacles.forEach(obstacle => scene.remove(obstacle));
    gameState.obstacles = [];
    
    // Create obstacle material
    const obstacleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x964b00,  // Brown color
        roughness: 0.7
    });
    
    // Get field boundaries to ensure obstacles are within playable area
    const corridorWidth = 10;
    const fieldLength = 60;
    const minX = -corridorWidth/2 + 1;  // Left edge of field + buffer
    const maxX = corridorWidth/2 - 1;   // Right edge of field - buffer
    const minZ = -45;  // Near the goal but not too close
    const maxZ = 0;    // Up to the start area
    
    // Create obstacles with movement paths - increased speeds
    
    // Obstacle 1 - Left-right movement
    const obs1Geometry = new THREE.BoxGeometry(2, 1, 1);
    const obs1 = new THREE.Mesh(obs1Geometry, obstacleMaterial);
    obs1.position.set(-3, 0, -8);
    obs1.castShadow = true;
    obs1.receiveShadow = true;
    // Add movement path data
    obs1.userData.movement = {
        type: 'horizontal',
        speed: 4, // Increased from 2
        startX: -3,
        endX: 3,
        direction: 1 // 1 for right, -1 for left
    };
    scene.add(obs1);
    gameState.obstacles.push(obs1);
    
    // Obstacle 2 - Right-left movement
    const obs2Geometry = new THREE.BoxGeometry(3, 1, 1);
    const obs2 = new THREE.Mesh(obs2Geometry, obstacleMaterial);
    obs2.position.set(3, 0, -15);
    obs2.castShadow = true;
    obs2.receiveShadow = true;
    // Add movement path data
    obs2.userData.movement = {
        type: 'horizontal',
        speed: 3, // Increased from 1.5
        startX: -3,
        endX: 3,
        direction: -1 // Start moving left
    };
    scene.add(obs2);
    gameState.obstacles.push(obs2);
    
    // Obstacle 3 - Diagonal movement
    const obs3Geometry = new THREE.BoxGeometry(2, 1, 1);
    const obs3 = new THREE.Mesh(obs3Geometry, obstacleMaterial);
    obs3.position.set(0, 0, -22);
    obs3.castShadow = true;
    obs3.receiveShadow = true;
    // Add movement path data
    obs3.userData.movement = {
        type: 'diagonal',
        speed: 5, // Increased from 2.5
        startX: -3,
        endX: 3,
        startZ: -25,
        endZ: -20,
        progress: 0,
        direction: 1 // Starting direction
    };
    scene.add(obs3);
    gameState.obstacles.push(obs3);
    
    // Obstacle 4 - Circular movement
    const obs4Geometry = new THREE.BoxGeometry(2, 1, 1);
    const obs4 = new THREE.Mesh(obs4Geometry, obstacleMaterial);
    obs4.position.set(-3, 0, -30);
    obs4.castShadow = true;
    obs4.receiveShadow = true;
    // Add movement path data
    obs4.userData.movement = {
        type: 'circular',
        speed: 2, // Increased from 1
        centerX: -2,
        centerZ: -32,
        radius: 2,
        angle: 0
    };
    scene.add(obs4);
    gameState.obstacles.push(obs4);
    
    // Obstacle 5 - Up-down movement (floating)
    const obs5Geometry = new THREE.BoxGeometry(3, 1, 1);
    const obs5 = new THREE.Mesh(obs5Geometry, obstacleMaterial);
    obs5.position.set(2, 1, -38);
    obs5.castShadow = true;
    obs5.receiveShadow = true;
    // Add movement path data
    obs5.userData.movement = {
        type: 'vertical',
        speed: 2, // Increased from 1
        startY: 0.5,
        endY: 1.5,
        direction: 1 // 1 for up, -1 for down
    };
    scene.add(obs5);
    gameState.obstacles.push(obs5);
    
    // Obstacle 6 - Zigzag movement
    const diagObs1Geometry = new THREE.BoxGeometry(2, 1, 1);
    const diagObs1 = new THREE.Mesh(diagObs1Geometry, obstacleMaterial);
    diagObs1.position.set(-1, 0, -12);
    diagObs1.rotation.y = Math.PI / 4; // 45 degrees rotation
    diagObs1.castShadow = true;
    diagObs1.receiveShadow = true;
    // Add movement path data
    diagObs1.userData.movement = {
        type: 'zigzag',
        speed: 6, // Increased from 3
        leftX: -3,
        rightX: 3,
        direction: 1,
        amplitude: 2
    };
    scene.add(diagObs1);
    gameState.obstacles.push(diagObs1);
    
    // Obstacle 7 - Static (doesn't move)
    const diagObs2Geometry = new THREE.BoxGeometry(3, 1, 1);
    const diagObs2 = new THREE.Mesh(diagObs2Geometry, obstacleMaterial);
    diagObs2.position.set(1, 0, -28);
    diagObs2.rotation.y = -Math.PI / 4; // -45 degrees rotation
    diagObs2.castShadow = true;
    diagObs2.receiveShadow = true;
    // No movement data for static obstacle
    scene.add(diagObs2);
    gameState.obstacles.push(diagObs2);
}

// Create a soccer goal post
function createSoccerGoal() {
    const goalPosition = new THREE.Vector3(0, 0, -50); // Position at end of corridor
    const goalWidth = 5;
    const goalHeight = 2.5;
    const goalDepth = 1.5;
    const poleRadius = 0.1;
    
    // Create a group to hold all goal parts
    const goalGroup = new THREE.Group();
    goalGroup.position.copy(goalPosition);
    scene.add(goalGroup);
    
    // Goal material (white poles)
    const poleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.2
    });
    
    // Create a simple hollow cube by creating edges
    const edges = [
        // Back frame
        { start: [-goalWidth/2, 0, -goalDepth], end: [goalWidth/2, 0, -goalDepth] }, // bottom back
        { start: [-goalWidth/2, goalHeight, -goalDepth], end: [goalWidth/2, goalHeight, -goalDepth] }, // top back
        { start: [-goalWidth/2, 0, -goalDepth], end: [-goalWidth/2, goalHeight, -goalDepth] }, // left back
        { start: [goalWidth/2, 0, -goalDepth], end: [goalWidth/2, goalHeight, -goalDepth] }, // right back
        
        // Connections to front (top and sides only)
        { start: [-goalWidth/2, goalHeight, -goalDepth], end: [-goalWidth/2, goalHeight, 0] }, // top left edge
        { start: [goalWidth/2, goalHeight, -goalDepth], end: [goalWidth/2, goalHeight, 0] }, // top right edge
        { start: [-goalWidth/2, 0, -goalDepth], end: [-goalWidth/2, 0, 0] }, // bottom left edge
        { start: [goalWidth/2, 0, -goalDepth], end: [goalWidth/2, 0, 0] }, // bottom right edge
        
        // Front frame (no bottom edge to allow ball entry)
        { start: [-goalWidth/2, goalHeight, 0], end: [goalWidth/2, goalHeight, 0] }, // top front
        { start: [-goalWidth/2, 0, 0], end: [-goalWidth/2, goalHeight, 0] }, // left front
        { start: [goalWidth/2, 0, 0], end: [goalWidth/2, goalHeight, 0] }  // right front
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
            new THREE.CylinderGeometry(poleRadius, poleRadius, length, 8),
            poleMaterial
        );
        cylinder.castShadow = true;
        
        // Orient cylinder along the edge
        cylinder.position.copy(position);
        cylinder.lookAt(end);
        cylinder.rotateX(Math.PI/2);
        
        goalGroup.add(cylinder);
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
    const backPanelGeometry = createNetGeometry(goalWidth, goalHeight);
    const backPanel = new THREE.Mesh(backPanelGeometry, netMaterial);
    backPanel.position.set(0, goalHeight/2, -goalDepth);
    backPanel.userData.isNet = true; // Mark for animation
    goalGroup.add(backPanel);
    
    // Top panel with net effect
    const topPanelGeometry = createNetGeometry(goalWidth, goalDepth);
    const topPanel = new THREE.Mesh(topPanelGeometry, netMaterial);
    topPanel.rotation.x = -Math.PI/2;
    topPanel.position.set(0, goalHeight, -goalDepth/2);
    topPanel.userData.isNet = true; // Mark for animation
    goalGroup.add(topPanel);
    
    // Left panel with net effect
    const leftPanelGeometry = createNetGeometry(goalDepth, goalHeight);
    const leftPanel = new THREE.Mesh(leftPanelGeometry, netMaterial);
    leftPanel.rotation.y = Math.PI/2;
    leftPanel.position.set(-goalWidth/2, goalHeight/2, -goalDepth/2);
    leftPanel.userData.isNet = true; // Mark for animation
    goalGroup.add(leftPanel);
    
    // Right panel with net effect
    const rightPanelGeometry = createNetGeometry(goalDepth, goalHeight);
    const rightPanel = new THREE.Mesh(rightPanelGeometry, netMaterial);
    rightPanel.rotation.y = -Math.PI/2;
    rightPanel.position.set(goalWidth/2, goalHeight/2, -goalDepth/2);
    rightPanel.userData.isNet = true; // Mark for animation
    goalGroup.add(rightPanel);
    
    // Create an invisible trigger box for more reliable goal detection
    const triggerGeometry = new THREE.BoxGeometry(goalWidth - radius*2, goalHeight - radius*2, goalDepth - radius*2);
    const triggerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.0, // Completely invisible
        side: THREE.DoubleSide
    });
    const goalTrigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    goalTrigger.position.set(0, (goalHeight - radius*2)/2, -goalDepth/2);
    goalGroup.add(goalTrigger);
    
    return {
        group: goalGroup,
        width: goalWidth,
        height: goalHeight,
        depth: goalDepth,
        position: goalPosition,
        trigger: goalTrigger
    };
}

// Create the soccer goal
const soccerGoal = createSoccerGoal();

// Particle system for celebration
let particles;
function createParticleSystem() {
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
    
    particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.visible = false; // Hide initially
    scene.add(particles);
}

// Create UI for win screen
function createUI() {
    // Create div for win message and restart button
    const winScreen = document.createElement('div');
    winScreen.id = 'win-screen';
    winScreen.style.position = 'absolute';
    winScreen.style.top = '50%';
    winScreen.style.left = '50%';
    winScreen.style.transform = 'translate(-50%, -50%)';
    winScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    winScreen.style.color = 'white';
    winScreen.style.padding = '20px';
    winScreen.style.borderRadius = '10px';
    winScreen.style.textAlign = 'center';
    winScreen.style.display = 'none';
    
    // Win message
    const winMessage = document.createElement('h2');
    winMessage.textContent = 'GOAL!!!';
    winMessage.style.color = '#ffff00';
    winMessage.style.marginBottom = '20px';
    
    // Restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Play Again';
    restartButton.style.padding = '10px 20px';
    restartButton.style.backgroundColor = '#4CAF50';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.fontSize = '16px';
    
    restartButton.addEventListener('click', () => {
        gameState.reset();
    });
    
    winScreen.appendChild(winMessage);
    winScreen.appendChild(restartButton);
    document.body.appendChild(winScreen);
    
    // Create div for lose message and restart button
    const loseScreen = document.createElement('div');
    loseScreen.id = 'lose-screen';
    loseScreen.style.position = 'absolute';
    loseScreen.style.top = '50%';
    loseScreen.style.left = '50%';
    loseScreen.style.transform = 'translate(-50%, -50%)';
    loseScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loseScreen.style.color = 'white';
    loseScreen.style.padding = '20px';
    loseScreen.style.borderRadius = '10px';
    loseScreen.style.textAlign = 'center';
    loseScreen.style.display = 'none';
    
    // Lose message
    const loseMessage = document.createElement('h2');
    loseMessage.textContent = 'OUT OF BOUNDS!';
    loseMessage.style.color = '#ff4444';
    loseMessage.style.marginBottom = '20px';
    
    // Restart button for lose screen
    const loseRestartButton = document.createElement('button');
    loseRestartButton.textContent = 'Try Again';
    loseRestartButton.style.padding = '10px 20px';
    loseRestartButton.style.backgroundColor = '#4CAF50';
    loseRestartButton.style.color = 'white';
    loseRestartButton.style.border = 'none';
    loseRestartButton.style.borderRadius = '5px';
    loseRestartButton.style.cursor = 'pointer';
    loseRestartButton.style.fontSize = '16px';
    
    loseRestartButton.addEventListener('click', () => {
        gameState.reset();
    });
    
    loseScreen.appendChild(loseMessage);
    loseScreen.appendChild(loseRestartButton);
    document.body.appendChild(loseScreen);
}

// Create a Messi character
function createMessi() {
    // Group to hold all Messi parts
    const messi = new THREE.Group();
    messi.position.set(4, 0, -45); // Position near the goal
    messi.rotation.y = Math.PI / 4; // Face slightly toward the field
    
    // Create materials
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xe0ac69 }); // Skin tone
    const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2504 }); // Dark brown hair
    const jerseyMaterial = new THREE.MeshStandardMaterial({ color: 0x75acff }); // Light blue (Argentina)
    const shortsMaterial = new THREE.MeshStandardMaterial({ color: 0x000088 }); // Dark blue
    const bootsMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red boots
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        skinMaterial
    );
    head.position.y = 1.7;
    head.castShadow = true;
    messi.add(head);
    
    // Hair
    const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        hairMaterial
    );
    hair.position.y = 1.75;
    hair.rotation.x = Math.PI;
    messi.add(hair);
    
    // Body (torso)
    const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.2, 0.6, 8),
        jerseyMaterial
    );
    torso.position.y = 1.25;
    torso.castShadow = true;
    messi.add(torso);
    
    // Number 10 on jersey
    const numberGeometry = new THREE.PlaneGeometry(0.2, 0.2);
    const numberMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const number = new THREE.Mesh(numberGeometry, numberMaterial);
    number.position.set(0, 1.25, -0.21);
    number.rotation.x = Math.PI;
    
    // Create canvas to draw "10"
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.font = 'bold 50px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('10', 32, 32);
    
    // Apply canvas as texture
    const numberTexture = new THREE.CanvasTexture(canvas);
    numberMaterial.map = numberTexture;
    messi.add(number);
    
    // Legs
    const leftLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8),
        shortsMaterial
    );
    leftLeg.position.set(-0.15, 0.9, 0);
    leftLeg.castShadow = true;
    messi.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8),
        shortsMaterial
    );
    rightLeg.position.set(0.15, 0.9, 0);
    rightLeg.castShadow = true;
    messi.add(rightLeg);
    
    // Lower legs (calves)
    const leftCalf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
        skinMaterial
    );
    leftCalf.position.set(-0.15, 0.45, 0);
    leftCalf.castShadow = true;
    messi.add(leftCalf);
    
    const rightCalf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
        skinMaterial
    );
    rightCalf.position.set(0.15, 0.45, 0);
    rightCalf.castShadow = true;
    messi.add(rightCalf);
    
    // Boots
    const leftBoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.1, 0.2),
        bootsMaterial
    );
    leftBoot.position.set(-0.15, 0.2, 0.05);
    leftBoot.castShadow = true;
    messi.add(leftBoot);
    
    const rightBoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.1, 0.2),
        bootsMaterial
    );
    rightBoot.position.set(0.15, 0.2, 0.05);
    rightBoot.castShadow = true;
    messi.add(rightBoot);
    
    // Arms
    const leftArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8),
        jerseyMaterial
    );
    leftArm.position.set(-0.35, 1.3, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    messi.add(leftArm);
    
    const rightArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8),
        jerseyMaterial
    );
    rightArm.position.set(0.35, 1.3, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    messi.add(rightArm);
    
    // Hands
    const leftHand = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        skinMaterial
    );
    leftHand.position.set(-0.45, 1.05, 0);
    leftHand.castShadow = true;
    messi.add(leftHand);
    
    const rightHand = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        skinMaterial
    );
    rightHand.position.set(0.45, 1.05, 0);
    rightHand.castShadow = true;
    messi.add(rightHand);
    
    // Add animation properties
    messi.userData = {
        animationState: {
            idle: true,
            jumping: false,
            celebrating: false
        },
        baseY: 0, // Base Y position
        animationTime: 0
    };
    
    scene.add(messi);
    return messi;
}

// Initialize Messi
const messi = createMessi();

// Initialize game elements
createObstacles();
createParticleSystem();
createUI();

// Track jump cooldown
let jumpCooldownTimer = 0;

const updateBallPhysics = (deltaTime) => {
    // If in falling state, check if 1 second has passed
    if (gameState.isFalling) {
        const currentTime = Date.now();
        const fallingTime = (currentTime - gameState.fallStartTime) / 1000;
        
        if (fallingTime >= 1.0) {
            // After 1 second of falling, end the game
            gameState.hasLost = true;
            gameState.isPlaying = false;
            gameState.isFalling = false;
            
            // Store the camera position to keep it fixed
            gameState.lastCameraPosition = camera.position.clone();
            gameState.lastCameraLookAt = football.position.clone();
            
            // Show out of bounds message
            gameLost();
            return;
        }
        
        // During falling state, apply full physics including lateral movement
        // Apply gravity
        ballPhysics.velocity.y += ballPhysics.acceleration.y * deltaTime;
        
        // Apply air friction but keep lateral movement
        ballPhysics.velocity.x *= ballPhysics.airFriction;
        ballPhysics.velocity.z *= ballPhysics.airFriction;
        
        // Update position with all velocity components
        football.position.add(ballPhysics.velocity.clone().multiplyScalar(deltaTime));
        
        // Add dramatic rotation while falling
        football.rotation.x += deltaTime * 5;
        football.rotation.z += deltaTime * 3;
        
        return;
    }
    
    if (!gameState.isPlaying) return;
    
    // Reset current acceleration
    ballPhysics.currentAcceleration.set(0, 0, 0);
    
    // Update jump cooldown timer
    if (jumpCooldownTimer > 0) {
        jumpCooldownTimer -= deltaTime;
    }
    
    // Handle player movement (all directions)
    // Now applying acceleration rather than direct force
    
    // Forward/backward control using Up/Down arrows or W/S keys
    if (keys.ArrowUp || keys.KeyW) {
        ballPhysics.currentAcceleration.z = -gameProperties.forwardAcceleration;
    }
    if (keys.ArrowDown || keys.KeyS) {
        ballPhysics.currentAcceleration.z = gameProperties.backwardAcceleration;
    }
    
    // Left/right control using Left/Right arrows or A/D keys
    if (keys.ArrowLeft || keys.KeyA) {
        ballPhysics.currentAcceleration.x = -gameProperties.lateralAcceleration;
    }
    if (keys.ArrowRight || keys.KeyD) {
        ballPhysics.currentAcceleration.x = gameProperties.lateralAcceleration;
    }
    
    // Jump control using Space
    if ((keys.Space) && ballPhysics.onGround && jumpCooldownTimer <= 0) {
        ballPhysics.velocity.y = gameProperties.jumpForce;
        ballPhysics.onGround = false;
        jumpCooldownTimer = gameProperties.jumpCooldown;
        
        // Play jump sound if available
        // playSound('jump');
    }
    
    // Apply current acceleration to velocity
    ballPhysics.velocity.x += ballPhysics.currentAcceleration.x * deltaTime;
    ballPhysics.velocity.z += ballPhysics.currentAcceleration.z * deltaTime;
    
    // Apply gravity
    ballPhysics.velocity.y += ballPhysics.acceleration.y * deltaTime;
    
    // Apply friction (higher when on ground, lower when in air)
    const frictionFactor = ballPhysics.onGround ? ballPhysics.groundFriction : ballPhysics.airFriction;
    ballPhysics.velocity.x *= frictionFactor;
    ballPhysics.velocity.z *= frictionFactor;
    
    // Apply speed cap
    const horizontalSpeed = Math.sqrt(ballPhysics.velocity.x * ballPhysics.velocity.x + 
                                     ballPhysics.velocity.z * ballPhysics.velocity.z);
    if (horizontalSpeed > ballPhysics.maxSpeed) {
        const reductionFactor = ballPhysics.maxSpeed / horizontalSpeed;
        ballPhysics.velocity.x *= reductionFactor;
        ballPhysics.velocity.z *= reductionFactor;
    }
    
    // Update position
    football.position.add(ballPhysics.velocity.clone().multiplyScalar(deltaTime));
    
    // Add ball rotation based on movement
    if (horizontalSpeed > 0.1) {
        // Calculate rotation axis (perpendicular to movement direction)
        const rotationAxis = new THREE.Vector3(-ballPhysics.velocity.z, 0, ballPhysics.velocity.x).normalize();
        const rotationAmount = horizontalSpeed * deltaTime / radius;
        football.rotateOnAxis(rotationAxis, rotationAmount);
    }
    
    // Ground collision detection - updated to use the corridor floor
    const floorY = corridorFloor.position.y;
    if (football.position.y - radius <= floorY) {
        football.position.y = floorY + radius;
        if (ballPhysics.velocity.y < 0) {
            // Bounce when hitting the ground
            ballPhysics.velocity.y = -ballPhysics.velocity.y * ballPhysics.elasticity;
        }
        ballPhysics.onGround = true;
    } else {
        ballPhysics.onGround = false;
    }
    
    // Check for obstacle collisions
    checkObstacleCollisions();
    
    // Check if reached goal
    checkGoal();
    
    // Check if ball is near Messi
    checkMessiInteraction();
    
    // Check if out of bounds
    checkOutOfBounds();
};

// Check for ball interaction with Messi
function checkMessiInteraction() {
    const messiPosition = new THREE.Vector3();
    messi.getWorldPosition(messiPosition);
    
    const distance = football.position.distanceTo(messiPosition);
    
    // If ball gets close to Messi
    if (distance < 2) {
        // Make Messi look at the ball
        const lookDirection = new THREE.Vector3().subVectors(football.position, messiPosition);
        lookDirection.y = 0; // Keep him upright, only rotate horizontally
        messi.rotation.y = Math.atan2(lookDirection.x, lookDirection.z);
        
        // If ball is very close, make Messi "kick" it
        if (distance < 1 && !messi.userData.animationState.celebrating) {
            // Add a small force to the ball in direction Messi is facing
            const kickDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(messi.quaternion);
            const kickForce = 5.0;
            ballPhysics.velocity.add(kickDirection.multiplyScalar(kickForce));
            
            // Trigger a small jump animation for Messi
            messi.userData.animationState.idle = false;
            messi.userData.animationState.jumping = true;
            messi.userData.animationTime = 0;
            
            // Add some upward velocity to the ball
            ballPhysics.velocity.y += 3.0;
            
            // Play kick sound if available
            // playSound('kick');
        }
    }
}

// Check for collisions with obstacles
function checkObstacleCollisions() {
    for (const obstacle of gameState.obstacles) {
        // Get obstacle bounds
        const obstacleBounds = new THREE.Box3().setFromObject(obstacle);
        
        // Create a sphere representing the football
        const ballPosition = football.position.clone();
        
        // Check if the ball is colliding with the obstacle
        if (obstacleBounds.distanceToPoint(ballPosition) < radius) {
            // Get obstacle center
            const obstacleCenter = new THREE.Vector3();
            obstacleBounds.getCenter(obstacleCenter);
            
            // Calculate collision normal (direction from obstacle center to ball)
            const normal = ballPosition.clone().sub(obstacleCenter).normalize();
            
            // Calculate impact velocity magnitude
            const impactSpeed = Math.abs(ballPhysics.velocity.dot(normal));
            
            // Calculate obstacle velocity (if it has movement data)
            const obstacleVelocity = new THREE.Vector3(0, 0, 0);
            if (obstacle.userData.movement) {
                const movement = obstacle.userData.movement;
                switch (movement.type) {
                    case 'horizontal':
                        obstacleVelocity.x = movement.speed * movement.direction;
                        break;
                    case 'diagonal':
                        const progressRate = movement.speed * 0.1 * (movement.direction || 1);
                        obstacleVelocity.x = (movement.endX - movement.startX) * progressRate;
                        obstacleVelocity.z = (movement.endZ - movement.startZ) * progressRate;
                        break;
                    case 'circular':
                        // Tangential velocity in circular motion
                        obstacleVelocity.x = -Math.sin(movement.angle) * movement.speed * movement.radius;
                        obstacleVelocity.z = Math.cos(movement.angle) * movement.speed * movement.radius;
                        break;
                    case 'vertical':
                        obstacleVelocity.y = movement.speed * movement.direction;
                        break;
                    case 'zigzag':
                        obstacleVelocity.x = movement.speed * movement.direction;
                        break;
                }
            }
            
            // Move the ball outside the obstacle with extra margin to prevent sticking
            const penetrationDepth = radius - obstacleBounds.distanceToPoint(ballPosition);
            football.position.add(normal.clone().multiplyScalar(penetrationDepth + 0.2)); // Increased margin
            
            // Get the relative velocity - how fast the ball is moving relative to the obstacle
            const relativeVelocity = ballPhysics.velocity.clone().sub(obstacleVelocity);
            const relativeVelocityAlongNormal = relativeVelocity.dot(normal);
            
            // Only bounce if the ball is moving toward the obstacle relative to the obstacle's movement
            if (relativeVelocityAlongNormal < 0) {
                // First, cancel out the component of the ball's velocity that's moving toward the obstacle
                ballPhysics.velocity.sub(normal.clone().multiplyScalar(relativeVelocityAlongNormal * 2.0));
                
                // Apply strong repulsion in the normal direction (away from obstacle)
                // Higher force for higher impact speeds
                const baseRepulsionForce = gameProperties.obstacleRepulsionForce * 1.5; // Increased base force
                const speedBonus = impactSpeed * 0.8; // More influence from impact speed
                const totalRepulsionForce = baseRepulsionForce + speedBonus;
                
                // Add repulsion with high force
                ballPhysics.velocity.add(normal.clone().multiplyScalar(totalRepulsionForce));
                
                // Ensure minimal energy loss to prevent sticking behavior
                const energyConservation = 0.9; // High conservation to prevent slowing down too much
                ballPhysics.velocity.multiplyScalar(energyConservation);
                
                // Add upward component to prevent floor sticking
                ballPhysics.velocity.y = Math.max(ballPhysics.velocity.y, 1.0);
                
                // Add random slight variance to make bounces feel natural
                const randomFactor = 0.05; // Very small randomness for predictable bounces
                ballPhysics.velocity.x += (Math.random() - 0.5) * randomFactor * totalRepulsionForce;
                ballPhysics.velocity.z += (Math.random() - 0.5) * randomFactor * totalRepulsionForce;
                
                // Add visual feedback for collision
                const particleCount = Math.floor(7 + impactSpeed / 1.5); // More particles
                createCollisionEffect(football.position.clone(), normal, particleCount);
                
                // Add screen shake for dramatic effect on hard impacts
                if (impactSpeed > 5) { // Reduced threshold for more frequent shake
                    shakeCamera(impactSpeed / 5);
                }
            }
        }
    }
    
    // Don't check collisions with the goal posts - this allows the ball to enter the goal
    // without being blocked by the goal frame
}

// Create a visual effect for collision (simple particles)
function createCollisionEffect(position, normal, particleCount = 5) {
    // Skip if too many effects are already present (performance)
    if (scene.children.filter(child => child.userData.isCollisionEffect).length > 5) return;
    
    // Create a small particle group at the collision point
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Set all particles at the collision point
    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = position.x;
        particlePositions[i * 3 + 1] = position.y;
        particlePositions[i * 3 + 2] = position.z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Use a simple white material
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3, // Larger particles
        transparent: true,
        opacity: 0.8
    });
    
    const collisionEffect = new THREE.Points(particleGeometry, particleMaterial);
    collisionEffect.userData = {
        isCollisionEffect: true,
        creationTime: Date.now(),
        velocities: Array(particleCount).fill().map(() => {
            // Create velocity in the general direction of the normal with more randomness
            return new THREE.Vector3(
                normal.x + (Math.random() - 0.5) * 3,
                normal.y + (Math.random() * 2), // More upward bias
                normal.z + (Math.random() - 0.5) * 3
            ).normalize().multiplyScalar(Math.random() * 5 + 2); // Faster particles
        })
    };
    
    scene.add(collisionEffect);
    
    // Remove after 600ms
    setTimeout(() => {
        scene.remove(collisionEffect);
    }, 600);
}

// Check if ball reached the goal
function checkGoal() {
    if (gameState.hasWon) return;
    
    const ballPosition = football.position.clone();
    
    // Get the world position of the ball
    const ballWorldPos = new THREE.Vector3();
    football.getWorldPosition(ballWorldPos);
    
    // Get the goal trigger box in world space
    const goalBox = new THREE.Box3().setFromObject(soccerGoal.trigger);
    
    // Check if the ball's center is inside the goal trigger box
    if (goalBox.containsPoint(ballWorldPos)) {
        // Ball is in the goal!
        gameState.hasWon = true;
        gameState.isPlaying = false;
        
        // Show celebration
        celebrateGoal();
    }
}

// Celebrate scoring a goal
function celebrateGoal() {
    // Show particles
    particles.visible = true;
    
    // Position particles at the goal
    particles.position.copy(soccerGoal.position);
    particles.position.y = 1;
    
    // Show win screen
    document.getElementById('win-screen').style.display = 'block';
}

// Check if ball is out of bounds
function checkOutOfBounds() {
    if (gameState.hasWon || gameState.hasLost || gameState.isFalling) return;
    
    const ballPosition = football.position;
    const goalPosition = soccerGoal.position;
    const goalDepth = soccerGoal.depth;
    
    // Field boundaries based on the actual turf area
    const corridorWidth = 10; // Width of the field
    const fieldLength = 60;   // Length of the field
    
    // Define boundaries - now using the field dimensions rather than walls
    const minX = -corridorWidth/2;  // Left edge of field
    const maxX = corridorWidth/2;   // Right edge of field
    const minZ = goalPosition.z - goalDepth - 1; // Behind goal
    const maxZ = 5; // Start area (don't go backward)
    
    // Check if ball is out of bounds on any side
    if (ballPosition.x < minX || 
        ballPosition.x > maxX || 
        ballPosition.z < minZ ||
        ballPosition.z > maxZ) {
        
        // Enter falling state instead of immediately ending the game
        gameState.isFalling = true;
        gameState.fallStartTime = Date.now();
        
        // Keep lateral velocities instead of zeroing them out
        // This allows the ball to fall in a natural arc with its original trajectory
        
        // Just add a small downward boost to ensure it falls
        ballPhysics.velocity.y -= 2;
    }
}

// Handle game lost
function gameLost() {
    // Show lose screen
    document.getElementById('lose-screen').style.display = 'block';
}

// Update obstacle positions based on their movement paths
function updateObstacles(deltaTime) {
    gameState.obstacles.forEach(obstacle => {
        const movement = obstacle.userData.movement;
        if (!movement) return; // Skip obstacles with no movement data
        
        switch (movement.type) {
            case 'horizontal':
                // Left-right movement
                obstacle.position.x += movement.speed * movement.direction * deltaTime;
                
                // Change direction at boundaries
                if (obstacle.position.x >= movement.endX) {
                    obstacle.position.x = movement.endX;
                    movement.direction = -1;
                } else if (obstacle.position.x <= movement.startX) {
                    obstacle.position.x = movement.startX;
                    movement.direction = 1;
                }
                break;
                
            case 'diagonal':
                // Move along diagonal path
                movement.progress += deltaTime * movement.speed * 0.1 * (movement.direction || 1);
                
                // Reverse direction at endpoints instead of teleporting
                if (movement.progress >= 1) {
                    movement.progress = 1;
                    movement.direction = -1; // Start moving back
                } else if (movement.progress <= 0) {
                    movement.progress = 0;
                    movement.direction = 1;  // Start moving forward
                }
                
                // Interpolate position
                obstacle.position.x = movement.startX + (movement.endX - movement.startX) * movement.progress;
                obstacle.position.z = movement.startZ + (movement.endZ - movement.startZ) * movement.progress;
                break;
                
            case 'circular':
                // Circular movement
                movement.angle += deltaTime * movement.speed;
                obstacle.position.x = movement.centerX + Math.cos(movement.angle) * movement.radius;
                obstacle.position.z = movement.centerZ + Math.sin(movement.angle) * movement.radius;
                
                // Rotate obstacle to face tangent to circle
                obstacle.rotation.y = movement.angle + Math.PI/2;
                break;
                
            case 'vertical':
                // Up-down floating movement
                obstacle.position.y += movement.speed * movement.direction * deltaTime;
                
                // Change direction at height limits
                if (obstacle.position.y >= movement.endY) {
                    obstacle.position.y = movement.endY;
                    movement.direction = -1;
                } else if (obstacle.position.y <= movement.startY) {
                    obstacle.position.y = movement.startY;
                    movement.direction = 1;
                }
                break;
                
            case 'zigzag':
                // Zigzag movement along x axis while moving forward
                obstacle.position.x += movement.speed * movement.direction * deltaTime;
                
                // Change direction at boundaries
                if (obstacle.position.x >= movement.rightX) {
                    obstacle.position.x = movement.rightX;
                    movement.direction = -1;
                } else if (obstacle.position.x <= movement.leftX) {
                    obstacle.position.x = movement.leftX;
                    movement.direction = 1;
                }
                break;
        }
    });
}

// Add camera shake effect for more impact feedback
let cameraShake = {
    active: false,
    intensity: 0,
    duration: 0,
    startTime: 0
};

function shakeCamera(intensity = 1.0) {
    cameraShake = {
        active: true,
        intensity: intensity,
        duration: 0.3, // seconds
        startTime: Date.now()
    };
}

// Animation loop
let lastTime = 0;
function animate(currentTime) {
    requestAnimationFrame(animate);

    // Calculate delta time in seconds
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Skip first frame with zero deltaTime
    if (deltaTime > 0) {
        // Update obstacles positions
        updateObstacles(deltaTime);
        
        updateBallPhysics(deltaTime);
        
        // Animate Messi
        animateMessi(deltaTime);
        
        // Animate particles if visible
        if (particles && particles.visible) {
            particles.rotation.y += deltaTime * 0.5;
            
            // Make particles move upward
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += deltaTime * 1.0; // Move up
                
                // Reset particles that go too high
                if (positions[i + 1] > 10) {
                    positions[i + 1] = 0;
                }
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update collision effects
        scene.children.forEach(child => {
            if (child.userData.isCollisionEffect) {
                // Update positions based on velocities
                const positions = child.geometry.attributes.position.array;
                const velocities = child.userData.velocities;
                
                for (let i = 0, j = 0; i < velocities.length; i++, j += 3) {
                    positions[j] += velocities[i].x * deltaTime;
                    positions[j+1] += velocities[i].y * deltaTime;
                    positions[j+2] += velocities[i].z * deltaTime;
                }
                
                child.geometry.attributes.position.needsUpdate = true;
                
                // Fade out based on age
                const age = (Date.now() - child.userData.creationTime) / 600; // 0 to 1 over 600ms
                child.material.opacity = 0.8 * (1 - age);
            }
        });
        
        // Animate net panels
        soccerGoal.group.children.forEach(child => {
            if (child.userData.isNet) {
                animateNet(child, currentTime);
            }
        });
    }
    
    // Handle camera position
    if (gameState.hasLost && gameState.lastCameraPosition) {
        // If game is lost, keep camera fixed at the last position during falling
        camera.position.copy(gameState.lastCameraPosition);
        camera.lookAt(gameState.lastCameraLookAt);
    } else if (gameState.isFalling) {
        // When ball is falling, keep camera at ground level
        // Get horizontal position from the ball, but keep fixed height
        const cameraPosition = new THREE.Vector3();
        cameraPosition.x = football.position.x;
        cameraPosition.y = 1.5; // Fixed camera height at ground level
        
        // Pull camera back a bit to get a wider view of the falling ball
        const distanceBehind = 8;
        cameraPosition.z = football.position.z + distanceBehind;
        
        // Apply camera position immediately, without smoothing
        camera.position.copy(cameraPosition);
        camera.lookAt(football.position);
    } else {
        // Normal gameplay - camera follows the ball from behind
        const cameraPosition = new THREE.Vector3();
        cameraPosition.copy(football.position);
        cameraPosition.z += 7; // Camera is 7 units behind the ball
        cameraPosition.y += 3; // Camera is 3 units above the ball
        
        // Apply camera shake if active
        if (cameraShake.active) {
            const elapsed = (Date.now() - cameraShake.startTime) / 1000;
            if (elapsed < cameraShake.duration) {
                // Calculate shake intensity based on remaining duration
                const shakeFactor = 1 - (elapsed / cameraShake.duration);
                // Apply random offset to camera position
                cameraPosition.x += (Math.random() - 0.5) * 2 * cameraShake.intensity * shakeFactor;
                cameraPosition.y += (Math.random() - 0.5) * 2 * cameraShake.intensity * shakeFactor;
            } else {
                cameraShake.active = false;
            }
        }
        
        // Set the camera position with smoothing (lerp)
        const smoothFactor = 0.1;
        camera.position.lerp(cameraPosition, smoothFactor);
        camera.lookAt(football.position);
    }
    
    renderer.render(scene, camera);
}

// Function to animate net panels
function animateNet(netMesh, time) {
    const geometry = netMesh.geometry;
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

// Animate Messi based on his animation state
function animateMessi(deltaTime) {
    const animState = messi.userData.animationState;
    
    // Update animation timer
    messi.userData.animationTime += deltaTime;
    
    if (animState.celebrating) {
        // Celebration animation (arms up, jumping)
        const celebTime = messi.userData.animationTime;
        const jumpHeight = Math.abs(Math.sin(celebTime * 5)) * 0.3;
        
        messi.position.y = messi.userData.baseY + jumpHeight;
        
        // Find arms and raise them up
        messi.children.forEach(part => {
            if (part.geometry.type === 'CylinderGeometry' && part.position.y > 1.2 && (part.position.x > 0.3 || part.position.x < -0.3)) {
                // This is an arm
                const targetRotation = -Math.PI / 2 * 0.8; // Raise arms up but not completely vertical
                const currentRotationZ = part.rotation.z;
                
                // Determine direction based on which arm it is
                const rotationDirection = part.position.x > 0 ? -1 : 1;
                const targetRotationZ = targetRotation * rotationDirection;
                
                // Smoothly interpolate to target rotation
                part.rotation.z = currentRotationZ + (targetRotationZ - currentRotationZ) * Math.min(1, deltaTime * 5);
            }
        });
        
        // After 3 seconds, go back to idle
        if (celebTime > 3) {
            animState.celebrating = false;
            animState.idle = true;
            messi.userData.animationTime = 0;
        }
    } else if (animState.jumping) {
        // Jump animation
        const jumpTime = messi.userData.animationTime;
        const jumpCurve = Math.sin(Math.min(jumpTime * 10, Math.PI));
        const jumpHeight = jumpCurve * 0.5;
        
        messi.position.y = messi.userData.baseY + jumpHeight;
        
        // After jump completes, go back to idle
        if (jumpTime > 0.5) {
            animState.jumping = false;
            animState.idle = true;
            messi.userData.animationTime = 0;
            messi.position.y = messi.userData.baseY;
        }
    } else if (animState.idle) {
        // Subtle idle animation (gentle bobbing)
        const idleTime = messi.userData.animationTime;
        const idleBob = Math.sin(idleTime * 2) * 0.02;
        
        messi.position.y = messi.userData.baseY + idleBob;
        
        // Reset arm positions gradually
        messi.children.forEach(part => {
            if (part.geometry.type === 'CylinderGeometry' && part.position.y > 1.2 && (part.position.x > 0.3 || part.position.x < -0.3)) {
                // This is an arm
                const defaultRotation = Math.PI / 6;
                const currentRotationZ = part.rotation.z;
                
                // Determine direction based on which arm it is
                const rotationDirection = part.position.x > 0 ? -1 : 1;
                const targetRotationZ = defaultRotation * rotationDirection;
                
                // Smoothly interpolate to default rotation
                part.rotation.z = currentRotationZ + (targetRotationZ - currentRotationZ) * Math.min(1, deltaTime * 3);
            }
        });
    }
}

animate(0); 
