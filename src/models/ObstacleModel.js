export default class ObstacleModel {
    constructor(id, position, size = { width: 2, height: 2, depth: 0.5 }, movementData = null) {
        this.id = id;
        this.position = { ...position };
        this.size = { ...size };
        this.movementData = movementData;
        
        // For obstacles with movement
        if (movementData) {
            this.movementData.progress = 0;
            this.movementData.direction = 1;
            this.originalPosition = { ...position };
        }
    }

    update(deltaTime) {
        if (!this.movementData) return;

        const { type, speed } = this.movementData;
        
        // Update progress based on deltaTime and direction
        this.movementData.progress += speed * deltaTime * this.movementData.direction;
        
        // Reverse direction when reaching endpoints
        if (this.movementData.progress >= 1) {
            this.movementData.progress = 1;
            this.movementData.direction = -1;
        } else if (this.movementData.progress <= 0) {
            this.movementData.progress = 0;
            this.movementData.direction = 1;
        }
        
        // Calculate new position based on movement type
        switch (type) {
            case 'horizontal':
                this.position.x = this.calculateMovement(
                    this.movementData.startX, 
                    this.movementData.endX
                );
                break;
                
            case 'vertical':
                this.position.y = this.calculateMovement(
                    this.movementData.startY, 
                    this.movementData.endY
                );
                break;
                
            case 'diagonal':
                this.position.x = this.calculateMovement(
                    this.movementData.startX, 
                    this.movementData.endX
                );
                this.position.z = this.calculateMovement(
                    this.movementData.startZ, 
                    this.movementData.endZ
                );
                break;
                
            case 'circular':
                const angle = this.movementData.progress * Math.PI * 2;
                this.position.x = this.originalPosition.x + Math.cos(angle) * this.movementData.radius;
                this.position.z = this.originalPosition.z + Math.sin(angle) * this.movementData.radius;
                break;
                
            case 'zigzag':
                // Calculate a zigzag pattern using sin function
                const zigProgress = this.movementData.progress * Math.PI * 4; // Multiple periods
                this.position.x = this.originalPosition.x + Math.sin(zigProgress) * this.movementData.amplitude;
                this.position.z = this.calculateMovement(
                    this.movementData.startZ, 
                    this.movementData.endZ
                );
                break;
        }
    }
    
    calculateMovement(start, end) {
        return start + (end - start) * this.movementData.progress;
    }
} 
