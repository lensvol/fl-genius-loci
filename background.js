let currentAudio = new Audio();
let currentSetting = null;
let currentTrackUrl = "";

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
                let trackLocation = null;
                if (location in mapping.tracks && mapping.tracks[location] !== "") {
                    trackLocation = chrome.runtime.getURL("tracks/" + mapping.tracks[location]);
                    console.debug(`Selecting track ${trackLocation} for "${location} (${setting})"`);
                } else if (currentSetting in mapping && mapping.tracks[currentSetting] !== "") {
                    trackLocation = chrome.runtime.getURL("tracks/" + mapping.tracks[currentSetting]);
                    console.debug(`Location unknown, selecting track ${trackLocation} for setting "${currentSetting}"`);
                }

                if (trackLocation != null) {
                    resolve(trackLocation);
                } else {
                    reject("No appropriate track found.");
                }
            })
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FL_GL_hello") {
        if (!flTabs.includes(sender.tab.id)) {
            flTabs.push(sender.tab.id);
        }

        externalMapping.then(value => sendResponse(value));
    }

    if (request.action === "FL_GL_setting") {
        currentSetting = request.setting;
    }

    if (request.action === "FL_GL_location") {
        let location = request.location

        findTrackForLocation(currentSetting, location)
            .then(trackUrl => {
                if (currentTrackUrl !== trackUrl) {
                    console.log(`Playing track ${trackUrl}`)

                    currentAudio.pause();
                    currentAudio.loop = true;
                    currentAudio.src = trackUrl;
                    currentAudio.play()
                } else {
                    console.log("It is the same track as before!");
                }
                sendResponse({track: trackUrl});
            })
            .catch((error) => {
                console.log(`Something went wrong: ${error}`);

                currentAudio.pause();
                currentAudio.src = "";

                sendResponse({track: null});
            })

        sendResponse({});
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    if (flTabs.includes(activeInfo.tabId)) {
        currentAudio.play();
    } else {
        currentAudio.pause();
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    let index = flTabs.indexOf(tabId);
    if (index !== -1) {
        flTabs.splice(index, 1);
    }

    if (flTabs.length === 0) {
        currentAudio.pause();
        currentAudio.src = "";
    }
});