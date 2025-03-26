import * as THREE from 'three';

/**
 * Creates a vintage-style scoreboard
 */
export default class Scoreboard {
    constructor(scene) {
        this.scene = scene;
        this.scoreboardGroup = new THREE.Group();
        this.decorativeObjects = [];
    }
    
    /**
     * Create the scoreboard at the specified position
     */
    create(position, width, length, buffer) {
        // Scoreboard dimensions
        const scoreboardWidth = 10;
        const scoreboardHeight = 5;
        const scoreboardDepth = 0.5;
        
        // Position behind the goal, outside bounds
        const scoreboardPosition = new THREE.Vector3(
            position.x,
            position.y + scoreboardHeight/2 + 1,
            position.z - length/2 - buffer - 20 // Well behind the goal
        );
        
        // Set scoreboard group position
        this.scoreboardGroup.position.copy(scoreboardPosition);
        
        // Main scoreboard frame - now vintage aged wood look
        const frameGeometry = new THREE.BoxGeometry(scoreboardWidth, scoreboardHeight, scoreboardDepth);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x332211, // Dark aged wood color
            roughness: 0.9,
            metalness: 0.1
        });
        
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        this.scoreboardGroup.add(frame);
        this.decorativeObjects.push(frame);
        
        // Scoreboard display screen
        const screenGeometry = new THREE.PlaneGeometry(scoreboardWidth - 0.8, scoreboardHeight - 0.8);
        
        // Create a canvas for the scoreboard display
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Create vintage background texture with slight noise
        context.fillStyle = '#000000'; // Black background
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add subtle vintage noise/grain
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Add random noise to create vintage effect
            const noise = Math.floor(Math.random() * 20);
            data[i] = Math.min(data[i] + noise, 255); // R
            data[i+1] = Math.min(data[i+1] + noise, 255); // G
            data[i+2] = Math.min(data[i+2] + noise, 255); // B
        }
        context.putImageData(imageData, 0, 0);
        
        // Add aged border
        context.strokeStyle = '#999999'; // Aged silver look
        context.lineWidth = 12;
        context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
        
        // Add inner border for vintage feel
        context.strokeStyle = '#333333';
        context.lineWidth = 2;
        context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // Add team names in vintage typography
        context.font = 'bold 48px Courier, monospace'; // More vintage font
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';
        context.fillText('HOME', canvas.width * 0.25, 70);
        context.fillText('AWAY', canvas.width * 0.75, 70);
        
        // Add divider - simple line for vintage look
        context.beginPath();
        context.moveTo(canvas.width / 2, 30);
        context.lineTo(canvas.width / 2, canvas.height - 30);
        context.strokeStyle = '#AAAAAA';
        context.lineWidth = 2;
        context.stroke();
        
        // Add scores in vintage flip-card style (simulated)
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 96px "Courier New", monospace';
        
        // Home score with vintage number display
        this.drawVintageNumber(context, '0', canvas.width * 0.25, 160);
        
        // Away score with vintage number display
        this.drawVintageNumber(context, '0', canvas.width * 0.75, 160);
        
        // Add time in vintage style
        context.font = 'bold 36px "Courier New", monospace';
        
        // Add vintage time display
        context.fillStyle = '#AAAAAA'; // Lighter color for time
        context.fillText('00:00', canvas.width * 0.5, 230);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide
        });
        
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.z = scoreboardDepth / 2 + 0.01; // Slightly in front of the frame
        this.scoreboardGroup.add(screen);
        this.decorativeObjects.push(screen);
        
        // Add scoreboard supports (aged metal poles)
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, scoreboardHeight + 2, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555, // Aged metal color
            roughness: 0.8,
            metalness: 0.4
        });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-scoreboardWidth/2 + 0.5, -scoreboardHeight/2 - 1, 0);
        this.scoreboardGroup.add(leftLeg);
        this.decorativeObjects.push(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(scoreboardWidth/2 - 0.5, -scoreboardHeight/2 - 1, 0);
        this.scoreboardGroup.add(rightLeg);
        this.decorativeObjects.push(rightLeg);
        
        // Add to scene
        this.scene.add(this.scoreboardGroup);
        
        return this;
    }
    
    /**
     * Helper to draw vintage-style scoreboard numbers
     */
    drawVintageNumber(context, number, x, y) {
        // Draw a vintage-style background for the number
        context.fillStyle = '#222222';
        context.fillRect(x - 40, y - 70, 80, 100);
        
        // Draw an inner border to simulate the number card
        context.strokeStyle = '#444444';
        context.lineWidth = 1;
        context.strokeRect(x - 35, y - 65, 70, 90);
        
        // Draw the number in white
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 96px "Courier New", monospace';
        context.fillText(number, x, y + 10);
    }
    
    /**
     * Update the score on the scoreboard
     */
    updateScore(homeScore, awayScore) {
        // This would update the texture with new scores
        // Would need to recreate the canvas and update the texture
    }
    
    /**
     * Update the game time on the scoreboard
     */
    updateTime(minutes, seconds) {
        // This would update the time display on the scoreboard
        // Would need to recreate the canvas and update the texture
    }
    
    /**
     * Get the scoreboard group
     */
    getGroup() {
        return this.scoreboardGroup;
    }
    
    /**
     * Get all scoreboard objects for collision detection
     */
    getObjects() {
        return this.decorativeObjects;
    }
} 
