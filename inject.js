(function() {
    console.log("Starting injected script.");

    const originalAjaxOpen = XMLHttpRequest.prototype.open;
    const originalSetRequest = XMLHttpRequest.prototype.setRequestHeader;
    const DONE = 4;

    window.interceptor = true;

    let authToken = "";

    // <div style="display: flex; align-items: flex-end;">
    //     <span><i className="fa fa-map-marker" aria-hidden="true"></i>&nbsp;<b>Mutton Island</b>&nbsp;<i>(ID: 38)</i></span>
    // </div>

    let SETTING_IDS_TO_LOCATION = {
        2: "Fifth City",
        4: "Death",
        10: "Parabola",
        16: "Southern Archipelago",
        19: "An Elaborate Party",
        106005: "Laboratory",
        107954: "Working with the Clay Highwayman",
        107941: "Upper River",
        104028: "Port Carnelian",
        104684: "Elder Continent",
        107959: "Khanate (Copper Quarter)",
        107955: "Khanate (Inner)",
        107950: "Under Parabolan Ice",
        107951: "Aboard, at Port",
        107952: "Zailing the Unterzee",
    };

    let AREA_IDS_TO_LOCATION = {
        2: "Your Lodgings",
        3: "Wolfstack Docks",
        6: "Veilgarden",
        14: "A boat trip",
        111073: "Singing Mandrake",
        23: "University",
        46: "Mind of a Long-Dead God",
        111064: "Clay Quarters",
        111065: "Moloch Street",
        111066: "Concord Square",
        111072: "Dept. of Menace Eradication",
        111153: "Adulterine Castle",
        111157: "Home Waters",
        111158: "Shepherd's Wash",
        111159: "Sea of Voices",
        111160: "Salt Steppes",
        111187: "Snares",
        111161: "Pillared Sea",
        111162: "Stormbones",
        111182: "Clay Highwayman's Camp",
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
        111138: "Bone Market",
        111141: "Balmoral",
        111094: "Magistracy of the Evenlode",
        111092: "Ealing Gardens",
        111145: "Hurlers",
        111149: "Moulin",
        111146: "Marigold Station",
        111143: "Burrow-Infra-Mump",
    }

    let currentArea = "UNKNOWN";
    let currentSetting = "UNKNOWN";

    function notifyLocationChanged(newLocation) {
        let event = new CustomEvent("FL_GL_LocationChanged", {
            detail: {location: newLocation}
        })
        window.dispatchEvent(event);
    }

    function notifySettingChanged(newSetting) {
        let event = new CustomEvent("FL_GL_SettingChanged", {
            detail: {setting: newSetting}
        })
        window.dispatchEvent(event);
    }

    function parseResponse(response) {
        if (this.readyState === DONE) {
            // TODO: Proper URL matching
            let areaId = null;
            let areaName = null;
            let settingId = null;
            let settingName = null;

            let targetUrl = response.currentTarget.responseURL;

            if (!((targetUrl.includes("/api/map") || targetUrl.includes("/choosebranch") || targetUrl.includes("/myself")) && targetUrl.includes("fallenlondon"))) {
                return;
            }

            let data = JSON.parse(response.target.responseText);
            if (targetUrl.includes("/api/map") && !data.isSuccess) {
                console.log("Map cannot be accessed, detecting through user info...")

                userRequest = new XMLHttpRequest();
                userRequest.open = originalAjaxOpen;
                userRequest.setRequestHeader = originalSetRequest;

                userRequest.open("GET", "https://api.fallenlondon.com/api/login/user", true);
                userRequest.setRequestHeader("Authorization", authToken);
                userRequest.addEventListener("readystatechange", (userResponse) => {
                    if (userRequest.readyState === DONE && userRequest.status === 200) {
                        console.debug("User info received!");

                        let userData = JSON.parse(userResponse.target.responseText);
                        let area = userData.area;
                        if (area.id in AREA_IDS_TO_LOCATION) {
                            console.log(`User is now at ${area.name} (ID: ${area.id})`);
                            currentArea = AREA_IDS_TO_LOCATION[area.id]
                            notifyLocationChanged(currentArea);
                        } else {
                            console.log("User location is unknown, falling back to setting.");
                            notifyLocationChanged("UNKNOWN");
                        }
                    }
                })
                userRequest.send();
                return;
            }

            if (targetUrl.endsWith("/myself")) {
                settingId = data.character.setting.id;
                settingName = data.character.setting.name;
                console.log(`Current setting is ${settingName} (ID: ${settingId})`);
            }

            if (targetUrl.endsWith("/api/map")) {
                areaId = data["currentArea"].id;
                areaName = data["currentArea"].name;
                console.log(`We are at ${data["currentArea"].name} (ID: ${data["currentArea"].id})`);
            } else if (targetUrl.endsWith("/api/map/move")) {
                areaId = data["area"].id;
                areaName = data["area"].name;
                console.log(`We moved to ${data["area"].name} (ID: ${data["area"].id})`);
            } else if (targetUrl.endsWith("/api/storylet/choosebranch")) {
                if ("messages" in data) {
                    data.messages.forEach((message) => {
                        if ("area" in message) {
                            areaId = message.area.id;
                            areaName = message.area.name;

                            console.log(`We transitioned to ${areaName} (${areaId})`);
                        } else if ("setting" in message) {
                            settingId = message.setting.id;
                            settingName = message.setting.name;

                            console.log(`New setting: ${settingName} (${settingId})`);
                        }
                    })
                }
            }

            let newSetting = "UNKNOWN";
            let newArea = "UNKNOWN";

            if (settingId in SETTING_IDS_TO_LOCATION) {
                if (currentSetting !== SETTING_IDS_TO_LOCATION[settingId]) {
                    currentSetting = newSetting = SETTING_IDS_TO_LOCATION[settingId];
                }
            } else {
                newSetting = "UNKNOWN";
            }

            if (areaId in AREA_IDS_TO_LOCATION) {
                if (currentArea !== AREA_IDS_TO_LOCATION[areaId]) {
                    currentArea = newArea = AREA_IDS_TO_LOCATION[areaId];
                }
            } else {
                newArea = "UNKNOWN";
            }

            if (newSetting !== "UNKNOWN") {
                notifySettingChanged(newSetting);
            }
            if (newArea !== "UNKNOWN") {
                notifyLocationChanged(newArea);
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
            this.addEventListener("readystatechange", parseResponse);
            return original_function.apply(this, arguments);
        };
    }

    function installAuthSniffer(original_function) {
        return function (name, value) {
            if (name === "Authorization" && value !== authToken) {
                authToken = value;
                console.debug("Got FL auth token!");
            }
            return original_function.apply(this, arguments);
        }
    }

    document.addEventListener("setMapping", (event) => {
        SETTING_IDS_TO_LOCATION = event.detail.settings;
        AREA_IDS_TO_LOCATION = event.detail.areas;

        console.debug("Mappings received, setting up API interceptors...")
        XMLHttpRequest.prototype.open = openBypass(XMLHttpRequest.prototype.open);
        XMLHttpRequest.prototype.setRequestHeader = installAuthSniffer(XMLHttpRequest.prototype.setRequestHeader);
    });

    document.dispatchEvent(new CustomEvent("FL_GL_geniusLociInjected"));
}())