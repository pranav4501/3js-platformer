import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Represents a football player with slide tackling animation
 */
export default class FootballPlayer {
    constructor(scene, position, rotation = 0, scale = 1) {
        this.scene = scene;
        this.initialPosition = position.clone();
        this.rotation = rotation;
        this.scale = scale;
        this.mesh = new THREE.Group(); // Root object for the player model
        this.mesh.position.copy(position);
        this.mesh.rotation.y = rotation;
        
        // Add a box collider that will be replaced with the model
        this.collider = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 1),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.mesh.add(this.collider);
        
        // Load the player model
        this.loadPlayerModel();
    }
    
    /**
     * Load the football player model
     */
    loadPlayerModel() {
        // Create temporary visible placeholder while model loads
        const placeholder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16),
            new THREE.MeshStandardMaterial({ color: 0x2222ff })
        );
        placeholder.position.y = 0.9; // Center vertically
        this.mesh.add(placeholder);
        
        // For now, we'll use a simplified model with animation
        // Could be replaced with a real player model
        this.createSimplifiedPlayer();
        
        // The following code would be used to load a GLTF model 
        /* 
        const loader = new GLTFLoader();
        loader.load(
            '/src/models/football_player.glb', // Path to model
            (gltf) => {
                // Remove placeholder
                this.mesh.remove(placeholder);
                
                // Adjust model
                const model = gltf.scene;
                model.scale.set(this.scale, this.scale, this.scale);
                
                // Set up shadows
                model.traverse(node => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                
                // Add model to mesh group
                this.mesh.add(model);
                
                // Set up animations
                if (gltf.animations && gltf.animations.length) {
                    this.mixer = new THREE.AnimationMixer(model);
                    this.animations = {};
                    
                    gltf.animations.forEach(clip => {
                        this.animations[clip.name] = this.mixer.clipAction(clip);
                    });
                    
                    // Play slide tackle animation by default
                    if (this.animations['slide_tackle']) {
                        this.animations['slide_tackle'].play();
                    }
                }
            },
            undefined,
            (error) => {
                console.error('Error loading football player model:', error);
            }
        );
        */
    }
    
    /**
     * Create a simplified player model with sliding animation
     */
    createSimplifiedPlayer() {
        // Remove any placeholder
        this.mesh.children.forEach(child => {
            if (child !== this.collider) {
                this.mesh.remove(child);
            }
        });
        
        // Create body parts with simple geometries
        const playerGroup = new THREE.Group();
        
        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.6, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x2222ff }) // Blue jersey
        );
        torso.position.y = 0.3;
        playerGroup.add(torso);
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffd0b0 }) // Skin tone
        );
        head.position.y = 0.7;
        playerGroup.add(head);
        
        // Arms
        const leftArm = this.createLimb(0.1, 0.4, 0.1, 0x2222ff);
        leftArm.position.set(-0.25, 0.3, 0);
        leftArm.rotation.z = -Math.PI / 4; // Angled outward
        playerGroup.add(leftArm);
        
        const rightArm = this.createLimb(0.1, 0.4, 0.1, 0x2222ff);
        rightArm.position.set(0.25, 0.3, 0);
        rightArm.rotation.z = Math.PI / 4; // Angled outward
        playerGroup.add(rightArm);
        
        // Legs
        const leftLeg = this.createLimb(0.15, 0.5, 0.15, 0xffffff); // White shorts
        leftLeg.position.set(-0.15, -0.25, 0);
        playerGroup.add(leftLeg);
        this.leftLeg = leftLeg;
        
        const rightLeg = this.createLimb(0.15, 0.5, 0.15, 0xffffff);
        rightLeg.position.set(0.15, -0.25, 0);
        playerGroup.add(rightLeg);
        this.rightLeg = rightLeg;
        
        // Position the player into a slide tackle pose
        // Rotate torso forward
        torso.rotation.x = -Math.PI / 4;
        head.position.z = -0.1; // Move head forward to match torso rotation
        
        // Position legs for sliding
        this.leftLeg.rotation.x = Math.PI / 2; // Extended forward for slide
        this.rightLeg.rotation.x = 0; // Tucked under for slide
        
        // Add to mesh
        playerGroup.position.y = 0.1; // Slightly off ground
        playerGroup.rotation.y = Math.PI; // Face correct direction
        this.mesh.add(playerGroup);
        this.playerGroup = playerGroup;
        
        // Set all parts to cast shadows
        playerGroup.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
    }
    
    /**
     * Create a limb mesh with the given dimensions
     */
    createLimb(width, height, depth, color) {
        const limb = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({ color: color })
        );
        // Place pivot point at top of limb
        limb.geometry.translate(0, -height/2, 0);
        return limb;
    }
    
    /**
     * Update the player's animation
     */
    update(deltaTime) {
        // If we have a mixer (for GLTF animations), update it
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // For the simplified model, animate the slide
        if (this.playerGroup) {
            // Simple sliding leg animation
            const slideFrequency = 5;
            const slideAmount = Math.sin(Date.now() * 0.005 * slideFrequency) * 0.1;
            
            if (this.leftLeg) {
                this.leftLeg.position.z = slideAmount;
            }
            if (this.rightLeg) {
                this.rightLeg.position.z = -slideAmount;
            }
        }
    }
    
    /**
     * Get the player mesh for adding to scene
     */
    getMesh() {
        return this.mesh;
    }
} 
