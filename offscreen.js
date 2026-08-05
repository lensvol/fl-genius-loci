const trackPlayer = new TrackPlayer();

ExtensionApi.onRuntimeMessage((message, sender, sendResponse) => {
    if (message.action === ExtensionMessages.audio.playTrack) {
        trackPlayer.setVolume(message.volume);

        if (message.isMuted) {
            trackPlayer.mute();
        } else {
            trackPlayer.unmute();
        }

        if (message.assetId) {
            if (trackPlayer.isPlayingCustomTrack(message.assetId)) {
                sendResponse({ok: true});
                return true;
            }

            trackPlayer.playCustomTrack(message.assetId, message.loop)
                .then(() => sendResponse({ok: true}))
                .catch((error) => sendResponse({ok: false, error: String(error)}));
            return true;
        }

        if (trackPlayer.isPlayingTrack(message.track)) {
            sendResponse({ok: true});
            return true;
        }

        trackPlayer.playTrack(message.track, message.loop)
            .then(() => sendResponse({ok: true}))
            .catch((error) => sendResponse({ok: false, error: String(error)}));
        return true;
    }

    if (message.action === ExtensionMessages.audio.mute) {
        trackPlayer.mute();
        sendResponse({ok: true});
    }

    if (message.action === ExtensionMessages.audio.unmute) {
        trackPlayer.unmute();
        sendResponse({ok: true});
    }

    if (message.action === ExtensionMessages.audio.setVolume) {
        trackPlayer.setVolume(message.volume);
        sendResponse({ok: true});
    }

    if (message.action === ExtensionMessages.audio.stop) {
        trackPlayer.stop();
        sendResponse({ok: true});
    }
});
