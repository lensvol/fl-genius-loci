console.log("Content script started.");

var s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener("LocationChanged", function (event) {
    chrome.runtime.sendMessage({action: "location", location: event.detail.location}, (response) => {
        if (response.track != null) {
            console.debug(`Playing: ${response.track}`);
        } else {
            console.debug("No track is playing at the moment.");
        }
    });
});

chrome.runtime.sendMessage({action: "hello"}, (response) => {});
