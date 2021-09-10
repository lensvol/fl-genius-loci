(function () {
    console.log("Starting injected script.");

    function createButton(icon, title) {
        let buttonlet = document.createElement("button");
        buttonlet.setAttribute("type", "button");
        buttonlet.className = "buttonlet-container";

        let outerSpan = document.createElement("span");
        outerSpan.classList.add("buttonlet", "fa-stack", "fa-lg", "buttonlet-enabled");
        outerSpan.setAttribute("title", title);
        outerSpan.style.cssText = "color: #ada086";

        [
            ["fa", "fa-circle", "fa-stack-2x"],
            ["fa", "fa-inverse", "fa-stack-1x", `fa-${icon}`],
            ["u-visually-hidden"]
        ].map(classNames => {
            let span = document.createElement("span");
            span.classList.add(...classNames);
            outerSpan.appendChild(span);
        })

        buttonlet.appendChild(outerSpan);
        return buttonlet;
    }

    function createLocatorPanel() {
        const stripeDiv = document.createElement("div");
        stripeDiv.classList.add("top-stripe");//, "u-visually-hidden");

        const containerDiv = document.createElement("div");
        containerDiv.classList.add("top-stripe__inner-container");

        const areaDiv = document.createElement("div");
        areaDiv.style.cssText = "display: flex; align-items: center;";
        const areaLabel = document.createElement("span");
        areaLabel.style.cssText = "margin-right: 6px";
        areaLabel.innerText = 'Area: '
        const areaText = document.createElement("b");
        areaText.setAttribute("id", "current-area-text");
        areaText.innerText = "Unknown";
        areaDiv.appendChild(areaLabel);
        areaDiv.appendChild(areaText);

        const settingDiv = document.createElement("div");
        settingDiv.style.cssText = "display: flex; align-items: center;";
        const settingLabel = document.createElement("span");
        settingLabel.style.cssText = "margin-right: 6px";
        settingLabel.innerText = 'Setting:'
        const settingText = document.createElement("b");
        settingText.setAttribute("id", "current-setting-text");
        settingText.innerText = "Unknown";
        settingDiv.appendChild(settingLabel);
        settingDiv.appendChild(settingText);

        const trackDiv = document.createElement("div");
        trackDiv.style.cssText = "display: flex; align-items: center;";
        const trackLabel = document.createElement("span");
        trackLabel.style.cssText = "margin-right: 6px";
        trackLabel.innerText = "Track:"
        const trackText = document.createElement("b");
        trackText.setAttribute("id", "current-setting-text");
        trackText.innerText = "None assigned";
        trackDiv.appendChild(trackLabel);
        trackDiv.appendChild(trackText);

        containerDiv.appendChild(settingDiv);
        containerDiv.appendChild(areaDiv);
        containerDiv.appendChild(trackDiv);
        stripeDiv.appendChild(containerDiv);

        stripeDiv.setAttribute("id", "locator");

        return {locatorPanel: stripeDiv, settingDisplay: settingText, areaDisplay: areaText, trackDisplay: trackText};
    }

    const {locatorPanel, settingDisplay, areaDisplay, trackDisplay} = createLocatorPanel();

    function updateLocatorArea(name, areaId) {
        areaDisplay.innerText = `${name} (ID: ${areaId})`;
    }

    function updateLocatorSetting(setting, settingId) {
        settingDisplay.innerText = `${setting} (ID: ${settingId})`;
    }

    function updateLocatorTrack(trackPath) {
        settingDisplay.innerText = `${trackPath})`;
    }

    function toggleLocatorPanel() {
        if (locatorPanel.classList.contains("u-visually-hidden")) {
            console.debug("Showing locator panel...");
            locatorPanel.classList.remove("u-visually-hidden");
        } else {
            console.debug("Hiding locator panel...");
            locatorPanel.classList.add("u-visually-hidden");
        }
    }

    const originalAjaxOpen = XMLHttpRequest.prototype.open;
    const originalSetRequest = XMLHttpRequest.prototype.setRequestHeader;
    const DONE = 4;
    window.interceptor = true;

    let authToken = "";

    let SETTING_IDS_TO_LOCATION = {};
    let currentSetting = "UNKNOWN";

    let AREA_IDS_TO_LOCATION = {}
    let currentArea = "UNKNOWN";

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
                            currentArea = AREA_IDS_TO_LOCATION[area.id];
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
                updateLocatorSetting(newSetting, settingId);
                notifySettingChanged(newSetting);
            }
            if (newArea !== "UNKNOWN") {
                updateLocatorArea(newArea, areaId);
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

    document.addEventListener("FL_GL_setMapping", (event) => {
        SETTING_IDS_TO_LOCATION = event.detail.settings;
        AREA_IDS_TO_LOCATION = event.detail.areas;

        console.debug("Mappings received, setting up API interceptors...")
        XMLHttpRequest.prototype.open = openBypass(XMLHttpRequest.prototype.open);
        XMLHttpRequest.prototype.setRequestHeader = installAuthSniffer(XMLHttpRequest.prototype.setRequestHeader);
    });

    document.addEventListener("FL_GL_track", (event) => {
        debugger;
        trackDisplay.innerText = event.detail.message;
    });

    document.dispatchEvent(new CustomEvent("FL_GL_geniusLociInjected"));

    const buttonInsertObserver = new MutationObserver((mutations, observer) => {
        for (let m = 0; m < mutations.length; m++) {
            let mutation = mutations[m];

            for (let n = 0; n < mutation.addedNodes.length; n++) {
                let node = mutation.addedNodes[n];

                if (node.nodeName.toLowerCase() === "div") {
                    const topStripe = node.querySelector("div[class='top-stripe__inner-container']");

                    if (topStripe) {
                        console.debug("Disconnecting observer.")
                        observer.disconnect();

                        console.debug("Top stripe found!");
                        const locatorButtonDiv = document.createElement("div");
                        locatorButtonDiv.style.cssText = "display: flex; align-items: flex-end;";
                        const locatorButton = createButton("music", "Toggle locator panel");
                        locatorButton.addEventListener("click", (event) => toggleLocatorPanel());
                        locatorButtonDiv.appendChild(locatorButton);

                        console.debug("Inserting button...");
                        topStripe.insertBefore(locatorButtonDiv, topStripe.firstChild.nextSibling);

                        topStripe.parentElement.parentElement.insertBefore(locatorPanel, topStripe.parentElement.nextSibling);

                        console.debug("Reconnecting observer.")
                        observer.observe(document, {childList: true, subtree: true});
                    }
                }
            }
        }
    });


    buttonInsertObserver.observe(document, {childList: true, subtree: true});
}())