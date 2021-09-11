console.log("[FL Genius Loci] Content script started.");

const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener("FL_GL_LocationChanged", (event) => {
    chrome.runtime.sendMessage({
        action: "FL_GL_location",
        location: event.detail.location,
    }, (response) => {
        let message = "None assigned";
        if (response.track === null) {
            console.debug("[FL Genius Loci] No track should be playing at the moment.");
        } else if (response.track === undefined) {
            console.debug("[FL Genius Loci] Trying to determine right track...");
            message = "Detecting...";
        } else {
            console.debug(`Playing: ${response.track}`);
            message = response.track.replace("tracks/", "");
        }
        const settingsEvent = new CustomEvent("FL_GL_track", {
            detail: {
                message: message,
            }
        });
        document.dispatchEvent(settingsEvent);
    });
});

window.addEventListener("FL_GL_SettingChanged", (event) => {
    chrome.runtime.sendMessage({
        action: "FL_GL_setting",
        setting: event.detail.setting
    }, () => {});
});

document.addEventListener("FL_GL_geniusLociInjected", () => {
    chrome.runtime.sendMessage({action: "FL_GL_hello"});
});

document.addEventListener("FL_GL_toggleMute", () => {
    chrome.runtime.sendMessage({action: "FL_GL_toggleMute"});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "setMapping") {
        const settingsEvent = new CustomEvent("FL_GL_setMapping", {
            detail: {
                settings: message.mapping.settings,
                areas: message.mapping.areas,
            }
        });
        document.dispatchEvent(settingsEvent);
    } else if (message.action === "muteStatus") {
        const settingsEvent = new CustomEvent("FL_GL_muteStatus", {
            detail: {
                isMuted: message.isMuted,
            }
        });
        document.dispatchEvent(settingsEvent);
    }
})