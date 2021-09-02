let currentAudio = new Audio();
let currentTrackUrl = "";

let flTabs = [];

const trackMapping = new Promise((resolve, reject) => {
    const mappingURL = chrome.runtime.getURL("mappings.json");

    fetch(mappingURL)
        .then(response => response.json())
        .then(mappings_json => resolve(mappings_json.tracks))
        .catch((reason) => {
            console.error(`Could not load mappings.json: ${reason}`);
            // We should not error out if we cannot load the mapping
            resolve({});
        })
})

function findTrackForLocation(setting, location) {
    return new Promise((resolve, reject) => {
        trackMapping
            .then(mapping => {
                let trackLocation = null;
                if (location in mapping && mapping[location] !== "") {
                    console.debug(`Selecting track ${trackLocation} for "${location} (${setting})"`);
                    trackLocation = chrome.runtime.getURL("tracks/" + mapping[location]);
                } else if (setting in mapping && mapping[setting] !== "") {
                    console.debug(`Location unknown, selecting track ${trackLocation} for setting "${setting}"`);
                    trackLocation = chrome.runtime.getURL("tracks/" + mapping[setting]);
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
    if (request.action === "hello") {
        if (!flTabs.includes(sender.tab.id)) {
            flTabs.push(sender.tab.id);
        }

        sendResponse();
    }

    if (request.action === "location") {
        let location = request.location
        let setting = request.setting

        findTrackForLocation(setting, location)
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