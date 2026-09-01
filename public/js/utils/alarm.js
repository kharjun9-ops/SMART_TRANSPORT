/**
 * Lumina Transit - Audio Beep Synthesizer & Deboard Alarm Utility
 * Uses Web Audio API for zero-dependency high-reliability audio beeps and alarms.
 */
const AlarmUtils = {
    audioCtx: null,

    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    },

    /**
     * Play a single beep sound tone
     */
    playBeep(freq = 880, durationMs = 200, type = 'sine') {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (durationMs / 1000));

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + (durationMs / 1000));
        } catch (e) {}
    },

    /**
     * Play Deboard Alarm Chime (2 pleasant rising tones)
     */
    playDeboardChime() {
        this.playBeep(523.25, 180, 'sine'); // C5
        setTimeout(() => {
            this.playBeep(659.25, 300, 'sine'); // E5
        }, 220);

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    },

    /**
     * Play Missed Stop Emergency Beep Alarm (3 urgent high-pitch beeps)
     */
    playMissedStopAlarm() {
        this.playBeep(987.77, 150, 'square'); // B5
        setTimeout(() => this.playBeep(987.77, 150, 'square'), 200);
        setTimeout(() => this.playBeep(1174.66, 350, 'square'), 400); // D6

        if (navigator.vibrate) {
            navigator.vibrate([400, 150, 400, 150, 600]);
        }
    }
};

window.AlarmUtils = AlarmUtils;
