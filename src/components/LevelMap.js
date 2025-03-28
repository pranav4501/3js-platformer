/**
 * Represents a level map for selecting game levels
 */
export default class LevelMap {
    constructor(startGameCallback) {
        this.startGameCallback = startGameCallback;
        this.container = null;
        this.levels = [
            { id: 1, name: "Beginner's Kick", unlocked: true },
            { id: 2, name: "Curve Challenge", unlocked: false },
            { id: 3, name: "Obstacle Course", unlocked: false },
            { id: 4, name: "Wind Tunnel", unlocked: false },
            { id: 5, name: "Pro League", unlocked: false }
        ];
        
        this.init();
    }
    
    /**
     * Initialize the level map
     */
    init() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'level-map-container';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.display = 'none';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);
        
        // Create map content
        this.createMapContent();
    }
    
    /**
     * Create the map content with levels in a chain format
     */
    createMapContent() {
        // Create inner container for map
        const mapInner = document.createElement('div');
        mapInner.style.position = 'relative';
        mapInner.style.width = '80%';
        mapInner.style.maxWidth = '800px';
        mapInner.style.height = '500px';
        mapInner.style.backgroundColor = 'rgba(20, 60, 120, 0.7)';
        mapInner.style.borderRadius = '20px';
        mapInner.style.padding = '30px';
        mapInner.style.boxShadow = '0 0 30px rgba(0, 150, 255, 0.5)';
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'LEVEL SELECT';
        title.style.color = 'white';
        title.style.textAlign = 'center';
        title.style.marginBottom = '40px';
        title.style.fontSize = '36px';
        title.style.fontWeight = 'bold';
        title.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        title.style.letterSpacing = '3px';
        mapInner.appendChild(title);
        
        // Level path container
        const pathContainer = document.createElement('div');
        pathContainer.style.position = 'relative';
        pathContainer.style.width = '100%';
        pathContainer.style.height = '300px';
        pathContainer.style.display = 'flex';
        pathContainer.style.justifyContent = 'space-between';
        pathContainer.style.alignItems = 'center';
        mapInner.appendChild(pathContainer);
        
        // Create the connecting path
        const path = document.createElement('div');
        path.style.position = 'absolute';
        path.style.top = '50%';
        path.style.left = '10%';
        path.style.width = '80%';
        path.style.height = '8px';
        path.style.backgroundColor = '#FF9800';
        path.style.zIndex = '1';
        path.style.borderRadius = '4px';
        pathContainer.appendChild(path);
        
        // Create level nodes
        this.levels.forEach((level, index) => {
            const nodeContainer = document.createElement('div');
            nodeContainer.style.position = 'relative';
            nodeContainer.style.zIndex = '2';
            nodeContainer.style.display = 'flex';
            nodeContainer.style.flexDirection = 'column';
            nodeContainer.style.alignItems = 'center';
            nodeContainer.style.width = '100px';
            
            // Create level node
            const node = document.createElement('div');
            node.style.width = '80px';
            node.style.height = '80px';
            node.style.borderRadius = '50%';
            node.style.display = 'flex';
            node.style.justifyContent = 'center';
            node.style.alignItems = 'center';
            node.style.fontSize = '36px';
            node.style.fontWeight = 'bold';
            node.style.marginBottom = '15px';
            node.style.cursor = level.unlocked ? 'pointer' : 'not-allowed';
            node.style.transition = 'all 0.3s ease';
            node.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
            
            // Set the background based on unlock status
            if (level.unlocked) {
                node.style.backgroundColor = '#4CAF50';
                node.style.color = 'white';
                node.style.border = '3px solid white';
                
                // Add hover effect for unlocked levels
                node.addEventListener('mouseover', () => {
                    node.style.transform = 'scale(1.1)';
                    node.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.6)';
                });
                
                node.addEventListener('mouseout', () => {
                    node.style.transform = 'scale(1)';
                    node.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
                });
                
                // Add click event for unlocked levels
                node.addEventListener('click', () => {
                    this.selectLevel(level.id);
                });
            } else {
                node.style.backgroundColor = '#555555';
                node.style.color = '#888888';
                node.style.border = '3px solid #777777';
                
                // Add lock icon for locked levels
                const lockIcon = document.createElement('span');
                lockIcon.innerHTML = '🔒';
                lockIcon.style.fontSize = '24px';
                node.appendChild(lockIcon);
            }
            
            // Add level number to node
            if (level.unlocked) {
                node.textContent = level.id;
            }
            
            // Level name
            const levelName = document.createElement('div');
            levelName.textContent = level.name;
            levelName.style.color = 'white';
            levelName.style.fontSize = '16px';
            levelName.style.textAlign = 'center';
            levelName.style.maxWidth = '120px';
            levelName.style.fontWeight = level.unlocked ? 'bold' : 'normal';
            levelName.style.opacity = level.unlocked ? '1' : '0.7';
            
            nodeContainer.appendChild(node);
            nodeContainer.appendChild(levelName);
            pathContainer.appendChild(nodeContainer);
        });
        
        // Create back button
        const backButton = document.createElement('button');
        backButton.textContent = 'BACK';
        backButton.style.position = 'absolute';
        backButton.style.bottom = '30px';
        backButton.style.right = '30px';
        backButton.style.padding = '12px 24px';
        backButton.style.backgroundColor = '#FF5722';
        backButton.style.color = 'white';
        backButton.style.border = 'none';
        backButton.style.borderRadius = '5px';
        backButton.style.cursor = 'pointer';
        backButton.style.fontSize = '18px';
        backButton.style.fontWeight = 'bold';
        backButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        
        backButton.addEventListener('click', () => {
            this.hide();
        });
        
        mapInner.appendChild(backButton);
        this.container.appendChild(mapInner);
    }
    
    /**
     * Select a level to play
     */
    selectLevel(levelId) {
        // Hide the level map
        this.hide();
        
        // Call the start game callback with the selected level
        if (this.startGameCallback) {
            // The actual level selection would be implemented in the game
            this.startGameCallback();
        }
    }
    
    /**
     * Show the level map
     */
    show() {
        this.container.style.display = 'flex';
    }
    
    /**
     * Hide the level map
     */
    hide() {
        this.container.style.display = 'none';
    }
} 