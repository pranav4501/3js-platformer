export default class FieldModel {
    constructor() {
        // Field dimensions
        this.width = 10; // Corridor width
        this.length = 60; // Corridor length
        
        // Goal area dimensions
        this.goalAreaWidth = 8;
        this.goalAreaDepth = 5;
        
        // Goal dimensions
        this.goalWidth = 7; 
        this.goalHeight = 4;
        this.goalDepth = 3;
        
        // Field position
        this.position = { x: 0, y: -0.49, z: -25 };
        
        // Ceiling height (max height the ball can go)
        this.ceilingHeight = 10;
        
        // Boundaries for detecting out of bounds
        this.boundaries = {
            minX: -this.width / 2,
            maxX: this.width / 2,
            minZ: -this.length / 2 - this.position.z,
            maxZ: this.length / 2 - this.position.z,
            maxY: this.ceilingHeight // Maximum height (ceiling)
        };
        
        // Goal position (relative to field center)
        this.goalPosition = { 
            x: 0, 
            y: this.goalHeight / 2, 
            z: -this.length / 2 - this.position.z 
        };
    }

    isOutOfBounds(position) {
        return position.x < this.boundaries.minX || 
               position.x > this.boundaries.maxX ||
               position.z < this.boundaries.minZ || 
               position.z > this.boundaries.maxZ ||
               position.y > this.boundaries.maxY; // Check if above ceiling
    }

    isInGoalArea(position) {
        return position.x > -this.goalAreaWidth / 2 && 
               position.x < this.goalAreaWidth / 2 &&
               position.z < this.boundaries.minZ + this.goalAreaDepth;
    }
} 
