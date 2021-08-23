console.log("Content script started.");

var s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener("LocationChanged", function (event) {
    console.debug("Passing message to background worker...");
    chrome.runtime.sendMessage({location: event.detail.location}, (response) => {
        console.debug(`Playing: ${response.track}`);
    });
})