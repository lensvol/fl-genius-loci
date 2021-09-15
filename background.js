let currentAudio = new Audio();
let currentSetting = null;
let currentLocation = null;
let currentTrackUrl = "";
let isMuted = false;
let flTabs = [];

const externalMapping = new Promise((resolve, reject) => {
    const mappingURL = chrome.runtime.getURL("mappings.json");

    fetch(mappingURL)
        .then(response => response.json())
        .then(mappings_json => resolve(mappings_json))
        .catch((reason) => {
            console.error(`Could not load mappings.json: ${reason}`);
            // We should not error out if we cannot load the mapping
            resolve({tracks: {}, settings: {}, areas: {}});
        })
})

function findTrackForLocation(setting, location) {
    return new Promise((resolve, reject) => {
        externalMapping
            .then(mapping => {
                if (location in mapping.tracks && mapping.tracks[location] !== "") {
                    console.debug(`[FL Genius Loci] Selecting track ${mapping.tracks[location]} for "${location} (${currentSetting})"`);
                    resolve(mapping.tracks[location])
                } else if (currentSetting in mapping && mapping.tracks[currentSetting] !== "") {
                    console.debug(`[FL Genius Loci] Location unknown, selecting track ${mapping.tracks[currentSetting]} for setting "${currentSetting}"`);
                    resolve(mapping.tracks[currentSetting])
                }

                reject("No appropriate track found.");
            })
    });
}

function updateBadgeTooltip() {
    chrome.browserAction.setTitle({"title": `Setting: ${currentSetting}\nLocation: ${currentLocation}`}, () => {});
}

function toggleMute() {
    if (isMuted) {
        isMuted = false;
        if (currentAudio.currentSrc !== "") {
            currentAudio.play();
        }
    } else {
        isMuted = true;
        currentAudio.pause();
    }
    chrome.browserAction.setBadgeText({text: isMuted ? "MUTE" : ""}, () => {
    });
    chrome.browserAction.setBadgeBackgroundColor({color: isMuted ? "#ff0000" : "#0000ff"});

    flTabs.map((tabId) => chrome.tabs.sendMessage(tabId, {action: "muteStatus", isMuted: isMuted}));
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
        currentSetting = request.setting;
        updateBadgeTooltip();
        sendResponse({});
    }

    if (request.action === "FL_GL_location") {
        let location = request.location;
        currentLocation = location;
        updateBadgeTooltip();

        findTrackForLocation(currentSetting, location)
            .then(trackPath => {
                flTabs.map((tabId) => chrome.tabs.sendMessage(tabId, {action: "track", track: trackPath}));
                return trackPath;
            })
            .then(trackPath => chrome.runtime.getURL("tracks/" + trackPath))
            .then(trackUrl => {
                if (currentTrackUrl !== trackUrl) {
                    console.log(`Playing track ${trackUrl}`)

                    currentAudio.pause();
                    currentAudio.loop = true;
                    currentAudio.src = trackUrl;

                    if (!isMuted) {
                        currentAudio.play();
                    }
                } else {
                    console.log("It is the same track as before!");
                }
            })
            .catch((error) => {
                console.log(`Something went wrong: ${error}`);

                currentAudio.pause();
                currentAudio.src = "";

                flTabs.map((tabId) => chrome.tabs.sendMessage(tabId, {action: "track", track: null}));
            })
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    const index = flTabs.indexOf(tabId);
    if (index !== -1) {
        flTabs.splice(index, 1);
    }
});

chrome.tabs.query(
    {url: "*://*.fallenlondon.com/*"},
    (tabs) => tabs.map((tab) => flTabs.push(tab.id))
);