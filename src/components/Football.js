import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Represents the football in the game
 */
export default class Football {
    constructor(radius = 0.5, segments = 32) {
        this.radius = radius;
        this.segments = segments;
        this.mesh = new THREE.Group(); // Use Group as root object
        this.modelLoaded = false;
        this.loadFootballModel();
    }

    /**
     * Load the 3D football model
     */
    loadFootballModel() {
        const loader = new GLTFLoader();
        
        // Try different possible paths to the model
        const possiblePaths = [
            '/soccer_ball/scene.gltf',
            '/assets/soccer_ball/scene.gltf',
            './soccer_ball/scene.gltf'
        ];
        
        let loadAttempt = 0;
        const tryLoad = () => {
            if (loadAttempt >= possiblePaths.length) {
                console.error('Failed to load football model after trying all paths');
                const fallbackMesh = this.createBasicFootball();
                this.mesh.add(fallbackMesh);
                return;
            }
            
            const path = possiblePaths[loadAttempt];
            console.log(`Attempting to load football model from: ${path}`);
            
            loader.load(
                path,
                (gltf) => {
                    console.log(`Successfully loaded football model from: ${path}`);
                    
                    // Completely flatten the model structure
                    const meshes = [];
                    gltf.scene.traverse((node) => {
                        if (node.isMesh) {
                            // Clone the geometry
                            const geometry = node.geometry.clone();
                            
                            // Create materials
                            const material = node.material.clone();
                            
                            // Create a new mesh with the geometry and material
                            const mesh = new THREE.Mesh(geometry, material);
                            
                            // Set up shadows
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                            
                            meshes.push(mesh);
                        }
                    });
                    
                    // Create a single centered geometry from all meshes
                    if (meshes.length > 0) {
                        // First, add all meshes to a temporary group
                        const tempGroup = new THREE.Group();
                        meshes.forEach(mesh => tempGroup.add(mesh));
                        
                        // Calculate the center of the combined geometries
                        const box = new THREE.Box3().setFromObject(tempGroup);
                        const center = box.getCenter(new THREE.Vector3());
                        console.log(`Model center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
                        
                        // Move all meshes to center their geometry
                        meshes.forEach(mesh => {
                            mesh.position.sub(center);
                        });
                        
                        // Create a ball group that will hold all centered meshes
                        const ballGroup = new THREE.Group();
                        meshes.forEach(mesh => ballGroup.add(mesh));
                        
                        // Scale the ball group to the desired radius
                        const size = box.getSize(new THREE.Vector3());
                        const maxDimension = Math.max(size.x, size.y, size.z);
                        const scale = (2 * this.radius) / maxDimension;
                        ballGroup.scale.set(scale, scale, scale);
                        
                        // Position the ball on the ground
                        this.mesh.position.set(0, this.radius + 0.01, 0);
                        
                        // Add the ball group to our mesh
                        this.mesh.add(ballGroup);
                        this.modelLoaded = true;
                    }
                },
                (xhr) => {
                    console.log(`${path}: ${(xhr.loaded / xhr.total * 100)}% loaded`);
                },
                (error) => {
                    console.error(`Error loading football model from ${path}:`, error);
                    loadAttempt++;
                    tryLoad();
                }
            );
        };
        
        tryLoad();
    }

    /**
     * Create a basic football mesh as fallback
     */
    createBasicFootball() {
        const ballGeometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        const ballMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.1
        });
        
        const football = new THREE.Mesh(ballGeometry, ballMaterial);
        football.castShadow = true;
        football.receiveShadow = true;
        
        return football;
    }

    /**
     * Reset the football position
     */
    reset() {
        this.mesh.position.set(0, this.radius + 0.01, 0);
        this.mesh.rotation.set(0, 0, 0);
    }

    /**
     * Update ball rotation based on velocity
     */
    updateRotation(velocity, deltaTime) {
        const horizontalSpeed = Math.sqrt(
            velocity.x * velocity.x + 
            velocity.z * velocity.z
        );
        
        if (horizontalSpeed > 0.1) {
            // Calculate rotation axis (perpendicular to movement direction)
            const rotationAxis = new THREE.Vector3(-velocity.z, 0, velocity.x).normalize();
            const rotationAmount = horizontalSpeed * deltaTime / this.radius;
            this.mesh.rotateOnWorldAxis(rotationAxis, rotationAmount);
        }
    }

    /**
     * Get the football mesh
     */
    getMesh() {
        return this.mesh;
    }
} 
