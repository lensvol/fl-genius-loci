console.log("Content script started.");

var s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

let trackMapping = {
    "New Newgate": "01 New Newgate.mp3",
    "University": "02 An Embassy Waltz.mp3",
    "Ladybones Road": "02 An Embassy Waltz.mp3",
    "Labyrinth of Tigers": "03 Labyrinth of Tigers.mp3",
    "Forgotten Quarter": "03 Labyrinth of Tigers.mp3",
    "House of Chimes": "04 House of Chimes.mp3",
    "Mutton Island": "05 Peligin and Pearl.mp3",
    "Corpsecage Island": "05 Peligin and Pearl.mp3",
    "Grunting Fen": "05 Peligin and Pearl.mp3",
    "Poring over the Maps": "05 Peligin and Pearl.mp3",
    "Your Cabin": "05 Peligin and Pearl.mp3",
    "Home Waters": "05 Peligin and Pearl.mp3",
    "Shepherd's Wash": "05 Peligin and Pearl.mp3",
    "Sea of Voices": "05 Peligin and Pearl.mp3",
    "Salt Steppes": "05 Peligin and Pearl.mp3",
    "Snares": "05 Peligin and Pearl.mp3",
    "Pillared Sea": "05 Peligin and Pearl.mp3",
    "Stormbones": "05 Peligin and Pearl.mp3",
    "Mrs Plenty's Carnival": "06 Mrs Plenty's Carnival.mp3",
    "Heartscross House": "",
    "Court of the Wakeful Eye": "",
    // A boat trip
    "Spite": "07 Crowds of Spite.mp3",
    "Bazaar Side-Streets": "07 Crowds of Spite.mp3",
    // "": "08 About your Business.mp3",
    // Avid Horizon (???)
    // "": "09 Where We Went.mp3",
    "Mahogany Hall": "10 Carnival at Midnight.mp3",
    // A state of some confusion
    "Veilgarden": "11 Veilgarden Last Call.mp3",
    "State of Confusion": "11 Veilgarden Last Call.mp3",
    "Empress' Court": "12 Empress at the Window.mp3",
    "Hunter's Keep": "13 Hunter's Keep.mp3",
    // Parabola: jungle_orange
    // The Mirror-Marches: jungle_orange
    "Parabola": "14 Before the Mirror.mp3",
    "Foreign Office": "15 Matters of State.mp3",
    // "": "16 The Appointed Place.mp3",
    // "": "17 A Sundered Sea.mp3",
    // Cave of Nadir
    "Cave of Nadir": "18 Irrigo Below.mp3",
    // Flute Street
    "Flute Street": "19 Something of a Fluke.mp3",
    "Dept. of Menace Eradication": "20 The Department of Menace Eradication.mp3",
    // Tomb-Colonies (???)
    // "": "21 St Arthur's Candle.mp3",
    // "": "22 Why We Wear Faces.mp3",
}

let currentAudio = new Audio();
let currentTrackPath = "";
currentAudio.addEventListener("ended", function () {
    // TODO: Re-start track when it ends
})

window.addEventListener("LocationChanged", function (event) {
    console.log(`New location: ${event.detail.name} (${event.detail.areaId})`);

    let location = event.detail.location

    if (location in trackMapping && trackMapping[location] !== "") {
        console.log(`Playing track ${trackMapping[location]} for ${location}`)
        let trackLocation = chrome.runtime.getURL("tracks/" + trackMapping[location]);

        if (currentTrackPath !== trackLocation) {
            currentTrackPath = trackLocation;
            currentAudio.pause()
            currentAudio.src = chrome.runtime.getURL("tracks/" + trackMapping[location]);
            currentAudio.play()
        } else {
            console.log("It is the same track as one playing now!")
        }
    } else {
        currentTrackPath = "";
        currentAudio.pause();
    }
})