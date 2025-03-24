import * as THREE from 'three';

export default class BallView {
    constructor(scene) {
        this.scene = scene;
        this.radius = 0.5;
        this.mesh = this.createBallMesh();
        scene.add(this.mesh);
        
        // Particle system for collision effects
        this.particleSystem = this.createParticleSystem();
        scene.add(this.particleSystem);
    }
    
    createBallMesh() {
        const segments = 32;
        const ballGeometry = new THREE.SphereGeometry(this.radius, segments, segments);
        const ballTexture = this.createSoccerBallTexture();
        const ballMaterial = new THREE.MeshStandardMaterial({ 
            map: ballTexture,
            roughness: 0.5,
            metalness: 0.1
        });
        
        const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        ballMesh.castShadow = true;
        ballMesh.receiveShadow = true;
        
        return ballMesh;
    }
    
    createSoccerBallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Fill background white
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw pentagons and hexagons
        const drawPentagon = (x, y, size, fill = true, stroke = false) => {
            context.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                const px = x + size * Math.cos(angle);
                const py = y + size * Math.sin(angle);
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
                context.lineWidth = size / 10;
                context.stroke();
            }
        };
        
        const drawHexagon = (x, y, size, fill = false, stroke = true) => {
            context.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 2 * Math.PI / 6);
                const px = x + size * Math.cos(angle);
                const py = y + size * Math.sin(angle);
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
                context.lineWidth = size / 10;
                context.stroke();
            }
        };
        
        // Draw the ball pattern
        // Central pentagon
        drawPentagon(canvas.width / 2, canvas.height / 2, 100);
        
        // Surrounding hexagons
        const hexPoints = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const x = canvas.width / 2 + 200 * Math.cos(angle);
            const y = canvas.height / 2 + 200 * Math.sin(angle);
            hexPoints.push({ x, y });
            drawHexagon(x, y, 100);
        }
        
        // Connecting lines
        const drawConnector = (x1, y1, x2, y2) => {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.strokeStyle = 'black';
            context.lineWidth = 10;
            context.stroke();
        };
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createParticleSystem() {
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        // Initialize all particles as inactive (off-screen)
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = 0;
            particlePositions[i * 3 + 1] = -1000; // Off-screen
            particlePositions[i * 3 + 2] = 0;
            particleSizes[i] = 0;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        // Particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        particleSystem.userData.particlesData = [];
        
        // Initialize particle data
        for (let i = 0; i < particleCount; i++) {
            particleSystem.userData.particlesData.push({
                active: false,
                velocity: new THREE.Vector3(0, 0, 0),
                lifespan: 0
            });
        }
        
        return particleSystem;
    }
    
    createCollisionEffect(position, normal, particleCount = 5) {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        const particlesData = this.particleSystem.userData.particlesData;
        
        // Find available particles
        let count = 0;
        for (let i = 0; i < particlesData.length && count < particleCount; i++) {
            if (!particlesData[i].active) {
                // Activate this particle
                particlesData[i].active = true;
                particlesData[i].lifespan = 1.0; // Full lifespan
                
                // Position particle at collision point
                positions[i * 3] = position.x;
                positions[i * 3 + 1] = position.y;
                positions[i * 3 + 2] = position.z;
                
                // Set particle size
                sizes[i] = 0.2 + Math.random() * 0.2;
                
                // Calculate velocity (bounce off surface)
                const speed = 2 + Math.random() * 3;
                particlesData[i].velocity.set(
                    normal.x * speed * (0.5 + Math.random()),
                    normal.y * speed * (0.5 + Math.random()),
                    normal.z * speed * (0.5 + Math.random())
                );
                
                count++;
            }
        }
        
        // Mark attributes as needing update
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
    }
    
    updateParticles(deltaTime) {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        const particlesData = this.particleSystem.userData.particlesData;
        
        let updateNeeded = false;
        
        for (let i = 0; i < particlesData.length; i++) {
            if (particlesData[i].active) {
                // Update position
                positions[i * 3] += particlesData[i].velocity.x * deltaTime;
                positions[i * 3 + 1] += particlesData[i].velocity.y * deltaTime;
                positions[i * 3 + 2] += particlesData[i].velocity.z * deltaTime;
                
                // Apply gravity
                particlesData[i].velocity.y -= 9.8 * deltaTime;
                
                // Reduce lifespan
                particlesData[i].lifespan -= deltaTime * 2;
                
                // Shrink particle as it ages
                sizes[i] = 0.4 * particlesData[i].lifespan;
                
                // Deactivate if lifespan is over
                if (particlesData[i].lifespan <= 0) {
                    particlesData[i].active = false;
                    positions[i * 3 + 1] = -1000; // Move off-screen
                    sizes[i] = 0;
                }
                
                updateNeeded = true;
            }
        }
        
        if (updateNeeded) {
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
            this.particleSystem.geometry.attributes.size.needsUpdate = true;
        }
    }
    
    update(position, rotation) {
        // Update ball mesh position and rotation
        this.mesh.position.set(position.x, position.y, position.z);
        this.mesh.rotation.x += rotation.x;
        this.mesh.rotation.y += rotation.y;
        this.mesh.rotation.z += rotation.z;
    }
} 
