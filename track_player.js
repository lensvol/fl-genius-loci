class TrackPlayer {
    constructor() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();

        this.source = null;

        this.gainNode = context.createGain();
        this.gainNode.connect(context.destination);
        this.previousGain = 1;

        this.buffers = new Map();

        this.audioCtx = context;
    }

    async loadTracks(trackPaths) {
        console.log("Trying to load tracks...");

        for (const trackPath of trackPaths) {
            const request = await fetch(chrome.runtime.getURL("tracks/" + trackPath));
            const buffer = await request.arrayBuffer();
            this.buffers[trackPath] = await this.audioCtx.decodeAudioData(buffer);
        }
    }

    playTrack(track) {
        if (this.source) {
            this.source.stop(0);
        }

        this.source = this.audioCtx.createBufferSource();
        this.source.buffer = this.buffers[track];
        this.source.connect(this.gainNode);
        this.gainNode.gain.value = 1;
        this.source.start(0);
    }

    mute() {
        this.previousGain = this.gainNode.gain.value;
        this.gainNode.gain.value = 0;
    }

    unmute() {
        this.gainNode.gain.value = this.previousGain;
    }
}