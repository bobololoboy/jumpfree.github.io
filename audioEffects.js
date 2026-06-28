export class AudioEffectsManager {
    constructor(audioContext, masterGainNode) {
        this.audioContext = audioContext;
        this.masterGain = masterGainNode;

        this.slowMoActive = false;
        this.filterNode = null;
        this._slowMoRate = 0.5;

        this.retroEnabled = false;
        this.bitcrusherNode = null;
        this.workletLoaded = false;
        this.workletLoading = false;
    }

    get currentPlaybackRate() {
        return this.slowMoActive ? this._slowMoRate : 1.0;
    }

    async ensureWorkletLoaded() {
        if (!this.audioContext || this.workletLoaded || this.workletLoading) return;
        this.workletLoading = true;
        if (!this.audioContext.audioWorklet) {
            console.warn('AudioWorklet not supported; retro FX disabled.');
            this.workletLoading = false;
            return;
        }
        const processorCode = `
            class BitcrusherProcessor extends AudioWorkletProcessor {
                static get parameterDescriptors() {
                    return [
                        { name: 'bitDepth', defaultValue: 6, minValue: 1, maxValue: 16, automationRate: 'k-rate' },
                        { name: 'reduction', defaultValue: 8, minValue: 1, maxValue: 100, automationRate: 'k-rate' },
                        { name: 'wet', defaultValue: 0.7, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
                    ];
                }
                constructor() {
                    super();
                    this._phase = 0;
                    this._held = [0,0];
                }
                process(inputs, outputs, parameters) {
                    const input = inputs[0];
                    const output = outputs[0];
                    if (!input || input.length === 0) return true;

                    const bitDepth = parameters.bitDepth.length ? parameters.bitDepth[0] : 6;
                    const reduction = parameters.reduction.length ? parameters.reduction[0] : 8;
                    const wet = parameters.wet.length ? parameters.wet[0] : 0.7;

                    const step = Math.pow(0.5, bitDepth); // quantization step (amplitude)
                    const channels = Math.min(input.length, output.length);

                    for (let ch = 0; ch < channels; ch++) {
                        const inCh = input[ch];
                        const outCh = output[ch];
                        if (!inCh) continue;
                        let heldSample = this._held[ch] || 0;
                        let phase = this._phase;

                        for (let i = 0; i < inCh.length; i++) {
                            if (phase <= 0) {
                                // downsample: capture a new sample, quantize it
                                let s = inCh[i];
                                // Hard clip to [-1,1] then quantize
                                s = Math.max(-1, Math.min(1, s));
                                s = Math.round(s / step) * step;
                                heldSample = s;
                                phase = reduction;
                            }
                            phase--;
                            // simple dry/wet mix
                            const dry = inCh[i];
                            outCh[i] = dry * (1 - wet) + heldSample * wet;
                        }
                        this._held[ch] = heldSample;
                        this._phase = phase;
                    }
                    return true;
                }
            }
            registerProcessor('bitcrusher', BitcrusherProcessor);
        `;
        const blob = new Blob([processorCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        try {
            await this.audioContext.audioWorklet.addModule(url);
            this.workletLoaded = true;
        } catch (e) {
            console.warn('Failed to load audio worklet module:', e);
        } finally {
            URL.revokeObjectURL(url);
            this.workletLoading = false;
        }
    }

    async enableRetroFX() {
        if (!this.audioContext) return;
        await this.ensureWorkletLoaded();
        if (!this.workletLoaded) return;

        if (!this.bitcrusherNode) {
            this.bitcrusherNode = new AudioWorkletNode(this.audioContext, 'bitcrusher', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [2]
            });
        }

        // Apply gentle bitcrushing settings every time (fixing persistence from Super FX)
        // Previous was: Depth 5, Redux 10, Wet 0.8 (Very harsh)
        // New: Depth 10, Redux 3, Wet 0.25 (Subtle texture)
        this.bitcrusherNode.parameters.get('bitDepth')?.setValueAtTime(10, this.audioContext.currentTime);
        this.bitcrusherNode.parameters.get('reduction')?.setValueAtTime(3, this.audioContext.currentTime);
        this.bitcrusherNode.parameters.get('wet')?.setValueAtTime(0.25, this.audioContext.currentTime);

        this.retroEnabled = true;
        this.wireChain();
    }

    async enableSuperRetroFX() {
        if (!this.audioContext) return;
        await this.ensureWorkletLoaded();
        if (!this.workletLoaded) return;

        if (!this.bitcrusherNode) {
            this.bitcrusherNode = new AudioWorkletNode(this.audioContext, 'bitcrusher', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [2]
            });
        }
        // Much harsher settings for Gameboy feel
        this.bitcrusherNode.parameters.get('bitDepth')?.setValueAtTime(3, this.audioContext.currentTime);
        this.bitcrusherNode.parameters.get('reduction')?.setValueAtTime(25, this.audioContext.currentTime);
        this.bitcrusherNode.parameters.get('wet')?.setValueAtTime(1.0, this.audioContext.currentTime);
        
        this.retroEnabled = true;
        this.wireChain();
    }

    async enableBassBoostFX() {
        if (!this.audioContext) return;
        
        if (!this.bassBoostNode) {
            // Create bass boost filter chain
            this.bassBoostNode = this.audioContext.createBiquadFilter();
            this.bassBoostNode.type = 'lowpass';
            this.bassBoostNode.frequency.setValueAtTime(800, this.audioContext.currentTime);
            this.bassBoostNode.Q.setValueAtTime(15, this.audioContext.currentTime);
            this.bassBoostNode.gain.setValueAtTime(12, this.audioContext.currentTime);
            
            // Add distortion with heavy gain
            this.distortionNode = this.audioContext.createGain();
            this.distortionNode.gain.setValueAtTime(8, this.audioContext.currentTime);
            
            // Compressor to limit peaks
            this.compressorNode = this.audioContext.createDynamicsCompressor();
            this.compressorNode.threshold.setValueAtTime(-24, this.audioContext.currentTime);
            this.compressorNode.knee.setValueAtTime(30, this.audioContext.currentTime);
            this.compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime);
            this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime);
            this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime);
        }
        
        this.bassBoostEnabled = true;
        this.wireChain();
    }

    disableBassBoostFX() {
        this.bassBoostEnabled = false;
        this.wireChain();
    }

    disableRetroFX() {
        this.retroEnabled = false;
        this.wireChain();
    }
    
    _setLoopsPlaybackRate(rate, activeLoops) {
        if (!this.audioContext) return;
        for (const name in activeLoops) {
            const loop = activeLoops[name];
            try {
                loop.source.playbackRate.cancelScheduledValues(this.audioContext.currentTime);
                loop.source.playbackRate.setValueAtTime(rate, this.audioContext.currentTime);
            } catch (e) {
                // Ignore errors
            }
        }
    }

    enableSlowMoAudio(rate = 0.5, activeLoops) {
        if (!this.audioContext) return;
        this._slowMoRate = rate;
        this.slowMoActive = true;

        if (!this.filterNode) {
            this.filterNode = this.audioContext.createBiquadFilter();
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.setValueAtTime(22050, this.audioContext.currentTime);
        }

        const now = this.audioContext.currentTime;
        this.filterNode.frequency.cancelScheduledValues(now);
        this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
        this.filterNode.frequency.linearRampToValueAtTime(350, now + 0.35);

        this._setLoopsPlaybackRate(rate, activeLoops);
        this.wireChain();
    }

    disableSlowMoAudio(activeLoops) {
        if (!this.audioContext) return;
        this.slowMoActive = false;

        this._setLoopsPlaybackRate(1.0, activeLoops);

        if (this.filterNode) {
            const now = this.audioContext.currentTime;
            this.filterNode.frequency.cancelScheduledValues(now);
            this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
            this.filterNode.frequency.linearRampToValueAtTime(22050, now + 0.2);

            setTimeout(() => {
                this.filterNode = null;
                this.wireChain();
            }, 250);
        } else {
            this.wireChain();
        }
    }

    wireChain() {
        if (!this.audioContext) return;
        const ctx = this.audioContext;

        try { this.masterGain.disconnect(); } catch {}
        if (this.filterNode) { try { this.filterNode.disconnect(); } catch {} }
        if (this.bitcrusherNode) { try { this.bitcrusherNode.disconnect(); } catch {} }
        if (this.bassBoostNode) { try { this.bassBoostNode.disconnect(); } catch {} }
        if (this.distortionNode) { try { this.distortionNode.disconnect(); } catch {} }
        if (this.compressorNode) { try { this.compressorNode.disconnect(); } catch {} }

        let lastNode = this.masterGain;

        if (this.slowMoActive) {
            if (!this.filterNode) {
                this.filterNode = ctx.createBiquadFilter();
                this.filterNode.type = 'lowpass';
                this.filterNode.frequency.setValueAtTime(22050, ctx.currentTime);
            }
            lastNode.connect(this.filterNode);
            lastNode = this.filterNode;
        }

        if (this.bassBoostEnabled && this.bassBoostNode && this.distortionNode && this.compressorNode) {
            lastNode.connect(this.distortionNode);
            this.distortionNode.connect(this.compressorNode);
            this.compressorNode.connect(this.bassBoostNode);
            lastNode = this.bassBoostNode;
        }

        if (this.retroEnabled && this.bitcrusherNode) {
            lastNode.connect(this.bitcrusherNode);
            lastNode = this.bitcrusherNode;
        }

        lastNode.connect(ctx.destination);
    }
}