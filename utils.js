export class SeededRandom {
    constructor(seed) {
        this.seed = seed | 0;
    }

    // Mulberry32
    next() {
        var t = (this.seed += 0x6D2B79F5);
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    
    // Range [min, max)
    range(min, max) {
        return min + this.next() * (max - min);
    }

    // true/false with probability p
    chance(p) {
        return this.next() < p;
    }
}