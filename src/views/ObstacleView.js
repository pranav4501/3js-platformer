import * as THREE from 'three';

export default class ObstacleView {
    constructor(scene, obstacleModels) {
        this.scene = scene;
        this.meshes = [];

        // Create obstacle meshes
        obstacleModels.forEach(obstacleModel => {
            const mesh = this.createObstacleMesh(obstacleModel);
            this.meshes.push(mesh);
            scene.add(mesh);
        });
    }

    createObstacleMesh(obstacleModel) {
        const { width, height, depth } = obstacleModel.size;
        
        // Create obstacle geometry and material
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: this.getRandomColor(),
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Set initial position
        mesh.position.set(
            obstacleModel.position.x,
            obstacleModel.position.y,
            obstacleModel.position.z
        );
        
        // Add rotation if this is a diagonal obstacle
        if (obstacleModel.movementData && obstacleModel.movementData.type === 'diagonal') {
            mesh.rotation.y = Math.PI / 4; // 45 degrees
        }
        
        // Set casting shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store reference to the model for updating
        mesh.userData.modelId = obstacleModel.id;
        
        return mesh;
    }
    
    getRandomColor() {
        // Define a list of vibrant colors for obstacles
        const colors = [
            0xFF5252, // Red
            0x448AFF, // Blue
            0xFFEB3B, // Yellow
            0x4CAF50, // Green
            0xE040FB, // Purple
            0xFF9800  // Orange
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateObstacles(obstacleModels) {
        // Update the position of each obstacle mesh based on its model
        this.meshes.forEach(mesh => {
            const model = obstacleModels.find(m => m.id === mesh.userData.modelId);
            if (model) {
                mesh.position.set(
                    model.position.x,
                    model.position.y,
                    model.position.z
                );
            }
        });
    }
    
    getMeshById(id) {
        return this.meshes.find(mesh => mesh.userData.modelId === id);
    }
} 
