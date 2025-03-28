import * as THREE from 'three';
import Football from './Football.js';
import FootballField from './FootballField.js';
import SoccerGoal from './SoccerGoal.js';
import EffectsManager from './EffectsManager.js';

/**
 * Creates an interactive home screen with the ball on a podium and dramatic lighting
 */
export default class HomeScreen {
    constructor(startGameCallback) {
        this.startGameCallback = startGameCallback;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.isActive = true;
        this.animationId = null;
        this.ball = null;
        this.ballVelocity = new THREE.Vector3();
        this.ballInGoal = false;
        this.ballResetTimer = null;
        this.confettiActive = false;
        
        // Interactive states
        this.state = 'idle'; // idle, play, settings
        this.animationProgress = 0;
        this.spotlights = [];
        this.podium = null;
        this.hoverEffects = {};
        
        this.init();
    }
    
    /**
     * Initialize the home screen
     */
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.setClearColor(0x87ceeb); // Dark blue-black background for dramatic effect
        
        // Create canvas container
        this.container = document.createElement('div');
        this.container.id = 'home-screen-canvas';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1';
        document.body.appendChild(this.container);
        this.container.appendChild(this.renderer.domElement);
        
        // Create UI container
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'home-screen-ui';
        this.uiContainer.style.position = 'fixed';
        this.uiContainer.style.top = '0';
        this.uiContainer.style.left = '0';
        this.uiContainer.style.width = '100%';
        this.uiContainer.style.height = '100%';
        this.uiContainer.style.display = 'flex';
        this.uiContainer.style.flexDirection = 'column';
        this.uiContainer.style.justifyContent = 'center';
        this.uiContainer.style.alignItems = 'center';
        this.uiContainer.style.zIndex = '2';
        document.body.appendChild(this.uiContainer);
        
        // Create title
        this.createTitle();
        
        // Create interactive menu
        this.createInteractiveMenu();
        
        // Setup camera for podium view
        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 2, 0);
        
        // Setup dramatic lighting
        this.createDramaticLighting();
        
        // Create podium
        this.createPodium();
        
        // Use existing game components
        this.setupGameComponents();
        
        // Position ball on podium initially
        this.ball.position.set(0, 2.5, 0);
        
        // Create goal but hide it initially
        this.goal.getGroup().position.set(0, 0, -20);
        this.goal.getGroup().visible = false;
        
        // Hide field initially
        this.field.getFloorGroup().visible = false;
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Start animation loop
        this.animate();
    }
    
    /**
     * Add lighting to the scene
     */
    addLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }
    
    /**
     * Setup game components using existing classes
     */
    setupGameComponents() {
        // Create field using existing class
        this.field = new FootballField();
        this.scene.add(this.field.getFloorGroup());
        this.field.getFloorGroup().visible = false; // Hide initially
        
        // Create goal using existing class
        this.goal = new SoccerGoal();
        this.goal.getGroup().position.set(0, 0, -30);
        this.goal.getGroup().visible = false; // Hide initially
        this.scene.add(this.goal.getGroup());
        
        // Create ball using existing class
        this.football = new Football();
        this.ball = this.football.getMesh();
        this.ball.position.set(0, 2.5, 0); // Position on podium
        this.scene.add(this.ball);
        
        // Create effects manager for confetti (hidden initially)
        this.effectsManager = new EffectsManager(this.scene);
        this.effectsManager.goalPosition.copy(this.goal.getGroup().position);
    }
    
    /**
     * Reset ball for animation cycle
     */
    resetBallAnimation() {
        // Position ball at start, elevated slightly
        this.ball.position.set(0, 0.5, 5);
        
        // Set initial velocity (mainly forward with slight side movement)
        this.ballVelocity.set(
            (Math.random() - 0.5) * 3,  // Random x movement
            1.5 + Math.random(),        // Up initially for arc
            -15 - Math.random() * 5     // Fast forward movement
        );
        
        this.ballInGoal = false;
        this.confettiActive = false;
        
        // Clear any existing reset timer
        if (this.ballResetTimer) {
            clearTimeout(this.ballResetTimer);
        }
    }
    
    /**
     * Window resize handler
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Animation loop
     */
    animate(currentTime) {
        if (!this.isActive) return;
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        // Calculate delta time
        const deltaTime = currentTime ? (currentTime - (this.lastTime || 0)) / 1000 : 0.016;
        this.lastTime = currentTime;
        
        // Animate accent spotlights
        this.spotlights.forEach((spotlight, index) => {
            if (index > 0 && spotlight.userData) { // Skip main spotlight
                const angle = spotlight.userData.initialAngle + 
                              (currentTime / 2000) * spotlight.userData.speed;
                const radius = spotlight.userData.radius;
                
                spotlight.position.x = Math.cos(angle) * radius;
                spotlight.position.z = Math.sin(angle) * radius;
                
                // Point toward ball
                spotlight.target = this.ball;
            }
        });
        
        // Animate glow ring
        if (this.glowRing) {
            this.glowRing.rotation.z += deltaTime * 0.5;
            
            // Pulse effect based on state
            const pulseSpeed = this.state === 'idle' ? 1 : 2;
            const pulseIntensity = this.state === 'idle' ? 0.2 : 0.4;
            this.glowRing.material.opacity = 0.3 + Math.sin(currentTime / 500 * pulseSpeed) * pulseIntensity;
        }
        
        // Animate inner glow ring with different timing
        if (this.innerGlowRing) {
            this.innerGlowRing.rotation.z -= deltaTime * 0.7;
            this.innerGlowRing.material.opacity = 0.6 + Math.sin(currentTime / 700) * 0.3;
        }
        
        // Animate light beam
        if (this.lightBeam) {
            this.lightBeam.material.opacity = 0.15 + Math.sin(currentTime / 600) * 0.1;
            this.lightBeam.scale.y = 1 + Math.sin(currentTime / 800) * 0.1;
        }
        
        // Animate light particles
        if (this.lightParticles) {
            this.lightParticles.children.forEach(particle => {
                // Move particles up
                particle.position.y += particle.userData.speed;
                
                // Fade out as they reach the ball
                const distanceToTop = 2.5 - particle.position.y;
                if (distanceToTop < 0.5) {
                    particle.material.opacity = distanceToTop * 0.8;
                }
                
                // Reset particles when they reach the ball or fade out
                if (particle.position.y > 2.5 || particle.material.opacity < 0.1) {
                    particle.position.y = particle.userData.originalY;
                    particle.material.opacity = 0.3 + Math.random() * 0.4;
                }
                
                // Random subtle movement
                particle.position.x += (Math.random() - 0.5) * 0.01;
                particle.position.z += (Math.random() - 0.5) * 0.01;
                
                // Keep particles within the beam
                const distance = Math.sqrt(particle.position.x * particle.position.x + 
                                        particle.position.z * particle.position.z);
                if (distance > 0.35) {
                    const angle = Math.atan2(particle.position.z, particle.position.x);
                    particle.position.x = Math.cos(angle) * 0.35;
                    particle.position.z = Math.sin(angle) * 0.35;
                }
            });
        }
        
        // Animate ball floating and rotation in idle state
        if (this.state === 'idle') {
            this.ball.position.y = 2.5 + Math.sin(currentTime / 1000) * 0.1;
            this.ball.rotation.y += deltaTime * 0.5;
        }
        
        // Animate ball in play hover state
        if (this.state === 'play') {
            this.ball.position.y = 2.5 + Math.sin(currentTime / 500) * 0.2;
            this.ball.rotation.y += deltaTime * 1.0;
            this.ball.rotation.x += deltaTime * 0.5;
        }
        
        // Animate ball in levels hover state
        if (this.state === 'levels') {
            this.ball.position.y = 2.5 + Math.sin(currentTime / 700) * 0.15;
            this.ball.rotation.y += deltaTime * 0.8;
            this.ball.rotation.z += deltaTime * 0.4;
        }
        
        // Update confetti animation if active
        if (this.confettiActive) {
            this.effectsManager.updateParticles(deltaTime);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Start the game
     */
    startGame() {
        if (this.startGameCallback) {
            this.startGameCallback();
        }
        this.hide();
    }
    
    /**
     * Set the scene state based on menu interaction
     */
    setSceneState(state) {
        if (this.state === state) return;
        this.state = state;
        this.animationProgress = 0;
        
        // Update lighting colors based on state
        switch (state) {
            case 'play':
                this.glowRing.material.color.set(0x4CAF50); // Green
                this.spotlights[0].color.set(0xffffff); // Main spotlight remains white
                break;
                
            case 'levels':
                this.glowRing.material.color.set(0xFF9800); // Orange
                this.spotlights[0].color.set(0xfff0e0); // Warm light for levels
                break;
                
            case 'idle':
            default:
                this.glowRing.material.color.set(0x4444aa); // Default blue
                this.spotlights[0].color.set(0xffffff); // Reset main spotlight
                break;
        }
    }
    
    /**
     * Start the game animation and transition
     */
    startGameAnimation() {
        // Disable buttons during animation
        this.playButton.style.pointerEvents = 'none';
        this.levelsButton.style.pointerEvents = 'none';
        
        // Fade out title and menu
        this.title.style.transition = 'opacity 1s ease';
        this.menuContainer.style.transition = 'opacity 1s ease';
        this.title.style.opacity = '0';
        this.menuContainer.style.opacity = '0';
        
        // Make goal visible
        this.goal.getGroup().visible = true;
        
        // Make field visible
        this.field.getFloorGroup().visible = true;
        
        // Animate camera to game position
        const initialCameraPos = this.camera.position.clone();
        const initialCameraLookAt = new THREE.Vector3(0, 2, 0);
        const targetCameraPos = new THREE.Vector3(0, 5, 10);
        const targetLookAt = new THREE.Vector3(0, 0, -20);
        
        let animationProgress = 0;
        const animateTrans = () => {
            if (animationProgress >= 1) {
                // Animation complete, start game
                if (this.startGameCallback) {
                    this.startGameCallback();
                }
                this.hide();
                return;
            }
            
            animationProgress += 0.02;
            
            // Move camera
            this.camera.position.lerpVectors(initialCameraPos, targetCameraPos, animationProgress);
            
            // Update lookAt
            const currentLookAt = new THREE.Vector3();
            currentLookAt.lerpVectors(initialCameraLookAt, targetLookAt, animationProgress);
            this.camera.lookAt(currentLookAt);
            
            // Animate ball to move toward goal
            this.ball.position.z = THREE.MathUtils.lerp(2.5, -10, Math.min(1, animationProgress * 1.5));
            this.ball.position.y = THREE.MathUtils.lerp(2.5, 0.5, Math.min(1, animationProgress * 1.5));
            
            // Rotate ball
            this.ball.rotation.x -= 0.2;
            
            setTimeout(animateTrans, 16);
        };
        
        animateTrans();
    }
    
    /**
     * Show level map
     */
    showLevelMap() {
        // Using the LevelMap component from a separate file
        if (!this.levelMap) {
            // Import dynamically to avoid circular dependencies
            import('./LevelMap.js').then(module => {
                const LevelMap = module.default;
                this.levelMap = new LevelMap(this.startGameCallback);
                this.levelMap.show();
            });
        } else {
            this.levelMap.show();
        }
    }
    
    /**
     * Show settings popup
     */
    showSettings() {
        this.settingsPopup.style.display = 'block';
    }
    
    /**
     * Hide settings popup
     */
    hideSettings() {
        this.settingsPopup.style.display = 'none';
    }
    
    /**
     * Hide the home screen
     */
    hide() {
        this.isActive = false;
        
        // Remove the animation elements
        if (this.container) {
            document.body.removeChild(this.container);
        }
        
        if (this.uiContainer) {
            document.body.removeChild(this.uiContainer);
        }
        
        if (this.settingsPopup) {
            document.body.removeChild(this.settingsPopup);
        }
        
        // Hide level map if it exists
        if (this.levelMap) {
            this.levelMap.hide();
        }
        
        // Clear all objects from the scene
        this.clouds.forEach(cloud => {
            this.scene.remove(cloud);
        });
        this.clouds = [];
        
        // Cancel animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clean up event listeners
        window.removeEventListener('resize', this.onWindowResize);
    }
    
    /**
     * Create the title elements
     */
    createTitle() {
        this.title = document.createElement('div');
        this.title.style.position = 'absolute';
        this.title.style.top = '80px';
        this.title.style.textAlign = 'center';
        this.title.style.width = '100%';
        
        // Main title
        const mainTitle = document.createElement('h1');
        mainTitle.textContent = 'KICKTOPIA';
        mainTitle.style.color = 'white';
        mainTitle.style.fontSize = '70px';
        mainTitle.style.fontFamily = 'Arial, sans-serif';
        mainTitle.style.fontWeight = 'bold';
        mainTitle.style.margin = '0 0 5px 0';
        mainTitle.style.textShadow = '0 0 20px rgba(0, 150, 255, 0.8), 0 0 30px rgba(0, 100, 255, 0.5)';
        mainTitle.style.letterSpacing = '6px';
        this.title.appendChild(mainTitle);
        
        // Subtitle with different color
        const challengeText = document.createElement('h2');
        challengeText.textContent = 'THE FOOTBALL GAME';
        challengeText.style.color = '#4CAF50';
        challengeText.style.fontSize = '36px';
        challengeText.style.fontFamily = 'Arial, sans-serif';
        challengeText.style.fontWeight = 'bold';
        challengeText.style.margin = '0';
        challengeText.style.textShadow = '0 0 10px rgba(76, 175, 80, 0.8)';
        challengeText.style.letterSpacing = '4px';
        this.title.appendChild(challengeText);
        
        this.uiContainer.appendChild(this.title);
    }
    
    /**
     * Create the interactive menu
     */
    createInteractiveMenu() {
        // Menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.style.position = 'absolute';
        this.menuContainer.style.bottom = '120px';
        this.menuContainer.style.width = '100%';
        this.menuContainer.style.display = 'flex';
        this.menuContainer.style.justifyContent = 'center';
        this.menuContainer.style.gap = '40px';
        
        // Create play button
        this.playButton = document.createElement('div');
        this.playButton.textContent = 'PLAY';
        this.playButton.style.padding = '15px 40px';
        this.playButton.style.fontSize = '24px';
        this.playButton.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
        this.playButton.style.color = 'white';
        this.playButton.style.border = '2px solid #4CAF50';
        this.playButton.style.borderRadius = '10px';
        this.playButton.style.cursor = 'pointer';
        this.playButton.style.transition = 'all 0.3s ease';
        this.playButton.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.3)';
        this.playButton.style.fontWeight = 'bold';
        this.playButton.style.letterSpacing = '2px';
        
        this.playButton.addEventListener('mouseover', () => {
            this.playButton.style.backgroundColor = 'rgba(76, 175, 80, 0.7)';
            this.playButton.style.boxShadow = '0 0 30px rgba(76, 175, 80, 0.7)';
            this.setSceneState('play');
        });
        
        this.playButton.addEventListener('mouseout', () => {
            this.playButton.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
            this.playButton.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.3)';
            this.setSceneState('idle');
        });
        
        this.playButton.addEventListener('click', () => {
            this.startGameAnimation();
        });
        
        // Create levels button
        this.levelsButton = document.createElement('div');
        this.levelsButton.textContent = 'LEVELS';
        this.levelsButton.style.padding = '15px 40px';
        this.levelsButton.style.fontSize = '24px';
        this.levelsButton.style.backgroundColor = 'rgba(255, 152, 0, 0.3)';
        this.levelsButton.style.color = 'white';
        this.levelsButton.style.border = '2px solid #FF9800';
        this.levelsButton.style.borderRadius = '10px';
        this.levelsButton.style.cursor = 'pointer';
        this.levelsButton.style.transition = 'all 0.3s ease';
        this.levelsButton.style.boxShadow = '0 0 20px rgba(255, 152, 0, 0.3)';
        this.levelsButton.style.fontWeight = 'bold';
        this.levelsButton.style.letterSpacing = '2px';
        
        this.levelsButton.addEventListener('mouseover', () => {
            this.levelsButton.style.backgroundColor = 'rgba(255, 152, 0, 0.7)';
            this.levelsButton.style.boxShadow = '0 0 30px rgba(255, 152, 0, 0.7)';
            this.setSceneState('levels');
        });
        
        this.levelsButton.addEventListener('mouseout', () => {
            this.levelsButton.style.backgroundColor = 'rgba(255, 152, 0, 0.3)';
            this.levelsButton.style.boxShadow = '0 0 20px rgba(255, 152, 0, 0.3)';
            this.setSceneState('idle');
        });
        
        this.levelsButton.addEventListener('click', () => {
            this.showLevelMap();
        });
        
        this.menuContainer.appendChild(this.playButton);
        this.menuContainer.appendChild(this.levelsButton);
        this.uiContainer.appendChild(this.menuContainer);
        
        // Create settings popup (hidden initially)
        this.createSettingsPopup();
    }
    
    /**
     * Create settings popup (hidden initially)
     */
    createSettingsPopup() {
        this.settingsPopup = document.createElement('div');
        this.settingsPopup.id = 'settings-popup';
        this.settingsPopup.style.position = 'fixed';
        this.settingsPopup.style.top = '50%';
        this.settingsPopup.style.left = '50%';
        this.settingsPopup.style.transform = 'translate(-50%, -50%)';
        this.settingsPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.settingsPopup.style.color = 'white';
        this.settingsPopup.style.padding = '30px';
        this.settingsPopup.style.borderRadius = '15px';
        this.settingsPopup.style.zIndex = '10';
        this.settingsPopup.style.textAlign = 'center';
        this.settingsPopup.style.display = 'none';
        this.settingsPopup.style.minWidth = '350px';
        this.settingsPopup.style.border = '2px solid #2196F3';
        this.settingsPopup.style.boxShadow = '0 0 30px rgba(33, 150, 243, 0.5)';
        
        // Settings title
        const settingsTitle = document.createElement('h2');
        settingsTitle.textContent = 'Game Settings';
        settingsTitle.style.color = '#2196F3';
        settingsTitle.style.marginBottom = '25px';
        settingsTitle.style.fontSize = '28px';
        settingsTitle.style.letterSpacing = '2px';
        this.settingsPopup.appendChild(settingsTitle);
        
        // Ball customization section
        const ballCustomSection = document.createElement('div');
        ballCustomSection.style.marginBottom = '20px';
        ballCustomSection.style.textAlign = 'left';
        
        const ballCustomTitle = document.createElement('h3');
        ballCustomTitle.textContent = 'Ball Customization';
        ballCustomTitle.style.color = '#4CAF50';
        ballCustomTitle.style.marginBottom = '15px';
        ballCustomSection.appendChild(ballCustomTitle);
        
        // Ball color options
        const colorOptions = ['Classic', 'Gold', 'Blue', 'Red'];
        colorOptions.forEach(color => {
            const option = document.createElement('div');
            option.style.display = 'inline-block';
            option.style.width = '40px';
            option.style.height = '40px';
            option.style.borderRadius = '50%';
            option.style.margin = '5px';
            option.style.cursor = 'pointer';
            option.style.border = '2px solid white';
            option.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
            
            switch(color) {
                case 'Classic':
                    option.style.background = 'linear-gradient(45deg, white, black)';
                    break;
                case 'Gold':
                    option.style.backgroundColor = '#FFD700';
                    break;
                case 'Blue':
                    option.style.backgroundColor = '#1E90FF';
                    break;
                case 'Red':
                    option.style.backgroundColor = '#FF4136';
                    break;
            }
            
            ballCustomSection.appendChild(option);
        });
        
        this.settingsPopup.appendChild(ballCustomSection);
        
        // Sound toggle
        const soundToggleLabel = document.createElement('label');
        soundToggleLabel.style.display = 'block';
        soundToggleLabel.style.marginBottom = '20px';
        soundToggleLabel.style.fontSize = '18px';
        soundToggleLabel.style.textAlign = 'left';
        
        const soundToggle = document.createElement('input');
        soundToggle.type = 'checkbox';
        soundToggle.id = 'sound-toggle';
        soundToggle.checked = true;
        soundToggle.style.marginRight = '10px';
        soundToggle.style.width = '18px';
        soundToggle.style.height = '18px';
        
        soundToggleLabel.appendChild(soundToggle);
        soundToggleLabel.appendChild(document.createTextNode('Enable Sound Effects'));
        this.settingsPopup.appendChild(soundToggleLabel);
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'SAVE & CLOSE';
        closeButton.style.padding = '12px 24px';
        closeButton.style.backgroundColor = '#4CAF50';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '18px';
        closeButton.style.marginTop = '20px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.letterSpacing = '1px';
        closeButton.addEventListener('click', () => this.hideSettings());
        this.settingsPopup.appendChild(closeButton);
        
        document.body.appendChild(this.settingsPopup);
    }
    
    /**
     * Create dramatic lighting
     */
    createDramaticLighting() {
        // Add ambient light (brighter)
        const ambientLight = new THREE.AmbientLight(0x444444, 0.6);
        this.scene.add(ambientLight);
        
        // Main spotlight focused on the ball (brighter)
        const mainSpotlight = new THREE.SpotLight(0xffffff, 2.2);
        mainSpotlight.position.set(0, 10, 5);
        mainSpotlight.angle = 0.35;
        mainSpotlight.penumbra = 0.2;
        mainSpotlight.decay = 1;
        mainSpotlight.distance = 30;
        mainSpotlight.castShadow = true;
        mainSpotlight.shadow.mapSize.width = 1024;
        mainSpotlight.shadow.mapSize.height = 1024;
        mainSpotlight.shadow.bias = -0.0001;
        this.scene.add(mainSpotlight);
        this.spotlights.push(mainSpotlight);
        
        // Add a specific light for the ball
        const ballLight = new THREE.PointLight(0xffffff, 1.0, 10);
        ballLight.position.set(0, 5, 2);
        this.scene.add(ballLight);
        
        // Create rotating accent lights
        const colors = [0x4CAF50, 0x2196F3, 0xFFEB3B];
        
        colors.forEach((color, index) => {
            const spotLight = new THREE.SpotLight(color, 1.0);
            const angle = (index / colors.length) * Math.PI * 2;
            const radius = 8;
            
            spotLight.position.set(
                Math.cos(angle) * radius,
                5,
                Math.sin(angle) * radius
            );
            spotLight.angle = 0.2;
            spotLight.penumbra = 0.6;
            spotLight.decay = 1;
            spotLight.distance = 25;
            
            // Store initial position for animation
            spotLight.userData = { 
                initialAngle: angle,
                radius: radius,
                speed: 0.2 + Math.random() * 0.2
            };
            
            this.scene.add(spotLight);
            this.spotlights.push(spotLight);
        });
        
        // Add directional light for overall illumination (brighter)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
    }
    
    /**
     * Create podium for the ball
     */
    createPodium() {
        // Create podium group
        this.podium = new THREE.Group();
        
        // Main podium
        const podiumGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 32);
        const podiumMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E5799, // Deep blue color that matches the sky theme
            metalness: 0.6,
            roughness: 0.3
        });
        const podiumMesh = new THREE.Mesh(podiumGeometry, podiumMaterial);
        podiumMesh.position.y = 0.5;
        podiumMesh.receiveShadow = true;
        podiumMesh.castShadow = true;
        this.podium.add(podiumMesh);
        
        // Top platform
        const platformGeometry = new THREE.CylinderGeometry(1.5, 2, 0.2, 32);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50, // Match the green accent color used elsewhere
            metalness: 0.5,
            roughness: 0.2
        });
        const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformMesh.position.y = 1.1;
        platformMesh.receiveShadow = true;
        platformMesh.castShadow = true;
        this.podium.add(platformMesh);
        
        // Add glow effect
        const glowGeometry = new THREE.RingGeometry(1.5, 2.5, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4CAF50,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7 // Increased opacity for more visibility
        });
        this.glowRing = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowRing.rotation.x = -Math.PI / 2;
        this.glowRing.position.y = 1.15;
        this.podium.add(this.glowRing);
        
        // Create light beam coming from podium to ball
        this.createLightBeam();
        
        // Add to scene
        this.scene.add(this.podium);
        
        // Create grass floor texture using canvas
        const grassCanvas = document.createElement('canvas');
        grassCanvas.width = 512;
        grassCanvas.height = 512;
        const ctx = grassCanvas.getContext('2d');
        
        // Create base green
        ctx.fillStyle = '#1a8022';
        ctx.fillRect(0, 0, grassCanvas.width, grassCanvas.height);
        
        // Add grass texture details
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * grassCanvas.width;
            const y = Math.random() * grassCanvas.height;
            const width = Math.random() * 4 + 1;
            const height = Math.random() * 6 + 3;
            
            // Vary the green colors
            const colorVariation = Math.random() * 30 - 15;
            const r = Math.max(0, Math.min(255, 26 + colorVariation));
            const g = Math.max(0, Math.min(255, 128 + colorVariation));
            const b = Math.max(0, Math.min(255, 34 + colorVariation));
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, width, height);
        }
        
        // Create floor with texture
        const floorGeometry = new THREE.CircleGeometry(10, 32);
        const grassTexture = new THREE.CanvasTexture(grassCanvas);
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(4, 4);
        
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            map: grassTexture,
            color: 0xffffff, // White to not affect texture colors
            roughness: 0.9,
            metalness: 0.0
        });
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
    
    /**
     * Create a light beam effect from the podium to the ball
     */
    createLightBeam() {
        // Create a cylindrical beam of light
        const beamGeometry = new THREE.CylinderGeometry(0.5, 0.2, 1.5, 16, 1, true);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.lightBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        this.lightBeam.position.y = 1.85; // Position between podium and ball
        this.lightBeam.rotation.x = Math.PI; // Flip to make wider part at the top
        this.podium.add(this.lightBeam);
        
        // Add light particles within the beam
        this.lightParticles = new THREE.Group();
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3 + Math.random() * 0.4,
                blending: THREE.AdditiveBlending
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position within the beam
            const radius = Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * 1.5;
            
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = 1.1 + height;
            
            // Store original y position for animation
            particle.userData = {
                originalY: particle.position.y,
                speed: 0.01 + Math.random() * 0.03
            };
            
            this.lightParticles.add(particle);
        }
        
        this.podium.add(this.lightParticles);
        
        // Add spotlight from below to create beam effect
        const beamLight = new THREE.SpotLight(0xffffff, 2.5, 10, Math.PI / 6, 0.5, 1);
        beamLight.position.set(0, 1.2, 0);
        beamLight.target.position.set(0, 3, 0);
        this.podium.add(beamLight);
        this.podium.add(beamLight.target);
        
        // Add an inner glow ring at the top of the podium
        const innerGlowGeometry = new THREE.RingGeometry(0.8, 1.4, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.innerGlowRing = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.innerGlowRing.rotation.x = -Math.PI / 2;
        this.innerGlowRing.position.y = 1.16;
        this.podium.add(this.innerGlowRing);
    }
} 