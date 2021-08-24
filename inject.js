(function() {
    console.log("Starting injected script.");

    window.interceptor = true;
    const DONE = 4;

    // <div style="display: flex; align-items: flex-end;">
    //     <span><i className="fa fa-map-marker" aria-hidden="true"></i>&nbsp;<b>Mutton Island</b>&nbsp;<i>(ID: 38)</i></span>
    // </div>

    const AREA_IDS_TO_LOCATION = {
        2: "Your Lodgings",
        3: "Wolfstack Docks",
        6: "Veilgarden",
        111073: "Singing Mandrake",
        23: "University",
        111064: "Clay Quarters",
        111065: "Moloch Street",
        111066: "Concord Square",
        111072: "Dept. of Menace Eradication",
        111157: "Home Waters",
        111158: "Shepherd's Wash",
        111159: "Sea of Voices",
        111160: "Salt Steppes",
        111187: "Snares",
        111161: "Pillared Sea",
        111162: "Stormbones",
        4: "Ladybones Road",
        28: "Labyrinth of Tigers",
        9: "Forgotten Quarter",
        34: "House of Chimes",
        31: "Bazaar Side-Streets",
        7: "Spite",
        4138: "Crowds of Spite",
        26: "Empress' Court",
        10: "Shuttered Palace",
        11: "Flit",
        18: "Mrs Plenty's Carnival",
        30: "Mahogany Hall",
        47: "Doubt Stree",
        42: "Wilmot's End",
        45: "Foreign Office",
        35: "Flute Street",
        37: "Hunter's Keep",
        38: "Mutton Island",
        48: "Bullbone Island",
        49: "Corpsecage Island",
        50: "Grunting Fen",
        17: "Disgraced Exile",
        25: "Venderbright",
        109643: "Tanah-Chook",
        58: "Iron Republic",
        36: "Broad Unterzee",
        // Setting: "Nadir"
        6709: "Cave of the Nadir",
        105438: "Heartscross House",
        111079: "Base Camp",
        111111: "Abbey Rock",
        111186: "Khan's Heart",
        111194: "Copper Quarter",
        111156: "Your Cabin",
        111185: "On Deck",
        111184: "Poring over the Maps",
        111082: "Blind Helmsman",
        110041: "Court of the Wakeful Eye",
        53: "Polythreme",
        // A boat trip
        // Veilgarden
        // A state of some confusion
    }

    var currentArea = null;

    function modifyResponse(response) {
        if (this.readyState === DONE) {
            // TODO: Proper URL matching
            let areaId = null;
            let areaName = null;

            let targetUrl = response.currentTarget.responseURL;

            if (!(targetUrl.includes("/api/map") && targetUrl.includes("fallenlondon"))) {
                return;
            }

            let data = JSON.parse(response.target.responseText);
            if (data["isSuccess"] !== true) {
                // TODO: Implement heuristics to detect special regions like Parabola or Nadir
                currentArea == null;
                let event = new CustomEvent("LocationChanged", {
                    detail: {location: "UNKNOWN"}
                })
                window.dispatchEvent(event);
                return;
            }

            if (targetUrl.endsWith("/api/map")) {
                areaId = data["currentArea"].id;
                areaName = data["currentArea"].name;
                console.log(`We are at ${data["currentArea"].name} (ID: ${data["currentArea"].id})`);
            } else if (targetUrl.endsWith("/api/map/move")) {
                areaId = data["area"].id;
                areaName = data["area"].name;
                console.log(`We moved to ${data["area"].name} (ID: ${data["area"].id})`);
            }

            let event = null;
            let newLocation = null;
            if (areaId in AREA_IDS_TO_LOCATION) {
                if (currentArea !== AREA_IDS_TO_LOCATION[areaId]) {
                    currentArea = newLocation = AREA_IDS_TO_LOCATION[areaId];
                }
            } else {
                newLocation = "UNKNOWN";
                currentArea = null;
            }

            if (newLocation != null) {
                event = new CustomEvent("LocationChanged", {
                    detail: {
                        location: newLocation
                    }
                });
                window.dispatchEvent(event);
                // chrome.runtime.sendMessage({location: newLocation}, (response) => {
                //     console.debug(`Playing: ${response.track}`);
                // });
            }
        }
    }

    /*
     HERE BE DRAGONS

     I would have really liked to just use `webRequest` API and modify the responses transparently,
     but until https://bugs.chromium.org/p/chromium/issues/detail?id=104058 is resolved that
     would have lead to more convoluted code base due to the need for separate interception
     mechanisms for both Chrome and Firefox (don't start me on Safari T_T).

     Solution taken from https://stackoverflow.com/a/41566077
     */
    function openBypass(original_function) {
        return function (method, url, async) {
            this.addEventListener("readystatechange", modifyResponse);
            return original_function.apply(this, arguments);
        };
    }

    XMLHttpRequest.prototype.open = openBypass(XMLHttpRequest.prototype.open);
}())