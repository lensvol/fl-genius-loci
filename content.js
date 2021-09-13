console.log("[FL Genius Loci] Content script started.");

const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

function sendToPage(action, detail) {
    window.postMessage({
        action: action,
        ...detail
    }, "https://www.fallenlondon.com");
}

window.addEventListener("FL_GL_LocationChanged", (event) => {
    chrome.runtime.sendMessage({
        action: "FL_GL_location",
        location: event.detail.location,
    }, (response) => {
        if (response === undefined) {
            // FIXME: What is this even
            return;
        }

        let message = "None assigned";
        if (response.track === null) {
            console.debug("[FL Genius Loci] No track should be playing at the moment.");
        } else if (response.track === undefined) {
            console.debug("[FL Genius Loci] Trying to determine right track...");
            message = "Detecting...";
        } else {
            console.debug(`[FL Genius Loci] Playing: ${response.track}`);
            message = response.track.replace("tracks/", "");
        }
        sendToPage("FL_GL_track", {message: message});
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
        sendToPage("FL_GL_setMapping", {
            settings: message.mapping.settings,
            areas: message.mapping.areas,
        });
    } else if (message.action === "muteStatus") {
        sendToPage("FL_GL_muteStatus", {
            isMuted: message.isMuted,
        });
    }
})