const FADE_TIME = 3;

class TrackPlayer {
    constructor() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();

        this.currentTrack = null;
        this.nextTrack = null;

        this.gainNode = context.createGain();
        this.gainNode.connect(context.destination);

        this.nextGainNode = null;

        this.previousGain = 1;

        this.buffers = new Map();

        this.audioCtx = context;
    }

    async loadTracks(trackPaths) {
        console.time("[FL Genius Loci] Loading tracks");
        const fetches = [];

        for (const trackPath of trackPaths) {
            let path = trackPath;
            fetches.push(
                fetch(chrome.runtime.getURL("tracks/" + trackPath))
                    .then((resp) => resp.arrayBuffer())
                    .then((buffer) => this.audioCtx.decodeAudioData(buffer))
                    .then((decoded) => this.buffers[path] = decoded)
            );
        }

        await Promise.allSettled(fetches);
        console.timeEnd("[FL Genius Loci] Loading tracks");
    }

    switchTracks() {
        console.debug("Switching tracks...");

        if (this.currentTrack) {
            this.currentTrack.stop(0);
            this.currentTrack.disconnect();
            this.currentTrack = null;
            this.gainNode = null;
        }

        this.currentTrack = this.nextTrack;
        this.gainNode = this.nextGainNode;
        if (this.gainNode) {
            this.gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + FADE_TIME);
        }
    }

    playTrack(track, loop = true) {
        this.switchTracks();

        const currTime = this.audioCtx.currentTime;

        const newTrack = this.audioCtx.createBufferSource();
        newTrack.loop = loop;
        newTrack.buffer = this.buffers[track];

        const newGain = this.audioCtx.createGain();
        newGain.gain.linearRampToValueAtTime(0, currTime);
        newGain.gain.linearRampToValueAtTime(1, currTime + FADE_TIME);

        newGain.connect(this.audioCtx.destination);
        newTrack.connect(newGain);
        newTrack.start(currTime);

        this.nextTrack = newTrack;
        this.nextGainNode = newGain;
    }

    mute() {
        if (this.gainNode) {
            this.previousGain = this.gainNode.gain.value;
            this.gainNode.gain.value = 0;
        }
    }

    unmute() {
        if (this.gainNode) {
            this.gainNode.gain.value = this.previousGain;
        }
    }

    stop() {
        if (this.currentTrack) {
            this.currentTrack.stop(0);
            this.currentTrack.disconnect();
        }

        if (this.nextTrack) {
            this.nextTrack.stop(0);
            this.nextTrack.disconnect();
        }
    }
}