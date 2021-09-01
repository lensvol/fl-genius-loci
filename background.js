let trackMapping = {
    "New Newgate": "Maribeth Solomon and Brent Barkman - Fallen London OST - 01 New Newgate.mp3",
    "University": "Maribeth Solomon and Brent Barkman - Fallen London OST - 02 An Embassy Waltz.mp3",
    "Laboratory": "Maribeth Solomon and Brent Barkman - Fallen London OST - 02 An Embassy Waltz.mp3",
    "Science Laboratory": "Maribeth Solomon and Brent Barkman - Fallen London OST - 02 An Embassy Waltz.mp3",
    "Ladybones Road": "Maribeth Solomon and Brent Barkman - Fallen London OST - 02 An Embassy Waltz.mp3",
    "Labyrinth of Tigers": "Maribeth Solomon and Brent Barkman - Fallen London OST - 03 Labyrinth of Tigers.mp3",
    "Forgotten Quarter": "Maribeth Solomon and Brent Barkman - Fallen London OST - 03 Labyrinth of Tigers.mp3",
    "House of Chimes": "Maribeth Solomon and Brent Barkman - Fallen London OST - 04 House of Chimes.mp3",
    "Mutton Island": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Corpsecage Island": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Grunting Fen": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Poring over the Maps": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Your Cabin": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Home Waters": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Shepherd's Wash": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Sea of Voices": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Salt Steppes": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Snares": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Pillared Sea": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Stormbones": "Maribeth Solomon and Brent Barkman - Fallen London OST - 05 Peligin and Pearl.mp3",
    "Mrs Plenty's Carnival": "Maribeth Solomon and Brent Barkman - Fallen London OST - 06 Mrs Plenty's Carnival.mp3",
    "Heartscross House": "",
    "Court of the Wakeful Eye": "",
    // A boat trip
    "Spite": "Maribeth Solomon and Brent Barkman - Fallen London OST - 07 Crowds of Spite.mp3",
    "Bazaar Side-Streets": "Maribeth Solomon and Brent Barkman - Fallen London OST - 07 Crowds of Spite.mp3",
    // "": "08 About your Business.mp3",
    // Avid Horizon (???)
    // "": "09 Where We Went.mp3",
    "Mahogany Hall": "Maribeth Solomon and Brent Barkman - Fallen London OST - 10 Carnival at Midnight.mp3",
    // A state of some confusion
    "Veilgarden": "Maribeth Solomon and Brent Barkman - Fallen London OST - 11 Veilgarden Last Call.mp3",
    "State of Confusion": "Maribeth Solomon and Brent Barkman - Fallen London OST - 11 Veilgarden Last Call.mp3",
    "Empress' Court": "Maribeth Solomon and Brent Barkman - Fallen London OST - 12 Empress at the Window.mp3",
    "Hunter's Keep": "Maribeth Solomon and Brent Barkman - Fallen London OST - 13 Hunter's Keep.mp3",
    // Parabola: jungle_orange
    // The Mirror-Marches: jungle_orange
    "Parabola": "Maribeth Solomon and Brent Barkman - Fallen London OST - 14 Before the Mirror.mp3",
    "Foreign Office": "Maribeth Solomon and Brent Barkman - Fallen London OST - 15 Matters of State.mp3",
    // "": "16 The Appointed Place.mp3",
    // "": "17 A Sundered Sea.mp3",
    // Cave of Nadir
    "Cave of the Nadir": "Maribeth Solomon and Brent Barkman - Fallen London OST - 18 Irrigo Below.mp3",
    // Flute Street
    "Flute Street": "Maribeth Solomon and Brent Barkman - Fallen London OST - 19 Something of a Fluke.mp3",
    "Dept. of Menace Eradication": "Maribeth Solomon and Brent Barkman - Fallen London OST - 20 The Department of Menace Eradication.mp3",
    // Tomb-Colonies (???)
    // "": "21 St Arthur's Candle.mp3",
    // "": "22 Why We Wear Faces.mp3",
    "Fifth City": "",
    "Upper River": "",
}

let currentAudio = new Audio();
let currentTrackPath = "";

let flTabs = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "hello") {
        console.log(`Tab ${sender.tab.id} opened!`);

        if (!flTabs.includes(sender.tab.id)) {
            flTabs.push(sender.tab.id);
        }

        sendResponse();
    }

    if (request.action === "location") {
        let location = request.location
        let setting = request.setting
        let trackLocation = null;

        if (location in trackMapping && trackMapping[location] !== "") {
            trackLocation = chrome.runtime.getURL("tracks/" + trackMapping[location]);
            console.debug(`Selecting track ${trackLocation} for "${location} (${setting})"`);
        } else if (setting in trackMapping && trackMapping[setting] !== "") {
            trackLocation = chrome.runtime.getURL("tracks/" + trackMapping[setting]);
            console.debug(`Location unknown, selecting track ${trackLocation} for setting "${setting}"`);
        }

        if (trackLocation != null) {
            console.log(`Playing track ${trackLocation}`);

            if (currentTrackPath !== trackLocation) {
                currentTrackPath = trackLocation;
                currentAudio.pause()
                currentAudio.loop = true;
                currentAudio.src = trackLocation;
                currentAudio.play()
            } else {
                console.log("It is the same track as one playing now!")
            }
        } else {
            currentTrackPath = "";
            currentAudio.pause();
        }

        sendResponse({track: currentTrackPath});
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
});