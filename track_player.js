class TrackPlayer {
    constructor() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();

        this.currentTrack = null;
        this.nextTrack = null;
        this.activeTrackPath = null;

        this.gainNode = context.createGain();
        this.gainNode.connect(context.destination);

        this.nextGainNode = null;

        this.isMuted = false;
        this.volume = this.clampVolume(ExtensionSettings.defaultVolume);

        this.fadeTimeSeconds = ExtensionSettings.fadeTimeSeconds;
        this.audioCtx = context;
    }

    clampVolume(volume) {
        const parsedVolume = Number(volume);
        if (!Number.isFinite(parsedVolume)) {
            return ExtensionSettings.defaultVolume;
        }

        return Math.min(1, Math.max(0, parsedVolume));
    }

    effectiveVolume() {
        return this.isMuted ? 0 : this.volume;
    }

    setGainImmediately(gainNode, value) {
        if (!gainNode) {
            return;
        }

        const currTime = this.audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(currTime);
        gainNode.gain.setValueAtTime(value, currTime);
    }

    rampGainToVolume(gainNode, volume) {
        if (!gainNode) {
            return;
        }

        const currTime = this.audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(currTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, currTime);
        gainNode.gain.linearRampToValueAtTime(volume, currTime + this.fadeTimeSeconds);
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
            if (this.isMuted) {
                this.setGainImmediately(this.gainNode, 0);
            } else {
                this.gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + this.fadeTimeSeconds);
            }
        }
    }

    playTrack(track, loop = true) {
        console.time(`Loading track ${track}`)
        return fetch(ExtensionApi.getURL(ExtensionSettings.tracksPathPrefix + track))
            .then((resp) => resp.arrayBuffer())
            .then((buffer) => this.audioCtx.decodeAudioData(buffer))
            .then((decoded) => {
                this.switchTracks();
                this.setNextTrack(decoded, loop);
                this.activeTrackPath = track;
                console.timeEnd(`Loading track ${track}`)
            });
    }

    playCustomTrack(assetId, loop = true) {
        const trackId = CustomAudioStore.customTrackId(assetId);
        console.time(`Loading track ${trackId}`)
        return CustomAudioStore.getAudioAsset(assetId)
            .then((asset) => {
                if (!asset || !asset.blob) {
                    throw new Error("Imported audio asset is missing.");
                }

                return asset.blob.arrayBuffer();
            })
            .then((buffer) => this.audioCtx.decodeAudioData(buffer))
            .then((decoded) => {
                this.switchTracks();
                this.setNextTrack(decoded, loop);
                this.activeTrackPath = trackId;
                console.timeEnd(`Loading track ${trackId}`)
            });
    }

    isPlayingTrack(track) {
        return this.activeTrackPath === track;
    }

    isPlayingCustomTrack(assetId) {
        return this.activeTrackPath === CustomAudioStore.customTrackId(assetId);
    }

    setNextTrack(buffer, loop = true) {
        const currTime = this.audioCtx.currentTime;

        const newTrack = this.audioCtx.createBufferSource();
        newTrack.loop = loop;
        newTrack.buffer = buffer;

        const newGain = this.audioCtx.createGain();
        newGain.gain.setValueAtTime(0, currTime);
        const targetVolume = this.effectiveVolume();
        if (targetVolume > 0) {
            newGain.gain.linearRampToValueAtTime(targetVolume, currTime + this.fadeTimeSeconds);
        }

        newGain.connect(this.audioCtx.destination);
        newTrack.connect(newGain);
        newTrack.start(currTime);

        this.nextTrack = newTrack;
        this.nextGainNode = newGain;
    }

    mute() {
        this.isMuted = true;
        this.setGainImmediately(this.gainNode, 0);
        this.setGainImmediately(this.nextGainNode, 0);
    }

    unmute() {
        this.isMuted = false;

        if (this.nextGainNode) {
            this.rampGainToVolume(this.nextGainNode, this.volume);
        }
    }

    setVolume(volume) {
        this.volume = this.clampVolume(volume);

        if (this.isMuted) {
            this.setGainImmediately(this.gainNode, 0);
            this.setGainImmediately(this.nextGainNode, 0);
            return;
        }

        if (this.nextGainNode) {
            this.setGainImmediately(this.nextGainNode, this.volume);
        } else {
            this.setGainImmediately(this.gainNode, this.volume);
        }
    }

    stop() {
        this.activeTrackPath = null;

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
