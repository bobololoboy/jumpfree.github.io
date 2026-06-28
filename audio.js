import { AudioEffectsManager } from './audioEffects.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null; // For BGM volume control
        this.sounds = {};
        this.activeLoops = {}; // To manage looping sounds
        this.isInitialized = false;
        this.isLoading = false;
        this.allSoundsLoaded = false; // new flag

        this.effectsManager = null;

        // Slow-mo chain
        this.slowMoActive = false;
        this.filterNode = null;

        // Visualizer
        this.analyser = null;
        this.analyserBuffer = null;

        // If BGM is requested before init/gesture unlock, store it here
        this.requestedBGM = null;

        // NEW: remember desired retro FX state even before audio is initialized
        this.retroDesired = false;

        this._boundUnlock = this._unlockAudioContext.bind(this);
        this._unlockAttached = false;

        this.soundFiles = [
            'jump.mp3',
            'jump_pad.mp3', // NEW
            'double_jump.mp3',
            'collect_powerup.mp3',
            'player_die.mp3',
            'button_click.mp3',
            'land.mp3',
            'fly_hover.mp3',
            'Happy Pixelated Beat - Faster.mp3',
            'Speedy Pixelated Beat.mp3',
            'Super Playful Goofy Bread Beat.mp3',
            'Goofy Bread Trap Remix.mp3',
            'Boss Rush_ Ramp-Up Battle.mp3',
            'OH YEAH - Glitchy Chopped Remix.mp3',
            'Pixel Glitch Groove.mp3',
            'I See YOU (Glitch Club Mix).mp3',
            'Dreamcore Angelic Instrumental.mp3',
            'READY OR NOT - c00lkidd Chase Theme _ Forsaken OST.mp3',
            'Exclusive preview track from my new Solo Album.mp3',
            'Pixel Runner Ambient Loop.mp3',
            'THIS IS AMERIUSA (Explosion Drop).mp3',
            // --- New songs ---
            "Where's My Burrito, Dude_.mp3",
            'verycoolsong.mp3',
            'Glitch Drive (Instrumental).mp3',
            // --- Added song ---
            '58. Hammer of Justice (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3',
            '30. Black Knife (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3',
            // --- Newly added tracks ---
            'Server Down.mp3',
            'Jumpline, Chill Until Rage.mp3',
            'Happy 3771 Views.mp3',
            'Cubey Song (Joke Version).mp3',
            'sparkle.mp3'
        ];
        this.loadedSoundFiles = new Set();
    }

    async init(onProgress, filesToLoad = null) {
        if (this.isInitialized || this.isLoading) return;
        this.isLoading = true;

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();

            this.effectsManager = new AudioEffectsManager(this.audioContext, this.masterGain);

            this.musicGain.connect(this.masterGain);
            this.effectsManager.wireChain();
            
            // Default gains (will be immediately overridden by saved settings if present)
            this.masterGain.gain.value = 1;
            this.musicGain.gain.value = 1;

            // Apply any saved user volume settings right after the nodes exist
            this._applySavedVolumes();

            // NEW: if retro FX was requested before init, enable it now
            if (this.retroDesired) {
                try { await this.effectsManager.enableRetroFX(); } catch {}
                this.effectsManager.wireChain();
            }

            // NEW: if bass boost FX was requested before init, enable it now
            if (this.bassBoostDesired) {
                try { await this.effectsManager.enableBassBoostFX(); } catch {}
                this.effectsManager.wireChain();
            }
        }

        this._attachUnlockListeners();

        if (this.audioContext.state === 'suspended') {
            try { await this.audioContext.resume(); } catch {}
        }
        
        const files = filesToLoad || this.soundFiles;
        const loadPromises = files.map(file => this.loadSound(file, onProgress));
        await Promise.all(loadPromises);

        this.isInitialized = true;
        this.isLoading = false;

        // Don't mark all sounds loaded if we only did a partial load
        if (filesToLoad === null || files.length === this.soundFiles.length) {
            this.allSoundsLoaded = true;
        }
    }

    async loadRemainingSoundsInBackground(onProgress) {
        if (this.allSoundsLoaded) return;

        // Wait for audio context to be created by user interaction if it hasn't been already.
        while (!this.audioContext) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const remainingFiles = this.soundFiles.filter(file => !this.loadedSoundFiles.has(file));
        if (remainingFiles.length === 0) {
            this.allSoundsLoaded = true;
            return;
        }
        
        console.log('Loading remaining sounds in background:', remainingFiles);
        const loadPromises = remainingFiles.map(file => this.loadSound(file, onProgress));
        await Promise.all(loadPromises);
        
        this.allSoundsLoaded = true;
        console.log('All sounds loaded.');
    }

    _attachUnlockListeners() {
        if (this._unlockAttached) return;
        this._unlockAttached = true;
        const opts = { once: true, passive: true, capture: true };
        window.addEventListener('pointerdown', this._boundUnlock, opts);
        window.addEventListener('touchstart', this._boundUnlock, opts);
        window.addEventListener('mousedown', this._boundUnlock, opts);
        window.addEventListener('keydown', this._boundUnlock, opts);
    }

    async unlock() {
        if (!this.audioContext) return;
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch {}
        // Re-apply saved volumes after any resume/unlock to ensure consistency
        this._applySavedVolumes();
        // Once unlocked, wire chain and start any pending BGM
        this.effectsManager.wireChain();

        // NEW: ensure retro FX applies immediately after unlock if desired
        if (this.retroDesired && this.effectsManager && !this.effectsManager.retroEnabled) {
            try { await this.effectsManager.enableRetroFX(); } catch {}
            this.effectsManager.wireChain();
        }

        // NEW: ensure bass boost FX applies immediately after unlock if desired
        if (this.bassBoostDesired && this.effectsManager && !this.effectsManager.bassBoostEnabled) {
            try { await this.effectsManager.enableBassBoostFX(); } catch {}
            this.effectsManager.wireChain();
        }

        if (this.requestedBGM) {
            this._safePlayLoop(this.requestedBGM, 'music');
        }
    }

    async _unlockAudioContext() {
        // This is now just a wrapper for the new unlock() method
        this.unlock();
    }

    async enableRetroFX() {
        // NEW: remember intention even if audio isn't initialized yet
        this.retroDesired = true;
        if (this.effectsManager) {
            await this.effectsManager.enableRetroFX();
            this.effectsManager.wireChain();
        }
    }

    async enableSuperRetroFX() {
        this.retroDesired = true;
        if (this.effectsManager) {
            await this.effectsManager.enableSuperRetroFX();
            this.effectsManager.wireChain();
        }
    }

    disableRetroFX() {
        // NEW: clear desired state and disable immediately if possible
        this.retroDesired = false;
        if (this.effectsManager) {
            this.effectsManager.disableRetroFX();
            this.effectsManager.wireChain();
        }
    }

    async enableBassBoostFX() {
        this.bassBoostDesired = true;
        if (this.effectsManager) {
            await this.effectsManager.enableBassBoostFX();
            this.effectsManager.wireChain();
        }
    }

    disableBassBoostFX() {
        this.bassBoostDesired = false;
        if (this.effectsManager) {
            this.effectsManager.disableBassBoostFX();
            this.effectsManager.wireChain();
        }
    }

    async loadSound(url, onProgress) {
        if (this.loadedSoundFiles.has(url)) return; // Don't load twice
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            const name = url.replace(/\.(mp3|wav|ogg)$/, '');
            this.sounds[name] = audioBuffer;
            this.loadedSoundFiles.add(url);
            if (onProgress) onProgress(url);
            console.log(`Loaded sound: ${name}`); // Debug log
        } catch (error) {
            console.error(`Error loading sound: ${url}`, error);
        }
    }

    play(name) {
        if (!this.isInitialized || !this.sounds[name]) {
            console.warn(`Sound "${name}" not found or not loaded yet.`);
            return;
        }

        // On some browsers, the context might be suspended if created before user interaction.
        if (this.audioContext.state === 'suspended') {
            // Queue a resume on user gesture and play once unlocked
            this._attachUnlockListeners();
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.masterGain);
        source.start(0);
    }

    async playBGM(name) {
        console.log(`Requesting BGM: ${name}`); // Debug log
        
        // Remember the desired BGM no matter what
        this.requestedBGM = name;

        // Stop any other BGM first
        this.stopBGM();

        // If the sound isn't loaded yet, load it now
        const soundFile = `${name}.mp3`;
        if (!this.sounds[name] && this.soundFiles.includes(soundFile)) {
            console.log(`BGM "${name}" not loaded, loading now...`);
            await this.loadSound(soundFile);
            console.log(`BGM "${name}" loaded.`);
        }

        // Try to play now; if not ready, gesture unlock will handle it
        this._safePlayLoop(name, 'music');
    }

    _safePlayLoop(name, loopType = 'sfx') {
        console.log(`Attempting to play loop: ${name}, type: ${loopType}`); // Debug log
        console.log(`Sound exists: ${!!this.sounds[name]}`); // Debug log
        console.log(`Initialized: ${this.isInitialized}`); // Debug log
        console.log(`Audio context state: ${this.audioContext?.state}`); // Debug log
        
        // If not initialized or the buffer is not loaded yet, bail but keep requestedBGM set
        if (!this.isInitialized || !this.sounds[name]) {
            if (loopType === 'music') this.requestedBGM = name;
            console.warn(`Cannot play loop "${name}", sound not loaded or audio not initialized.`);
            this._attachUnlockListeners();
            return;
        }
        if (this.audioContext.state === 'suspended') {
            if (loopType === 'music') this.requestedBGM = name;
            // Wait for user gesture to resume
            this._attachUnlockListeners();
            return;
        }
        this.playLoop(name, loopType);
    }

    stopBGM(fadeOutDuration = 0.8) {
        for (const name in this.activeLoops) {
            if (this.activeLoops[name].type === 'music') {
                this.stopLoop(name, fadeOutDuration);
            }
        }
    }

    playLoop(name, loopType = 'sfx') {
        console.log(`Playing loop: ${name}`); // Debug log
        if (!this.isInitialized || !this.sounds[name] || this.activeLoops[name]) return;
        
        if (this.audioContext.state === 'suspended') {
            this._attachUnlockListeners();
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.loop = true;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);

        const parentGain = loopType === 'music' ? this.musicGain : this.masterGain;
        gainNode.connect(parentGain);

        // Also route music to analyser (parallel tap)
        if (loopType === 'music' && this.analyser) {
            try { this.musicGain.connect(this.analyser); } catch {}
        }

        source.connect(gainNode);
        source.start(0);

        // Set the playback rate for new loops based on current effect state
        if (this.effectsManager) {
            source.playbackRate.setValueAtTime(this.effectsManager.currentPlaybackRate, this.audioContext.currentTime);
        }
        
        this.activeLoops[name] = { source, gainNode, type: loopType };
        console.log(`Successfully started loop: ${name}`); // Debug log
    }

    stopLoop(name, fadeOutDuration = 0.5) {
        const loop = this.activeLoops[name];
        if (!loop) return;

        const { source, gainNode } = loop;
        const now = this.audioContext.currentTime;

        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now); // Set current value to start ramp from
        gainNode.gain.linearRampToValueAtTime(0, now + fadeOutDuration);
        
        source.stop(now + fadeOutDuration);

        delete this.activeLoops[name];
    }
    
    stopAllLoops(fadeOutDuration = 0.5) {
        for (const name in this.activeLoops) {
            this.stopLoop(name, fadeOutDuration);
        }
    }

    setVolume(value) {
        if (this.masterGain) {
            const v = Math.max(0, Math.min(1, parseFloat(value)));
            // Map slider (linear) to audio gain (logarithmic) for finer control near silence.
            // -60 dB (near silence) to 0 dB (full)
            const dB = v === 0 ? -Infinity : (-60 + (60 * Math.pow(v, 1.8)));
            const gain = v === 0 ? 0 : Math.pow(10, dB / 20);
            this.masterGain.gain.setValueAtTime(gain, this.audioContext.currentTime);
        }
    }

    setMusicVolume(value) {
        if (this.musicGain) {
            const v = Math.max(0, Math.min(1, parseFloat(value)));
            const dB = v === 0 ? -Infinity : (-60 + (60 * Math.pow(v, 1.8)));
            const gain = v === 0 ? 0 : Math.pow(10, dB / 20);
            this.musicGain.gain.setValueAtTime(gain, this.audioContext.currentTime);
        }
    }

    // Apply saved volumes from localStorage, used on init/unlock so volumes persist across restarts/resets
    _applySavedVolumes() {
        try {
            const savedVolume = localStorage.getItem('jumpline_volume');
            if (savedVolume !== null) {
                this.setVolume(savedVolume);
            }
            const savedMusicVolume = localStorage.getItem('jumpline_musicVolume');
            if (savedMusicVolume !== null) {
                this.setMusicVolume(savedMusicVolume);
            }
        } catch (e) {
            // Safe-guard: ignore storage errors
            console.warn('Could not apply saved volumes:', e);
        }
    }

    enableSlowMoAudio(rate = 0.5) {
        if (this.effectsManager) {
            this.effectsManager.enableSlowMoAudio(rate, this.activeLoops);
        }
    }

    disableSlowMoAudio() {
        if (this.effectsManager) {
            this.effectsManager.disableSlowMoAudio(this.activeLoops);
        }
    }

    // Expose analyser for visualizer
    getAnalyser() {
        if (!this.isInitialized || !this.audioContext) return null;
        if (!this.analyser) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.analyserBuffer = new Uint8Array(this.analyser.frequencyBinCount);
            // Non-intrusive parallel tap from musicGain
            try { this.musicGain.connect(this.analyser); } catch {}
        }
        return this.analyser;
    }

    getAnalyserData() {
        if (!this.analyser || !this.analyserBuffer) return null;
        this.analyser.getByteFrequencyData(this.analyserBuffer);
        return this.analyserBuffer;
    }
}