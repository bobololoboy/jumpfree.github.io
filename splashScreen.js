import { PALETTES } from './constants.js';

export class SplashScreenManager {
    constructor(audioManager, dataManager) {
        this.audio = audioManager;
        this.dataManager = dataManager;
        this.element = document.getElementById('splashScreen');
        this.logo = document.getElementById('splashLogo');
    }

    async run() {
        if (!this.element || !this.logo) return;
    
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
        // Get current theme background color
        const paletteConf = PALETTES[this.dataManager.userData.equipped_palette] || PALETTES.default;
        const themeBgColor = paletteConf.colors.background;
    
        // 1. Fade to theme color
        this.element.style.backgroundColor = themeBgColor;
        this.element.style.display = 'flex';
        await wait(50); // let display apply
        this.element.style.opacity = '1';
        await wait(500);
    
        // 2. Fade to white
        this.element.style.backgroundColor = 'white';
        await wait(500);
    
        // 3. Show logo with sound
        this.logo.style.opacity = '1';
        this.logo.style.transform = 'scale(1)';
        this.audio.play('sparkle');
        await wait(2000); // Hold logo
    
        // 4. Fade out logo
        this.logo.style.opacity = '0';
        this.logo.style.transform = 'scale(0.8)';
        await wait(700);
    
        // 5. Fade back to theme color
        this.element.style.backgroundColor = themeBgColor;
        await wait(500);
    
        // 6. Fade out splash screen
        this.element.style.opacity = '0';
        await wait(500);
    
        this.element.style.display = 'none';
    }
}