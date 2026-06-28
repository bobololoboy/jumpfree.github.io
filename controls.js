export class Controls {
    constructor() {
        this.keys = {};
        this.keySequence = '';
        this.eventListeners = {};

        // Jump debouncing for keyboard: only emit on initial press
        this._jumpKeyHeld = false;

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        this.setupMobileControls();
    }

    setupMobileControls() {
        const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.remove('hidden');
        }

        const leftButton = document.getElementById('leftButton');
        const rightButton = document.getElementById('rightButton');
        const jumpButton = document.getElementById('jumpButton');

        // Prefer Pointer Events. Only fall back to Touch Events if Pointer is not available.
        const usePointer = 'onpointerdown' in window;

        const bindPressablePointer = (el, onDown, onUp) => {
            if (!el) return;
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                el.setPointerCapture?.(e.pointerId);
                onDown(e);
            }, { passive: false });
            el.addEventListener('pointerup', (e) => {
                e.preventDefault();
                onUp(e);
            }, { passive: false });
            el.addEventListener('pointercancel', (e) => {
                e.preventDefault();
                onUp(e);
            }, { passive: false });
            // Support moving pointer off the button
            el.addEventListener('pointerleave', (e) => {
                if (e.pressure === 0) onUp(e);
            }, { passive: true });
        };

        const bindPressableTouch = (el, onDown, onUp) => {
            if (!el) return;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                onDown(e);
            }, { passive: false });
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                onUp(e);
            }, { passive: false });
            el.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                onUp(e);
            }, { passive: false });
        };

        const bindPressable = usePointer ? bindPressablePointer : bindPressableTouch;

        if (leftButton && rightButton && jumpButton) {
            // Left/Right drive 'a'/'d' keys so the rest of the game code reuses the same paths
            bindPressable(leftButton, () => { this.keys['a'] = true; }, () => { this.keys['a'] = false; });
            bindPressable(rightButton, () => { this.keys['d'] = true; }, () => { this.keys['d'] = false; });

            // Jump: emit one jump on press, AND hold a virtual "space" key while pressed
            // This makes Fly work on mobile (Player checks for holding jump via keys[' '] etc.)
            const onJumpDown = () => {
                if (!this.keys[' ']) {
                    // Only emit if not already "held" to avoid double triggers
                    this.emit('jump');
                }
                this.keys[' '] = true; // hold for Fly
            };
            const onJumpUp = () => {
                this.keys[' '] = false;
            };
            bindPressable(jumpButton, onJumpDown, onJumpUp);
        }
    }

    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = true;

        // Easter Egg Listener
        this.keySequence += e.key.toUpperCase();
        if (this.keySequence.length > 10) {
            this.keySequence = this.keySequence.substring(this.keySequence.length - 10);
        }
        this.emit('keySequence', this.keySequence);

        // Debounce keyboard jump so holding doesn't spam double jump
        if ((key === 'w' || key === 'arrowup' || key === ' ') && !this._jumpKeyHeld) {
            this._jumpKeyHeld = true;
            this.emit('jump');
        }

        if (key === 'q') {
            this.emit('back-to-menu');
        }

        if (key === 'escape') {
            this.emit('pause-toggle');
        }

        // Special ability spawn (backslash) - emit an event
        if (e.key === '\\') {
            this.emit('spawn-ability');
        }

        // Special goomba spawn (forward slash) - emit an event
        if (e.key === '/') {
            this.emit('spawn-goomba');
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;

        if (key === 'w' || key === 'arrowup' || key === ' ') {
            this._jumpKeyHeld = false;
        }
    }
}