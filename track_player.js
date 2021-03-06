const FADE_TIME = 2;

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

        this.isMuted = false;

        this.audioCtx = context;
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
        console.time(`Loading track ${track}`)
        return fetch(chrome.runtime.getURL("tracks/" + track))
            .then((resp) => resp.arrayBuffer())
            .then((buffer) => this.audioCtx.decodeAudioData(buffer))
            .then((decoded) => {
                this.switchTracks();
                this.setNextTrack(decoded, loop);
                console.timeEnd(`Loading track ${track}`)
            });
    }

    setNextTrack(buffer, loop = true) {
        const currTime = this.audioCtx.currentTime;

        const newTrack = this.audioCtx.createBufferSource();
        newTrack.loop = loop;
        newTrack.buffer = buffer;

        const newGain = this.audioCtx.createGain();
        newGain.gain.linearRampToValueAtTime(0, currTime);
        if (!this.isMuted) {
            newGain.gain.linearRampToValueAtTime(1, currTime + FADE_TIME);
        } else {
            this.previousGain = 1;
        }

        newGain.connect(this.audioCtx.destination);
        newTrack.connect(newGain);
        newTrack.start(currTime);

        this.nextTrack = newTrack;
        this.nextGainNode = newGain;
    }

    mute() {
        this.isMuted = true;

        if (this.gainNode) {
            this.gainNode.gain.value = 0;
        }

        if (this.nextGainNode) {
            this.previousGain = this.nextGainNode.gain.value;
            this.nextGainNode.gain.value = 0;
        }
    }

    unmute() {
        this.isMuted = false;

        if (this.nextGainNode) {
            this.nextGainNode.gain.value = this.previousGain;
        }
    }

    stop() {
        if (this.currentTrack) {
            this.currentTrack.stop(0);
            this.currentTrack.disconnect(0);
            this.currentTrack.onended = null;
            this.currentTrack.__src = null;
        }

        if (this.nextTrack) {
            this.nextTrack.stop(0);
            this.nextTrack.disconnect(0);
            this.nextTrack.onended = null;
            this.nextTrack.__src = null;
        }
    }
}