import * as THREE from 'three';

export default class SceneView {
    constructor() {
        // Initialize the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        // Set up camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        // For smooth camera following
        this.cameraTarget = new THREE.Vector3(0, 1, 0);
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
        
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Store camera shake values
        this.shakeIntensity = 0;
        this.shakeDecay = 5;
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Setup lights
        this.setupLights();
    }
    
    setupLights() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updateCamera(ballPosition, deltaTime) {
        // Update camera target (slightly above and ahead of the ball)
        this.cameraTarget.set(
            ballPosition.x,
            ballPosition.y + 1,
            ballPosition.z - 3
        );
        
        // Calculate the desired camera position
        const desiredPosition = new THREE.Vector3(
            ballPosition.x,
            ballPosition.y + this.cameraOffset.y,
            ballPosition.z + this.cameraOffset.z
        );
        
        // Smoothly interpolate current camera position to the desired position
        this.camera.position.lerp(desiredPosition, 2 * deltaTime);
        
        // Apply camera shake if active
        if (this.shakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
            
            // Reduce shake intensity over time
            this.shakeIntensity -= this.shakeDecay * deltaTime;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }
        
        // Look at the target
        this.camera.lookAt(this.cameraTarget);
    }
    
    shakeCamera(intensity = 1.0) {
        this.shakeIntensity = intensity;
    }
    
    setCameraEndPosition(position, lookAt) {
        this.camera.position.copy(position);
        this.camera.lookAt(lookAt);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
} 
