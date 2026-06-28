export const PLAYER_DEFAULTS = {
    WIDTH: 24,
    HEIGHT: 48,
    SPEED: 6,
    JUMP_POWER: 12,
    LIVES: 3,
};

export const PHYSICS = {
    GRAVITY: 0.6,
    SLOW_FALL_GRAVITY: 0.2,
    FRICTION: 0.8,
};

export const WORLD_DEFAULTS = {
    CHUNK_WIDTH: 800,
    GROUND_HEIGHT: 100,
};

export const POWERUP_DURATION = {
    SLOW_FALL: 5000, // ms
    FLY: 2000, // ms
    SHRINK: 5000, // ms
    SPEED: 12000, // ms - global slowdown (player unaffected)
    INVINCIBILITY: 5000, // ms
};

export const EASTER_EGG_WORDS = ['EAGLE', 'BIRD', 'EATER', 'RICK'];

export const GOOMBA_DEFAULTS = {
    WIDTH: 30,
    HEIGHT: 30,
    SPEED: 1.5,
    COIN_REWARD: 5,
    PATROL_BUFFER: 20, // pixels from platform edge before turning around
};

export const COIN_VALUES = {
    POWERUP: 1,
    MILESTONES: [
        { distance: 100, coins: 5 },
        { distance: 900, coins: 10 },
        { distance: 4000, coins: 25 },
        { distance: 19999, coins: 50 },
    ],
    REPEATING_MILESTONE: {
        start: 20000,
        interval: 2000,
        coins: 20,
    }
};

export const PALETTES = {
    default: {
        name: 'Classic',
        price: 0,
        colors: {
            background: 'white',
            foreground: 'black',
        }
    },
    ocean: {
        name: 'Oceanic',
        price: 10,
        colors: {
            background: '#001f3f', // Navy
            foreground: '#7FDBFF', // Aqua
        }
    },
    ember: {
        name: 'Ember',
        price: 25,
        colors: {
            background: '#1a0000', // Dark Red/Brown
            foreground: '#FF851B', // Orange
        }
    },
    space: {
        name: 'Nebula',
        price: 50,
        colors: {
            background: '#2c003e', // Deep purple
            foreground: '#ff00ff', // Magenta
        }
    },
    hacker: {
        name: 'Hacker',
        price: 86,
        colors: {
            background: 'black',
            foreground: '#00FF00',
        },
        particle_effect: 'matrix',
        death_effect: 'matrix',
    },
    bread: {
        name: 'Bread',
        price: 35,
        colors: {
            background: '#D2B48C',
            foreground: '#8B4513',
        }
    },
    fish: {
        name: 'FISH',
        price: 120,
        colors: {
            background: '#3a4f6b',
            foreground: '#6b89b5',
        },
        particle_effect: 'fish',
        death_effect: 'water',
        audio_effect: 'bass_boost',
    },
    lori: {
        name: 'LORI',
        price: 100,
        colors: {
            background: 'black',
            foreground: '#9400D3',
        }
    },
    moon: {
        name: 'Moon',
        price: 180,
        colors: {
            background: '#000000',
            foreground: '#AAAAAA',
        },
        texture: '/pluto.png'
    },
    reversed: {
        name: 'Reversed',
        price: 20,
        colors: {
            background: 'black',
            foreground: 'white',
        }
    },
    gameboy: {
        name: 'Gameboy Color',
        price: 60,
        colors: {
            background: '#9bbc0f', // Light green (Normal)
            foreground: '#0f380f', // Dark green (Outlines)
        },
        audio_effect: 'super_bitcrusher',
        // Slight pixelation without extreme zoom so UI and effects stay readable
        pixel_scale: 0.5
    }
};

export const SONGS = {
    default_song: {
        name: 'Jump',
        price: 0,
        path: 'Happy Pixelated Beat - Faster.mp3'
    },
    lined_song: {
        name: 'Lined',
        price: 30,
        path: 'Speedy Pixelated Beat.mp3'
    },
    bread_song: {
        name: 'Bread',
        price: 40,
        path: 'Super Playful Goofy Bread Beat.mp3'
    },
    bread_trap_song: {
        name: 'Bread Trap',
        price: 60,
        path: 'Goofy Bread Trap Remix.mp3'
    },
    rush_song: {
        name: 'Rush',
        price: 50,
        path: 'Boss Rush_ Ramp-Up Battle.mp3'
    },
    remix_song: {
        name: 'Jump - Remix',
        price: 75,
        path: 'OH YEAH - Glitchy Chopped Remix.mp3'
    },
    glitch_song: {
        name: 'Glitch',
        price: 100,
        path: 'Pixel Glitch Groove.mp3'
    },
    i_see_you_song: {
        name: '1 SEE Y0U',
        price: 50,
        path: 'I See YOU (Glitch Club Mix).mp3'
    },
    chase_song: {
        name: 'Chase',
        price: 80,
        path: 'READY OR NOT - c00lkidd Chase Theme _ Forsaken OST.mp3'
    },
    dreamcore_song: {
        name: 'Dreamcore',
        price: 320,
        path: 'Dreamcore Angelic Instrumental.mp3'
    },
    solo_preview_song: {
        name: 'BFDIA 22 song',
        price: 85,
        path: 'Exclusive preview track from my new Solo Album.mp3'
    },
    pixel_loop_song: {
        name: 'Pixel Loop',
        price: 70,
        path: 'Pixel Runner Ambient Loop.mp3'
    },
    ameriusa_drop_song: {
        name: 'Ameriusa Drop',
        price: 95,
        path: 'THIS IS AMERIUSA (Explosion Drop).mp3'
    },
    // --- New songs ---
    burrito_song: {
        name: "Burrito Dude",
        price: 55,
        path: "Where's My Burrito, Dude_.mp3"
    },
    verycool_song: {
        name: "Very Cool",
        price: 65,
        path: "verycoolsong.mp3"
    },
    glitch_drive_song: {
        name: "Glitch Drive",
        price: 120,
        path: "Glitch Drive (Instrumental).mp3"
    },
    // --- Added song ---
    hammer_song: {
        name: "Hammer of Justice",
        price: 150,
        path: "58. Hammer of Justice (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3",
        hidden: true
    },
    black_knife_song: {
        name: "Black Knife",
        price: 200,
        path: "30. Black Knife (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3"
    },
    // --- Newly added tracks ---
    server_down_song: {
        name: "Websim Down",
        price: 110,
        path: "Server Down.mp3"
    },
    chill_until_rage_song: {
        name: "Jumpline - The Musical",
        price: 130,
        path: "Jumpline, Chill Until Rage.mp3"
    },
    happy_views_song: {
        name: "Happy 3771 Views",
        price: 140,
        path: "Happy 3771 Views.mp3"
    },
    cubey_song: {
        name: "Cubey Song (Joke)",
        price: 78,
        path: "Cubey Song (Joke Version).mp3"
    }
};

export const DEATH_EFFECTS = {
    normal: { name: 'Normal', description: 'Splits into two pieces.' },
    crumble: { name: 'Crumble', description: 'Breaks into many small pieces.' },
    water: { name: 'Melt', description: 'Flattens and dissolves into goo.' }
};