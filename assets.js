export class AssetLoader {
    constructor() {
        this.sprites = {};
        this.spritesLoaded = false;
        this.spriteFiles = [
            'normal.svg', 
            'deadhead.svg', 
            'deadtorso.svg', 
            'costume1.svg',
            'costume2.svg',
            'costume3.svg',
            'pluto.png',
            'costume1 (1).svg',
            'YOUR DEAD.png'
        ];
    }

    load(onProgress) {
        return new Promise((resolve) => {
            let loadedCount = 0;
            const totalToLoad = this.spriteFiles.length;

            if (totalToLoad === 0) {
                this.spritesLoaded = true;
                resolve();
                return;
            }

            const checkDone = () => {
                if (++loadedCount === totalToLoad) {
                    this.spritesLoaded = true;
                    resolve();
                }
            };

            this.spriteFiles.forEach(filename => {
                const img = new Image();
                img.onload = () => {
                    const name = filename.replace(/\.(svg|png)$/, '');
                    img.aspectRatio = img.naturalWidth / img.naturalHeight;
                    this.sprites[name] = img;
                    if (onProgress) onProgress(name);
                    checkDone();
                };
                img.onerror = () => {
                    console.error(`Failed to load image: /${filename}`);
                    if (onProgress) onProgress(`Error: ${filename}`);
                    checkDone(); // Mark as done to prevent getting stuck
                };
                img.src = `/${filename}`;
            });
        });
    }

    get(name) {
        return this.sprites[name];
    }
}