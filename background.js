const UNKNOWN = ExtensionSettings.unknownLocation;

class OffscreenTrackPlayer {
    async sendAudioMessage(message) {
        await ExtensionApi.ensureOffscreenDocument(
            ExtensionSettings.offscreenDocumentPath,
            ExtensionSettings.offscreenAudio.reasons,
            ExtensionSettings.offscreenAudio.justification
        );

        return new Promise((resolve, reject) => {
            ExtensionApi.sendRuntimeMessage(message, (response) => {
                const lastError = ExtensionApi.getLastErrorMessage();
                if (lastError) {
                    reject(lastError);
                    return;
                }

                if (response && response.ok) {
                    resolve(response);
                } else {
                    reject(response && response.error ? response.error : "Audio command failed.");
                }
            });
        });
    }

    playTrack(track, loop = true) {
        const message = {
            action: ExtensionMessages.audio.playTrack,
            track: track,
            loop: loop,
            isMuted: isMuted,
            volume: volume,
        };
        return this.sendAudioMessage(message);
    }

    playCustomTrack(assetId, loop = true) {
        const message = {
            action: ExtensionMessages.audio.playTrack,
            assetId: assetId,
            loop: loop,
            isMuted: isMuted,
            volume: volume,
        };
        return this.sendAudioMessage(message);
    }

    mute() {
        return this.sendAudioMessage({action: ExtensionMessages.audio.mute});
    }

    unmute() {
        return this.sendAudioMessage({action: ExtensionMessages.audio.unmute});
    }

    setVolume(volume) {
        return this.sendAudioMessage({action: ExtensionMessages.audio.setVolume, volume: volume});
    }

    stop() {
        return this.sendAudioMessage({action: ExtensionMessages.audio.stop});
    }
}

const trackPlayer = ExtensionApi.canUseOffscreenDocument() ? new OffscreenTrackPlayer() : new TrackPlayer();

let currentSetting = null;
let currentLocation = null;
let currentTrackPath = "";
let isMuted = false;
let volume = ExtensionSettings.defaultVolume;
let flTabs = [];
let customAreaMappings = {};

function normalizePersistedSetting(name, value) {
    const schema = ExtensionSettings.persistedSettings[name];
    if (!schema) {
        return value;
    }

    if (schema.type === "boolean") {
        return typeof value === "boolean" ? value : schema.defaultValue;
    }

    if (schema.type === "number") {
        const parsedValue = Number(value);
        if (!Number.isFinite(parsedValue)) {
            return schema.defaultValue;
        }

        return Math.min(schema.max, Math.max(schema.min, parsedValue));
    }

    return value === undefined ? schema.defaultValue : value;
}

function loadPersistedSettings() {
    const settingEntries = Object.entries(ExtensionSettings.persistedSettings);
    return Promise.all(settingEntries.map(([name, schema]) => {
        return ExtensionApi.getStorageValue(schema.key, schema.defaultValue)
            .then((storedValue) => [name, normalizePersistedSetting(name, storedValue)]);
    })).then((entries) => Object.fromEntries(entries));
}

function updatePersistedSetting(name, value) {
    const schema = ExtensionSettings.persistedSettings[name];
    const normalizedValue = normalizePersistedSetting(name, value);
    return ExtensionApi.setStorageValue(schema.key, normalizedValue)
        .then(() => normalizedValue);
}

function loadCustomAreaMappings() {
    return CustomAudioStore.getAllAreaMappings()
        .then((mappings) => {
            customAreaMappings = mappings;
            console.debug(`[FL Genius Loci] Loaded ${Object.keys(customAreaMappings).length} custom area mappings.`);
        })
        .catch((error) => {
            customAreaMappings = {};
            console.error(`[FL Genius Loci] Failed to load custom area mappings: ${error}`);
        });
}

const persistedSettingsReady = loadPersistedSettings()
    .then((settings) => {
        isMuted = settings.isMuted;
        volume = settings.volume;
        if (!ExtensionApi.canUseOffscreenDocument()) {
            trackPlayer.setVolume(volume);
        }
        updateBadgeTooltip();
    })
    .catch((error) => {
        console.error(`[FL Genius Loci] Failed to load persisted settings: ${error}`);
        updateBadgeTooltip();
    });

const customAreaMappingsReady = loadCustomAreaMappings();
const runtimeStateReady = Promise.all([persistedSettingsReady, customAreaMappingsReady]);

const externalMapping = new Promise((resolve) => {
    fetch(ExtensionApi.getURL(ExtensionSettings.mappingsPath))
        .then((response) => response.json())
        .then((mappings) => {
            console.log(`Loaded '${ExtensionSettings.mappingsPath}'.`);
            if (mappings.tracks === undefined || mappings.settings === undefined || mappings.areas === undefined) {
                console.error(`Malformed '${ExtensionSettings.mappingsPath}': Keys 'tracks', 'settings' and 'areas' should be present.`);
                resolve({tracks: {}, settings: {}, areas: {}});
            }

            resolve(mappings);
        })
        .catch((reason) => console.error(reason));
})

function mappingWithCustomAreas(mapping) {
    const customAreas = {};
    Object.values(customAreaMappings).forEach((customMapping) => {
        if (customMapping && customMapping.areaId && customMapping.areaName) {
            customAreas[customMapping.areaId] = customMapping.areaName;
        }
    });

    return {
        ...mapping,
        areas: {
            ...mapping.areas,
            ...customAreas,
        },
    };
}

function sendMappingToTab(tabId, requestState = false) {
    externalMapping.then((mapping) => {
        console.debug(`[FL Genius Loci] Sending value mapping to tab ${tabId}...`);
        ExtensionApi.sendTabMessage(tabId, {
            action: ExtensionMessages.tab.setMapping,
            mapping: mappingWithCustomAreas(mapping),
        });

        if (requestState) {
            ExtensionApi.sendTabMessage(tabId, {action: ExtensionMessages.tab.requestState});
        }
    });
}

function sendMappingToAllTabs() {
    flTabs.map((tabId) => sendMappingToTab(tabId));
}

function findTrackForLocation(location) {
    return new Promise((resolve, reject) => {
        externalMapping
            .then(mapping => {
                if (location in mapping.tracks && mapping.tracks[location] !== "") {
                    console.debug(`[FL Genius Loci] Selecting track ${mapping.tracks[location]} for "${location} (${currentSetting})"`);
                    resolve(mapping.tracks[location])
                } else if (currentSetting in mapping.tracks && mapping.tracks[currentSetting] !== "") {
                    console.debug(`[FL Genius Loci] Location unknown, selecting track ${mapping.tracks[currentSetting]} for setting "${currentSetting}"`);
                    resolve(mapping.tracks[currentSetting])
                }

                reject("No appropriate track found.");
            })
    });
}

function updateBadgeTooltip() {
    ExtensionApi.setBadgeText({text: isMuted ? ExtensionSettings.badge.mutedText : ""}, () => {});
    ExtensionApi.setBadgeBackgroundColor({color: isMuted ? ExtensionSettings.badge.mutedColor : ExtensionSettings.badge.defaultColor});

    ExtensionApi.setTitle({"title": `Setting: ${currentSetting}\nLocation: ${currentLocation}`}, () => {});
}

function toggleMute() {
    if (isMuted) {
        isMuted = false;
        trackPlayer.unmute();
    } else {
        isMuted = true;
        trackPlayer.mute();
    }

    updatePersistedSetting("isMuted", isMuted)
        .catch((error) => console.error(`[FL Genius Loci] Failed to save mute state: ${error}`));

    updateBadgeTooltip();
    flTabs.map((tabId) => ExtensionApi.sendTabMessage(tabId, {action: ExtensionMessages.tab.muteStatus, isMuted: isMuted}));
}

function setVolume(newVolume) {
    volume = normalizePersistedSetting("volume", newVolume);

    Promise.resolve(trackPlayer.setVolume(volume))
        .catch((error) => console.error(`[FL Genius Loci] Failed to set volume: ${error}`));

    updatePersistedSetting("volume", volume)
        .catch((error) => console.error(`[FL Genius Loci] Failed to save volume: ${error}`));

    flTabs.map((tabId) => ExtensionApi.sendTabMessage(tabId, {action: ExtensionMessages.tab.volumeStatus, volume: volume}));
}

function announceTrack(text) {
    flTabs.map((tabId) => ExtensionApi.sendTabMessage(tabId, {action: ExtensionMessages.tab.track, track: text}));
}

function announceCustomAreaAssignmentError(mapping, error) {
    const message = {
        action: ExtensionMessages.tab.customAreaAssignmentError,
        areaId: mapping.areaId,
        areaName: mapping.areaName,
        error: String(error),
    };
    flTabs.map((tabId) => ExtensionApi.sendTabMessage(tabId, message));
}

function sendStartupStateToTab(tabId) {
    ExtensionApi.sendTabMessage(tabId, {action: ExtensionMessages.tab.muteStatus, isMuted: isMuted});
    ExtensionApi.sendTabMessage(tabId, {action: ExtensionMessages.tab.volumeStatus, volume: volume});
    sendMappingToTab(tabId, true);
}

function findCustomAreaMapping(areaId) {
    if (areaId === null || areaId === undefined || areaId === UNKNOWN) {
        return null;
    }

    return customAreaMappings[String(areaId)] || null;
}

function playCustomAreaMapping(mapping) {
    const trackId = CustomAudioStore.customTrackId(mapping.assetId);
    const trackLabel = mapping.originalFilename || mapping.areaName;

    if (currentTrackPath === trackId) {
        console.log("[FL Genius Loci] It is the same custom track as before!");
        return Promise.resolve();
    }

    console.log(`Playing custom track ${trackLabel} for ${mapping.areaName} (${mapping.areaId})`);
    currentTrackPath = trackId;

    return Promise.resolve(trackPlayer.playCustomTrack(mapping.assetId))
        .then(() => announceTrack(trackLabel))
        .catch((error) => {
            if (currentTrackPath === trackId) {
                currentTrackPath = null;
            }

            Promise.resolve(trackPlayer.stop())
                .catch((stopError) => console.error(`[FL Genius Loci] Failed to stop audio after custom playback failure: ${stopError}`));
            announceTrack(ExtensionSettings.ui.failedTrackLabel);
            throw error;
        });
}

function handleLocationChanged(request) {
    const location = request.location || UNKNOWN;
    const customMapping = findCustomAreaMapping(request.areaId);

    currentLocation = customMapping ? customMapping.areaName : location;
    updateBadgeTooltip();

    if (customMapping) {
        playCustomAreaMapping(customMapping)
            .catch((error) => {
                console.error(`[FL Genius Loci] Failed to play custom track: ${error}`);
                announceCustomAreaAssignmentError(customMapping, error);
            });
        return;
    }

    console.debug(`[FL Genius Loci] Find track for "${location}"`);

    // Doesn't make sense to search for a track that we definitely will not find
    if (location !== UNKNOWN) {
        findTrackForLocation(location)
            .then(trackPath => {
                if (currentTrackPath !== trackPath) {
                    console.log(`Playing track ${trackPath}`)

                    trackPlayer.playTrack(trackPath)
                        .then(() => announceTrack(trackPath))
                        .catch(() => announceTrack(ExtensionSettings.ui.failedTrackLabel))

                    currentTrackPath = trackPath;
                } else {
                    console.log("[FL Genius Loci] It is the same track as before!");
                }
            })
            .catch((error) => {
                console.log(`Something went wrong: ${error}`);

                trackPlayer.stop();

                announceTrack(ExtensionSettings.ui.noTrackLabel);
            })
    }
}

function saveCustomAreaAssignment(request, sendResponse) {
    CustomAudioStore.saveAreaAssignment({
        areaId: request.areaId,
        areaName: request.areaName,
        fileData: request.fileData,
    })
        .then((mapping) => {
            customAreaMappings[mapping.areaId] = mapping;
            currentLocation = mapping.areaName;
            updateBadgeTooltip();
            sendMappingToAllTabs();

            return playCustomAreaMapping(mapping)
                .then(() => sendResponse({ok: true, mapping: mapping}))
                .catch((error) => {
                    const message = `Assignment saved, but the audio could not be played: ${error}`;
                    console.error(`[FL Genius Loci] ${message}`);
                    announceCustomAreaAssignmentError(mapping, message);
                    sendResponse({ok: false, mapping: mapping, error: message});
                });
        })
        .catch((error) => {
            console.error(`[FL Genius Loci] Failed to save custom area assignment: ${error}`);
            sendResponse({ok: false, error: String(error)});
        });
}

ExtensionApi.onRuntimeMessage((request, sender, sendResponse) => {
    if (request.action === ExtensionMessages.runtime.hello) {
        if (!flTabs.includes(sender.tab.id)) {
            flTabs.push(sender.tab.id);
        }

        runtimeStateReady.then(() => sendStartupStateToTab(sender.tab.id));
    }

    if (request.action === ExtensionMessages.runtime.toggleMute) {
        runtimeStateReady.then(() => toggleMute());
    }

    if (request.action === ExtensionMessages.runtime.volumeChanged) {
        runtimeStateReady.then(() => setVolume(request.volume));
    }

    if (request.action === ExtensionMessages.runtime.settingChanged) {
        console.debug(`[FL Genius Loci] Set setting to "${request.setting}"`);
        currentSetting = request.setting;
        updateBadgeTooltip();
        sendResponse({});
    }

    if (request.action === ExtensionMessages.runtime.locationChanged) {
        runtimeStateReady.then(() => handleLocationChanged(request));
    }

    if (request.action === ExtensionMessages.runtime.saveCustomAreaAssignment) {
        runtimeStateReady.then(() => saveCustomAreaAssignment(request, sendResponse));
        return true;
    }
});

ExtensionApi.onTabRemoved((tabId) => {
    const index = flTabs.indexOf(tabId);
    if (index !== -1) {
        flTabs.splice(index, 1);
    }

    if (flTabs.length === 0) {
        currentTrackPath = null;

        trackPlayer.stop();

        updateBadgeTooltip();
    }
});

function rediscoverFallenLondonTabs() {
    ExtensionApi.queryTabs(
        {url: ExtensionSettings.fallenLondonTabUrlPattern},
        (tabs) => {
            flTabs = tabs.map((tab) => tab.id);
            flTabs.map((tabId) => sendStartupStateToTab(tabId));
        }
    );
}

// Eagerly load mappings
externalMapping.then(() => console.debug("[FL Genius Loci] Mappings loaded."));

runtimeStateReady.then(() => rediscoverFallenLondonTabs());

ExtensionApi.onActionClicked((tab) => {
    runtimeStateReady.then(() => toggleMute());
});
