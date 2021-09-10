console.log("Content script started.");

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
            console.debug("No track should be playing at the moment.");
        } else if (response.track === undefined) {
            console.debug("Trying to determine right track...");
            message = "Detecting...";
        } else {
            console.debug(`Playing: ${response.track}`);
            message = response.track.replace("tracks/", "");
        }
        debugger;
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

document.addEventListener("FL_GL_geniusLociInjected", (event) => {
    chrome.runtime.sendMessage({action: "FL_GL_hello"}, (mapping) => {
        const settingsEvent = new CustomEvent("setMapping", {
            detail: {
                settings: mapping.settings,
                areas: mapping.areas,
            }
        });
        document.dispatchEvent(settingsEvent);
    });
});
