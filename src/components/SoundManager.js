import * as THREE from 'three';

/**
 * Manages all sound effects for the game
 */
export default class SoundManager {
    constructor(camera) {
        // Create audio listener attached to the camera
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        
        // Track loaded sounds
        this.sounds = {};
        
        // Track background music
        this.backgroundMusic = null;
        
        // Track if sounds have been attempted to load
        this.soundsAttempted = false;
        
        // Set master volume (0-1)
        this.masterVolume = 0.7;
        
        // Track mute state
        this.muted = false;
        
        // Create mute/unmute button
        this.createSoundToggle();
        
        // Preload all sounds
        this.loadSounds();
    }
    
    /**
     * Load all game sound effects
     */
    loadSounds() {
        this.soundsAttempted = true;
        
        // Ball sounds
        this.loadSound('bounce', 'bounce.mp3');
        this.loadSound('kick', 'kick.mp3');
        this.loadSound('roll', 'ball_roll.mp3', true); // Looping sound
        
        // Game events
        this.loadSound('goal', 'goal.mp3');
        this.loadSound('whistle', 'whistle.mp3');
        this.loadSound('collision', 'player_collision.mp3');
        this.loadSound('wind', 'wind.mp3', true); // Looping sound
        
        // UI sounds
        this.loadSound('button', 'button_click.mp3');
        this.loadSound('jump', 'jump.mp3');
        
        // Background music (loaded separately to control independently)
        this.loadBackgroundMusic('background', 'game_music1.mp3');
        
        // Display help message if needed
        setTimeout(() => this.checkSoundsLoaded(), 3000);
    }
    
    /**
     * Check if sounds were loaded successfully and show help if not
     */
    checkSoundsLoaded() {
        const loadedSounds = Object.values(this.sounds).filter(sound => sound.buffer).length;
        if (loadedSounds === 0 && this.soundsAttempted) {
            console.warn('No sound files were loaded successfully. Check public/sounds/README.html for help.');
            this.showSoundHelpMessage();
        }
    }
    
    /**
     * Show a help message for missing sound files
     */
    showSoundHelpMessage() {
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.bottom = '70px';
        message.style.right = '10px';
        message.style.backgroundColor = 'rgba(0,0,0,0.7)';
        message.style.color = 'white';
        message.style.padding = '10px';
        message.style.borderRadius = '5px';
        message.style.fontFamily = 'Arial, sans-serif';
        message.style.fontSize = '14px';
        message.style.zIndex = '1000';
        message.innerHTML = 'Sound files not found. <a href="/sounds/README.html" target="_blank" style="color:#4fc3f7;">Click for help</a>';
        
        document.body.appendChild(message);
        
        // Remove after 10 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 10000);
    }
    
    /**
     * Load a single sound effect
     */
    loadSound(name, file, loop = false) {
        // Create empty sound first as fallback
        const sound = new THREE.Audio(this.listener);
        this.sounds[name] = sound;
        
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(
            `/sounds/${file}`,
            (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(loop);
                sound.setVolume(this.masterVolume);
                console.log(`Loaded sound: ${name}`);
            },
            (xhr) => {
                // Loading progress if needed
            },
            (error) => {
                console.warn(`Failed to load sound: ${name}`, error);
                // Sound will remain as empty buffer
                this.createEmptySound(sound, loop);
            }
        );
        
        return sound;
    }
    
    /**
     * Create an empty sound as fallback when files can't be loaded
     */
    createEmptySound(sound, loop = false) {
        try {
            // Create a silent buffer
            const audioContext = this.listener.context;
            const sampleRate = audioContext.sampleRate;
            const buffer = audioContext.createBuffer(1, sampleRate * 0.5, sampleRate);
            
            // Fill with silence
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < channelData.length; i++) {
                channelData[i] = 0; // Silence
            }
            
            sound.setBuffer(buffer);
            sound.setLoop(loop);
            return sound;
        } catch (error) {
            console.warn('Failed to create empty sound', error);
            return sound;
        }
    }
    
    /**
     * Load background music
     */
    loadBackgroundMusic(name, file) {
        const music = new THREE.Audio(this.listener);
        
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(
            `/sounds/${file}`,
            (buffer) => {
                music.setBuffer(buffer);
                music.setLoop(true);
                music.setVolume(this.masterVolume * 0.7); // Lower volume for background music
                this.backgroundMusic = music;
                console.log('Background music loaded');
                
                // Auto-play background music
                this.playBackgroundMusic();
            },
            (xhr) => {
                // Loading progress if needed
            },
            (error) => {
                console.warn('Failed to load background music', error);
                this.backgroundMusic = music;
                this.createEmptySound(music, true);
            }
        );
    }
    
    /**
     * Create sound toggle button
     */
    createSoundToggle() {
        this.soundToggle = document.createElement('button');
        this.soundToggle.innerText = '🔊';
        this.soundToggle.style.position = 'fixed';
        this.soundToggle.style.bottom = '10px';
        this.soundToggle.style.right = '10px';
        this.soundToggle.style.width = '50px';
        this.soundToggle.style.height = '50px';
        this.soundToggle.style.borderRadius = '50%';
        this.soundToggle.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        this.soundToggle.style.border = 'none';
        this.soundToggle.style.fontSize = '24px';
        this.soundToggle.style.cursor = 'pointer';
        this.soundToggle.style.zIndex = '1000';
        
        this.soundToggle.addEventListener('click', () => {
            this.toggleMute();
        });
        
        document.body.appendChild(this.soundToggle);
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        this.soundToggle.innerText = this.muted ? '🔇' : '🔊';
        
        if (this.muted) {
            // Stop all currently playing sounds
            Object.values(this.sounds).forEach(sound => {
                if (sound.isPlaying) {
                    sound.pause();
                }
            });
            
            // Pause background music
            this.pauseBackgroundMusic();
        } else {
            // Resume background music
            this.playBackgroundMusic();
        }
    }
    
    /**
     * Play a sound effect
     */
    play(name, volume = 1.0) {
        if (this.muted) return false;
        
        const sound = this.sounds[name];
        if (sound && sound.buffer && !sound.isPlaying) {
            sound.setVolume(this.masterVolume * volume);
            sound.play();
            return true;
        }
        return false;
    }
    
    /**
     * Play a sound effect with distance attenuation
     */
    playAt(name, position, volume = 1.0, maxDistance = 20) {
        if (this.muted) return null;
        
        // For positional audio, create a new instance each time
        if (this.sounds[name] && this.sounds[name].buffer) {
            const positionalSound = new THREE.PositionalAudio(this.listener);
            positionalSound.setBuffer(this.sounds[name].buffer);
            positionalSound.setRefDistance(5);
            positionalSound.setMaxDistance(maxDistance);
            positionalSound.setVolume(this.masterVolume * volume);
            positionalSound.position.copy(position);
            
            // Add to scene temporarily
            this.listener.parent.add(positionalSound);
            positionalSound.play();
            
            // Remove after sound finishes playing
            setTimeout(() => {
                if (positionalSound.parent) {
                    positionalSound.parent.remove(positionalSound);
                }
            }, positionalSound.buffer.duration * 1000);
            
            return positionalSound;
        }
        return null;
    }
    
    /**
     * Stop a currently playing sound
     */
    stop(name) {
        const sound = this.sounds[name];
        if (sound && sound.isPlaying) {
            sound.stop();
            return true;
        }
        return false;
    }
    
    /**
     * Play background music
     */
    playBackgroundMusic() {
        if (!this.muted && this.backgroundMusic && this.backgroundMusic.buffer && !this.backgroundMusic.isPlaying) {
            this.backgroundMusic.play();
        }
    }
    
    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.pause();
        }
    }
    
    /**
     * Stop all currently playing sounds
     */
    stopAllSounds() {
        // Stop all sound effects
        Object.values(this.sounds).forEach(sound => {
            if (sound && sound.isPlaying) {
                sound.stop();
            }
        });
        
        // Note: This doesn't stop background music
        // Use pauseBackgroundMusic() for that if needed
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        // Stop all sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
        
        // Stop background music
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }
        
        // Remove sound toggle button
        if (this.soundToggle && this.soundToggle.parentNode) {
            this.soundToggle.parentNode.removeChild(this.soundToggle);
        }
        
        // Remove audio listener
        if (this.listener && this.listener.parent) {
            this.listener.parent.remove(this.listener);
        }
    }
} 