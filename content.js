console.log("Content script started.");

const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener("LocationChanged", function (event) {
    chrome.runtime.sendMessage({
        action: "location",
        location: event.detail.location,
        setting: event.detail.setting
    }, (response) => {
        if (response.track === null) {
            console.debug("No track should be playing at the moment.");
        } else if (response.track === undefined) {
            console.debug("Trying to determine right track...");
        } else {
            console.debug(`Playing: ${response.track}`);
        }
    });
});


chrome.runtime.sendMessage({action: "hello"}, () => {});
