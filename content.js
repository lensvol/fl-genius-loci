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
    } else if (message.action === "track") {
        sendToPage("FL_GL_track", {
            track: (message.track || "None assigned").replace("tracks/", ""),
        });
    }
})