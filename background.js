const UNKNOWN = "UNKNOWN";

const trackPlayer = new TrackPlayer();

let currentSetting = null;
let currentLocation = null;
let currentTrackPath = "";
let isMuted = false;
let flTabs = [];

const externalMapping = new Promise((resolve, reject) => {
    fetch(chrome.runtime.getURL("mappings.json"))
        .then((response) => response.json())
        .then((mappings) => {
            console.log("Loaded 'mappings.json'.");
            if (mappings.tracks === undefined || mappings.settings === undefined || mappings.areas === undefined) {
                console.error("Malformed 'mappings.json': Keys 'tracks', 'settings' and 'areas' should be present.");
                resolve({tracks: {}, settings: {}, areas: {}});
            }

            const existingTracks = new Set();
            for (const location in mappings.tracks) {
                if (mappings.tracks[location]) {
                    existingTracks.add(mappings.tracks[location]);
                }
            }

            resolve(mappings);
        })
        .catch((reason) => console.error(reason));
})

function findTrackForLocation(setting, location) {
    return new Promise((resolve, reject) => {
        externalMapping
            .then(mapping => {
                if (location in mapping.tracks && mapping.tracks[location] !== "") {
                    console.debug(`[FL Genius Loci] Selecting track ${mapping.tracks[location]} for "${location} (${currentSetting})"`);
                    resolve(mapping.tracks[location]);
                } else if (currentSetting in mapping.tracks && mapping.tracks[currentSetting] !== "") {
                    console.debug(`[FL Genius Loci] Location unknown, selecting track ${mapping.tracks[currentSetting]} for setting "${currentSetting}"`);
                    resolve(mapping.tracks[currentSetting]);
                }

                reject("No appropriate track found.");
            })
    });
}

function updateBadgeTooltip() {
    chrome.browserAction.setBadgeText({text: isMuted ? "MUTE" : ""}, () => {});
    chrome.browserAction.setBadgeBackgroundColor({color: isMuted ? "red" : "black"});

    chrome.browserAction.setTitle({"title": `Setting: ${currentSetting}\nLocation: ${currentLocation}`}, () => {});
}

function broadcastMuteStatus() {
    flTabs.map((tabId) => chrome.tabs.sendMessage(tabId, {action: "muteStatus", isMuted: isMuted}));
}

function toggleMute() {
    isMuted = !isMuted;
    updateMuteStatus();
}

function updateMuteStatus() {
    if (isMuted) {
        trackPlayer.mute();
    } else {
        trackPlayer.unmute();
    }

    updateBadgeTooltip();
    broadcastMuteStatus();

    localStorage.setItem("fl_gl_muteStatus", isMuted ? "on" : "off");
}

function announceTrack(text) {
    flTabs.map((tabId) => chrome.tabs.sendMessage(tabId, {action: "track", track: text}));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FL_GL_hello") {
        if (!flTabs.includes(sender.tab.id)) {
            flTabs.push(sender.tab.id);
        }

        chrome.tabs.sendMessage(sender.tab.id, {action: "muteStatus", isMuted: isMuted});
        externalMapping.then(value => {
            console.debug(`[FL Genius Loci] Sending value mapping to tab ${sender.tab.id}...`);
            chrome.tabs.sendMessage(sender.tab.id, {action: "setMapping", mapping: value});
        });
    }

    if (request.action === "FL_GL_toggleMute") {
        toggleMute();
    }

    if (request.action === "FL_GL_setting") {
        console.debug(`[FL Genius Loci] Set setting to "${request.setting}"`);
        currentSetting = request.setting;
        updateBadgeTooltip();
        sendResponse({});
    }

    if (request.action === "FL_GL_location") {
        let location = request.location;
        currentLocation = location;
        updateBadgeTooltip();

        console.debug(`[FL Genius Loci] Find track for "${request.location}"`);

        // Doesn't make sense to search for a track that we definitely will not find
        if (location !== UNKNOWN) {
            findTrackForLocation(currentSetting, location)
                .then(trackPath => {
                    if (currentTrackPath !== trackPath) {
                        console.log(`Playing track ${trackPath}`)

                        trackPlayer.playTrack(trackPath)
                            .then(() => announceTrack(trackPath))
                            .catch(() => announceTrack("Failed to load"))

                        currentTrackPath = trackPath;
                    } else {
                        console.log("[FL Genius Loci] It is the same track as before!");
                    }
                })
                .catch((error) => {
                    console.log(`Something went wrong: ${error}`);

                    trackPlayer.stop();

                    announceTrack("None assigned");
                })
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
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

chrome.tabs.query(
    {url: "*://*.fallenlondon.com/*"},
    (tabs) => tabs.map((tab) => flTabs.push(tab.id))
);

isMuted = localStorage.getItem("fl_gl_muteStatus") === "on" || false;
updateMuteStatus();

// Eagerly load mappings
externalMapping.then(() => console.debug("[FL Genius Loci] Mappings loaded."));

chrome.browserAction.onClicked.addListener((tab) => {
    toggleMute();
});
