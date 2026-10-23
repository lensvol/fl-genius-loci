(function () {
    const UNKNOWN = ExtensionSettings.unknownLocation;

    console.log("[FL Genius Loci] Starting injected script.");

    function createButton(icon, title, color = ExtensionSettings.ui.fallbackButtonColor) {
        const buttonlet = document.createElement("button");
        buttonlet.setAttribute("type", "button");
        buttonlet.className = "buttonlet-container";

        const outerSpan = document.createElement("span");
        outerSpan.classList.add("buttonlet", "fa-stack", "fa-lg", "buttonlet-enabled");
        outerSpan.setAttribute("title", title);
        outerSpan.style.cssText = `color: ${color}`;
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
        stripeDiv.classList.add("top-stripe", "expandable");

        const containerDiv = document.createElement("div");
        containerDiv.classList.add("top-stripe__inner-container");

        const areaDiv = document.createElement("div");
        areaDiv.style.cssText = "display: flex; align-items: center;";
        const areaLabel = document.createElement("span");
        areaLabel.style.cssText = "margin-right: 6px";
        areaLabel.innerText = 'Area: '
        const areaText = document.createElement("b");
        areaText.setAttribute("id", "current-area-text");
        areaText.innerText = ExtensionSettings.ui.unknownLabel;
        areaDiv.appendChild(areaLabel);
        areaDiv.appendChild(areaText);

        const settingDiv = document.createElement("div");
        settingDiv.style.cssText = "display: flex; align-items: center;";
        const settingLabel = document.createElement("span");
        settingLabel.style.cssText = "margin-right: 6px";
        settingLabel.innerText = 'Setting:'
        const settingText = document.createElement("b");
        settingText.setAttribute("id", "current-setting-text");
        settingText.innerText = ExtensionSettings.ui.unknownLabel;
        settingDiv.appendChild(settingLabel);
        settingDiv.appendChild(settingText);

        const trackDiv = document.createElement("div");
        trackDiv.style.cssText = "display: flex; align-items: center;";
        const trackLabel = document.createElement("span");
        trackLabel.style.cssText = "margin-right: 6px";
        trackLabel.innerText = "Track:"
        const trackText = document.createElement("b");
        trackText.setAttribute("id", "current-track-text");
        trackText.innerText = ExtensionSettings.ui.noTrackLabel;
        trackDiv.appendChild(trackLabel);
        trackDiv.appendChild(trackText);

        const volumeDiv = document.createElement("div");
        volumeDiv.style.cssText = "display: flex; align-items: center;";
        const volumeLabel = document.createElement("span");
        volumeLabel.style.cssText = "margin-right: 6px";
        volumeLabel.innerText = "Volume:";
        const volumeSlider = document.createElement("input");
        volumeSlider.setAttribute("type", "range");
        volumeSlider.setAttribute("min", "0");
        volumeSlider.setAttribute("max", "100");
        volumeSlider.setAttribute("step", "1");
        volumeSlider.setAttribute("id", "current-volume-slider");
        volumeSlider.style.cssText = "width: 110px; margin-right: 6px;";
        const volumeText = document.createElement("b");
        volumeText.setAttribute("id", "current-volume-text");
        volumeDiv.appendChild(volumeLabel);
        volumeDiv.appendChild(volumeSlider);
        volumeDiv.appendChild(volumeText);

        const unknownAreaDiv = document.createElement("div");
        unknownAreaDiv.setAttribute("id", "unknown-area-notice");
        unknownAreaDiv.style.cssText = "display: none; align-items: flex-start; flex-direction: column; gap: 4px;";
        const unknownAreaText = document.createElement("span");
        unknownAreaDiv.appendChild(unknownAreaText);
        const unknownAreaCode = document.createElement("code");
        unknownAreaCode.style.cssText = "font-weight: bold;";
        unknownAreaDiv.appendChild(unknownAreaCode);
        const unknownAreaControls = document.createElement("div");
        unknownAreaControls.style.cssText = "display: flex; align-items: center; flex-wrap: wrap; gap: 6px;";
        const unknownAreaFileInput = document.createElement("input");
        unknownAreaFileInput.setAttribute("type", "file");
        unknownAreaFileInput.setAttribute("accept", ExtensionSettings.customAudio.inputAccept);
        unknownAreaFileInput.style.display = "none";
        unknownAreaDiv.appendChild(unknownAreaFileInput);
        const unknownAreaChooseFileButton = document.createElement("button");
        unknownAreaChooseFileButton.setAttribute("type", "button");
        unknownAreaChooseFileButton.innerText = "Choose Audio File";
        unknownAreaControls.appendChild(unknownAreaChooseFileButton);
        const unknownAreaSaveButton = document.createElement("button");
        unknownAreaSaveButton.setAttribute("type", "button");
        unknownAreaSaveButton.innerText = "Save Assignment";
        unknownAreaSaveButton.disabled = true;
        unknownAreaControls.appendChild(unknownAreaSaveButton);
        const unknownAreaCopyButton = document.createElement("button");
        unknownAreaCopyButton.setAttribute("type", "button");
        unknownAreaCopyButton.innerText = "Copy JSON";
        unknownAreaControls.appendChild(unknownAreaCopyButton);
        const unknownAreaDismissButton = document.createElement("button");
        unknownAreaDismissButton.setAttribute("type", "button");
        unknownAreaDismissButton.innerText = "Dismiss / Ignore";
        unknownAreaControls.appendChild(unknownAreaDismissButton);
        unknownAreaDiv.appendChild(unknownAreaControls);
        const unknownAreaFileDisplay = document.createElement("span");
        unknownAreaDiv.appendChild(unknownAreaFileDisplay);
        const unknownAreaStatus = document.createElement("span");
        unknownAreaDiv.appendChild(unknownAreaStatus);

        containerDiv.appendChild(settingDiv);
        containerDiv.appendChild(areaDiv);
        containerDiv.appendChild(trackDiv);
        containerDiv.appendChild(volumeDiv);
        containerDiv.appendChild(unknownAreaDiv);
        stripeDiv.appendChild(containerDiv);

        stripeDiv.setAttribute("id", "locator");

        return {
            locatorPanel: stripeDiv,
            settingDisplay: settingText,
            areaDisplay: areaText,
            trackDisplay: trackText,
            volumeSlider: volumeSlider,
            volumeDisplay: volumeText,
            unknownAreaNotice: unknownAreaDiv,
            unknownAreaDisplay: unknownAreaText,
            unknownAreaEntryDisplay: unknownAreaCode,
            unknownAreaFileInput: unknownAreaFileInput,
            unknownAreaChooseFileButton: unknownAreaChooseFileButton,
            unknownAreaSaveButton: unknownAreaSaveButton,
            unknownAreaFileDisplay: unknownAreaFileDisplay,
            unknownAreaStatus: unknownAreaStatus,
            unknownAreaCopyButton: unknownAreaCopyButton,
            unknownAreaDismissButton: unknownAreaDismissButton,
        };
    }

    const locatorButton = createButton("map-marker", "Toggle locator panel", ExtensionSettings.ui.buttonColor);
    const muteButton = createButton("volume-up", "Mute", ExtensionSettings.ui.buttonColor)
    const {
        locatorPanel,
        settingDisplay,
        areaDisplay,
        trackDisplay,
        volumeSlider,
        volumeDisplay,
        unknownAreaNotice,
        unknownAreaDisplay,
        unknownAreaEntryDisplay,
        unknownAreaFileInput,
        unknownAreaChooseFileButton,
        unknownAreaSaveButton,
        unknownAreaFileDisplay,
        unknownAreaStatus,
        unknownAreaCopyButton,
        unknownAreaDismissButton,
    } = createLocatorPanel();
    let isMuted = false;
    let currentVolume = ExtensionSettings.defaultVolume;
    let currentUnknownAreaEntry = "";
    let currentUnknownArea = null;
    let selectedUnknownAreaFile = null;
    const notifiedUnknownAreaIds = new Set();
    const customAssignmentErrorAreaIds = new Set();
    const supportedAudioExtensions = new Set(ExtensionSettings.customAudio.supportedExtensions);
    const supportedAudioTypes = new Set(ExtensionSettings.customAudio.supportedMimeTypes);

    function normalizeVolume(volume) {
        const parsedVolume = Number(volume);
        if (!Number.isFinite(parsedVolume)) {
            return ExtensionSettings.defaultVolume;
        }

        return Math.min(1, Math.max(0, parsedVolume));
    }

    function volumePercent(volume) {
        return Math.round(normalizeVolume(volume) * 100);
    }

    function updateMuteButton() {
        const buttonlet = muteButton.querySelector("span[class*='buttonlet']");
        const icon = muteButton.querySelector("span[class*='fa-inverse']");
        buttonlet.setAttribute("title", isMuted ? "Unmute" : "Mute");

        if (isMuted) {
            icon.classList.remove("fa-volume-up");
            icon.classList.add("fa-volume-off");
        } else {
            icon.classList.remove("fa-volume-off");
            icon.classList.add("fa-volume-up");
        }
    }

    function updateLocatorArea(name, areaId) {
        areaDisplay.innerText = `${name} (ID: ${areaId})`;
    }

    function updateLocatorSetting(setting, settingId) {
        settingDisplay.innerText = `${setting} (ID: ${settingId})`;
    }

    function updateLocatorTrack(track) {
        trackDisplay.innerText = track;
    }

    function updateVolume(volume) {
        currentVolume = normalizeVolume(volume);
        volumeSlider.value = volumePercent(currentVolume);
        volumeDisplay.innerText = `${volumePercent(currentVolume)}%`;
    }

    function suggestedAreaMappingEntry(areaId, areaName) {
        return `${JSON.stringify(String(areaId))}: ${JSON.stringify(String(areaName))}`;
    }

    function fileExtension(filename) {
        const normalizedFilename = String(filename || "").toLowerCase();
        const dotIndex = normalizedFilename.lastIndexOf(".");
        return dotIndex === -1 ? "" : normalizedFilename.slice(dotIndex);
    }

    function isSupportedAudioFile(file) {
        return Boolean(file)
            && (supportedAudioTypes.has(String(file.type || "").toLowerCase())
                || supportedAudioExtensions.has(fileExtension(file.name)));
    }

    function isWithinCustomAudioSizeLimit(file) {
        return Boolean(file) && file.size <= ExtensionSettings.customAudio.maxImportSizeBytes;
    }

    function customAudioSizeLimitMessage() {
        return `Please choose an audio file ${ExtensionSettings.customAudio.maxImportSizeLabel} or smaller.`;
    }

    function setUnknownAreaStatus(message, isError = false) {
        unknownAreaStatus.innerText = message;
        unknownAreaStatus.style.color = isError ? "#b00020" : "";
    }

    function clearUnknownAreaFileSelection() {
        selectedUnknownAreaFile = null;
        unknownAreaFileInput.value = "";
        unknownAreaFileDisplay.innerText = "";
        unknownAreaSaveButton.disabled = true;
    }

    function isCompleteArea(areaId, areaName) {
        return areaId !== null
            && areaId !== undefined
            && areaId !== UNKNOWN
            && areaName !== null
            && areaName !== undefined
            && areaName !== UNKNOWN
            && String(areaId).trim() !== ""
            && String(areaName).trim() !== "";
    }

    function hideUnknownAreaNotice() {
        unknownAreaNotice.style.display = "none";
        currentUnknownArea = null;
        clearUnknownAreaFileSelection();
        setUnknownAreaStatus("");
    }

    function showUnknownAreaNotice(areaId, areaName, statusMessage = "") {
        currentUnknownArea = {
            areaId: String(areaId),
            areaName: String(areaName),
        };
        currentUnknownAreaEntry = suggestedAreaMappingEntry(areaId, areaName);
        unknownAreaDisplay.innerText = `Unmapped area: ${areaName} (ID: ${areaId})`;
        unknownAreaEntryDisplay.innerText = currentUnknownAreaEntry;
        unknownAreaCopyButton.innerText = "Copy JSON";
        clearUnknownAreaFileSelection();
        setUnknownAreaStatus(statusMessage, Boolean(statusMessage));
        unknownAreaNotice.style.display = "flex";
    }

    function detectUnknownArea() {
        if (!areaMappingsReady) {
            return;
        }

        if (!isCompleteArea(areaId, areaName)) {
            hideUnknownAreaNotice();
            return;
        }

        const areaIdKey = String(areaId);
        if (areaIdKey in AREA_IDS_TO_LOCATION && !customAssignmentErrorAreaIds.has(areaIdKey)) {
            hideUnknownAreaNotice();
            return;
        }

        if (customAssignmentErrorAreaIds.has(areaIdKey)) {
            return;
        }

        if (notifiedUnknownAreaIds.has(areaIdKey)) {
            return;
        }

        notifiedUnknownAreaIds.add(areaIdKey);
        showUnknownAreaNotice(areaIdKey, areaName);
    }

    function copyUnknownAreaEntry() {
        if (!currentUnknownAreaEntry) {
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentUnknownAreaEntry)
                .then(() => {
                    unknownAreaCopyButton.innerText = "Copied";
                })
                .catch((error) => {
                    console.error(`[FL Genius Loci] Failed to copy area mapping entry: ${error}`);
                });
            return;
        }

        const textArea = document.createElement("textarea");
        textArea.value = currentUnknownAreaEntry;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            if (!document.execCommand("copy")) {
                throw new Error("Copy command was not accepted.");
            }

            Promise.resolve()
                .then(() => {
                    unknownAreaCopyButton.innerText = "Copied";
                })
                .finally(() => {
                    textArea.remove();
                });
        } catch (error) {
            Promise.resolve()
                .then(() => {
                    console.error(`[FL Genius Loci] Failed to copy area mapping entry: ${error}`);
                })
                .finally(() => {
                    textArea.remove();
            });
        }
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error("Could not read the selected audio file."));
            reader.readAsDataURL(file);
        });
    }

    function handleUnknownAreaFileSelected() {
        const file = unknownAreaFileInput.files && unknownAreaFileInput.files[0];
        if (!file) {
            clearUnknownAreaFileSelection();
            return;
        }

        if (!isSupportedAudioFile(file)) {
            clearUnknownAreaFileSelection();
            setUnknownAreaStatus("Please choose a supported audio file such as an MP3.", true);
            return;
        }

        if (!isWithinCustomAudioSizeLimit(file)) {
            clearUnknownAreaFileSelection();
            setUnknownAreaStatus(customAudioSizeLimitMessage(), true);
            return;
        }

        selectedUnknownAreaFile = file;
        unknownAreaFileDisplay.innerText = file.name;
        unknownAreaSaveButton.disabled = false;
        setUnknownAreaStatus("");
    }

    function saveUnknownAreaAssignment() {
        if (!currentUnknownArea) {
            setUnknownAreaStatus("No unmapped area is currently selected.", true);
            return;
        }

        if (!selectedUnknownAreaFile) {
            setUnknownAreaStatus("Choose an audio file before saving.", true);
            return;
        }

        const file = selectedUnknownAreaFile;
        if (!isWithinCustomAudioSizeLimit(file)) {
            clearUnknownAreaFileSelection();
            setUnknownAreaStatus(customAudioSizeLimitMessage(), true);
            return;
        }

        unknownAreaSaveButton.disabled = true;
        setUnknownAreaStatus("Importing audio...");

        readFileAsDataUrl(file)
            .then((dataUrl) => {
                window.postMessage({
                    action: ExtensionMessages.pageMessage.saveCustomAreaAssignment,
                    areaId: currentUnknownArea.areaId,
                    areaName: currentUnknownArea.areaName,
                    fileData: {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        dataUrl: dataUrl,
                    },
                }, ExtensionSettings.fallenLondonOrigin);
            })
            .catch((error) => {
                unknownAreaSaveButton.disabled = false;
                setUnknownAreaStatus(String(error), true);
            });
    }

    function handleCustomAreaAssignmentSaved(mapping) {
        if (!mapping || !mapping.areaId || !mapping.areaName) {
            return;
        }

        AREA_IDS_TO_LOCATION[mapping.areaId] = mapping.areaName;
        customAssignmentErrorAreaIds.delete(String(mapping.areaId));
        currentArea = mapping.areaName;
        updateLocatorArea(mapping.areaName, mapping.areaId);
        updateLocatorTrack(mapping.originalFilename || ExtensionSettings.ui.noTrackLabel);
        hideUnknownAreaNotice();
        notifyLocationChanged(mapping.areaName);
    }

    function handleCustomAreaAssignmentError(message) {
        const mapping = message.mapping || {};
        const failedAreaId = String(mapping.areaId || message.areaId || (currentUnknownArea && currentUnknownArea.areaId) || "");
        const failedAreaName = String(mapping.areaName || message.areaName || (currentUnknownArea && currentUnknownArea.areaName) || "");

        if (isCompleteArea(failedAreaId, failedAreaName)) {
            customAssignmentErrorAreaIds.add(failedAreaId);
            showUnknownAreaNotice(failedAreaId, failedAreaName, message.error || "Failed to save the custom area assignment.");
        } else {
            setUnknownAreaStatus(message.error || "Failed to save the custom area assignment.", true);
        }
    }

    function toggleLocatorPanel() {
        if (locatorPanel.classList.contains("expanded")) {
            console.debug("[FL Genius Loci] Hiding locator panel...");
            locatorPanel.classList.remove("expanded");
        } else {
            console.debug("[FL Genius Loci] Showing locator panel...");
            locatorPanel.classList.add("expanded");
        }
    }

    const DONE = 4;

    let authToken = "";
    let SETTING_IDS_TO_LOCATION = {};
    let currentSetting = UNKNOWN;

    let AREA_IDS_TO_LOCATION = {}
    let areaMappingsReady = false;
    let currentArea = UNKNOWN;

    let areaId = null;
    let areaName = null;
    let settingId = null;
    let settingName = null;

    async function getAreaFromUserInfo() {
        console.debug("[FL Genius Loci] Trying to fetch user info from server...");
        const response = await fetch(
            ExtensionSettings.fallenLondonApiUserUrl,
            {
                headers: {
                    "Authorization": authToken,
                },
            }
        );
        if (!response.ok) {
            throw new Error("FL API did not like our request");
        }

        const userData = await response.json();
        return userData.area;
    }

    function notifyLocationChanged(newLocation) {
        let event = new CustomEvent(ExtensionMessages.pageEvent.locationChanged, {
            detail: {
                location: newLocation,
                areaId: areaId,
                areaName: areaName,
            }
        })
        window.dispatchEvent(event);
    }

    function notifySettingChanged(newSetting) {
        let event = new CustomEvent(ExtensionMessages.pageEvent.settingChanged, {
            detail: {setting: newSetting}
        })
        window.dispatchEvent(event);
    }

    function notifyVolumeChanged(newVolume) {
        let event = new CustomEvent(ExtensionMessages.pageEvent.volumeChanged, {
            detail: {volume: newVolume}
        })
        window.dispatchEvent(event);
    }

    function reannounceRuntimeState() {
        if (currentSetting !== UNKNOWN) {
            notifySettingChanged(currentSetting);
        }

        notifyLocationChanged(currentArea);
    }

    function detectCurrentLocation() {
        updateLocatorArea(areaName || UNKNOWN, areaId || UNKNOWN);
        updateLocatorSetting(settingName || UNKNOWN, settingId || UNKNOWN);
        detectUnknownArea();

        let newSetting = UNKNOWN;
        let newArea = UNKNOWN;

        if (settingId in SETTING_IDS_TO_LOCATION) {
            if (currentSetting !== SETTING_IDS_TO_LOCATION[settingId]) {
                currentSetting = newSetting = SETTING_IDS_TO_LOCATION[settingId];
            }
        } else {
            newSetting = UNKNOWN;
        }

        if (areaId in AREA_IDS_TO_LOCATION) {
            if (currentArea !== AREA_IDS_TO_LOCATION[areaId]) {
                currentArea = newArea = AREA_IDS_TO_LOCATION[areaId];
            }
        } else {
            newArea = UNKNOWN;
        }

        if (newSetting !== UNKNOWN) {
            updateLocatorSetting(newSetting, settingId);
            notifySettingChanged(newSetting);
        }

        if (newArea !== UNKNOWN) {
            updateLocatorArea(newArea, areaId);
            notifyLocationChanged(newArea);
        } else {
            notifyLocationChanged(UNKNOWN);
        }
    }

    function parseResponse(response) {
        if (this.readyState === DONE) {
            // TODO: Proper URL matching
            let targetUrl = response.currentTarget.responseURL;

            if (!((targetUrl.includes("/api/map") || targetUrl.includes("/choosebranch") || targetUrl.includes("/myself")) && targetUrl.includes("fallenlondon"))) {
                return;
            }

            let data = JSON.parse(response.target.responseText);
            if (targetUrl.endsWith("/api/map")) {
                if (data.isSuccess) {
                    areaId = data["currentArea"].id;
                    areaName = data["currentArea"].name;
                    console.log(`[FL Genius Loci] We are at ${data["currentArea"].name} (ID: ${data["currentArea"].id})`);
                } else if (currentArea === UNKNOWN) {
                    console.log("[FL Genius Loci] Map cannot be accessed & location unknown, detecting through user info...")

                    getAreaFromUserInfo()
                        .then(area => {
                            console.log(`[FL Genius Loci] User is now at ${area.name} (ID: ${area.id})`);
                            areaId = area.id;
                            areaName = area.name;

                            detectCurrentLocation();
                        })

                    return;
                }
            }

            if (targetUrl.endsWith("/myself")) {
                settingId = data.character.setting.id;
                settingName = data.character.setting.name;
                console.log(`[FL Genius Loci] Current setting is ${settingName} (ID: ${settingId})`);
            }

            if (targetUrl.endsWith("/api/map/move")) {
                areaId = data["area"].id;
                areaName = data["area"].name;
                console.log(`[FL Genius Loci] We moved to ${data["area"].name} (ID: ${data["area"].id})`);
            } else if (targetUrl.endsWith("/api/storylet/choosebranch")) {
                if ("messages" in data) {
                    data.messages.forEach((message) => {
                        if ("area" in message) {
                            areaId = message.area.id;
                            areaName = message.area.name;

                            console.log(`[FL Genius Loci] We transitioned to ${areaName} (${areaId})`);
                        } else if ("setting" in message) {
                            settingId = message.setting.id;
                            settingName = message.setting.name;

                            console.log(`[FL Genius Loci] New setting: ${settingName} (${settingId})`);
                        }
                    })
                }
            }

            detectCurrentLocation();
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
                console.debug("[FL Genius Loci] Got FL auth token!");
            }
            return original_function.apply(this, arguments);
        }
    }

    const buttonInsertObserver = new MutationObserver((mutations, observer) => {
        for (let m = 0; m < mutations.length; m++) {
            let mutation = mutations[m];

            for (let n = 0; n < mutation.addedNodes.length; n++) {
                let node = mutation.addedNodes[n];

                if (node.nodeName.toLowerCase() === "div") {
                    const topStripe = node.querySelector("div[class='top-stripe__inner-container']");

                    if (topStripe) {
                        console.debug("[FL Genius Loci] Disconnecting observer.")
                        observer.disconnect();

                        console.debug("[FL Genius Loci] Top stripe found!");
                        const locatorButtonDiv = document.createElement("div");
                        locatorButtonDiv.style.cssText = "display: flex; align-items: flex-end;";
                        locatorButtonDiv.appendChild(locatorButton);
                        locatorButtonDiv.appendChild(muteButton);

                        console.debug("[FL Genius Loci] Inserting button...");
                        topStripe.insertBefore(locatorButtonDiv, topStripe.firstChild.nextSibling);

                        topStripe.parentElement.parentElement.insertBefore(locatorPanel, topStripe.parentElement.nextSibling);

                        console.debug("[FL Genius Loci] Reconnecting observer.")
                        observer.observe(document, {childList: true, subtree: true});
                    }
                }
            }
        }
    });

    locatorButton.addEventListener("click", () => toggleLocatorPanel());
    muteButton.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent(ExtensionMessages.pageEvent.toggleMute));
    })
    volumeSlider.addEventListener("input", () => {
        updateVolume(Number(volumeSlider.value) / 100);
        notifyVolumeChanged(currentVolume);
    });
    unknownAreaChooseFileButton.addEventListener("click", () => unknownAreaFileInput.click());
    unknownAreaFileInput.addEventListener("change", () => handleUnknownAreaFileSelected());
    unknownAreaSaveButton.addEventListener("click", () => saveUnknownAreaAssignment());
    unknownAreaCopyButton.addEventListener("click", () => copyUnknownAreaEntry());
    unknownAreaDismissButton.addEventListener("click", () => hideUnknownAreaNotice());
    buttonInsertObserver.observe(document, {childList: true, subtree: true});
    updateVolume(currentVolume);

    window.addEventListener("message", (event) => {
        if (!event.data || !event.data.action) {
            return;
        }

        if(event.data.action === ExtensionMessages.pageMessage.track) {
            updateLocatorTrack(event.data.track);
        }
        
        if (event.data.action === ExtensionMessages.pageMessage.muteStatus) {
            isMuted = event.data.isMuted;
            updateMuteButton();
        }
        
        if (event.data.action === ExtensionMessages.pageMessage.setMapping) {
            SETTING_IDS_TO_LOCATION = event.data.settings;
            AREA_IDS_TO_LOCATION = event.data.areas;
            areaMappingsReady = true;

            console.debug("[FL Genius Loci] Mappings received, trying to detect current location...");
            detectCurrentLocation();
        }

        if (event.data.action === ExtensionMessages.pageMessage.requestState) {
            console.debug("[FL Genius Loci] Reannouncing current runtime state...");
            reannounceRuntimeState();
        }

        if (event.data.action === ExtensionMessages.pageMessage.volumeStatus) {
            updateVolume(event.data.volume);
        }

        if (event.data.action === ExtensionMessages.pageMessage.customAreaAssignmentSaved) {
            handleCustomAreaAssignmentSaved(event.data.mapping);
        }

        if (event.data.action === ExtensionMessages.pageMessage.customAreaAssignmentError) {
            handleCustomAreaAssignmentError(event.data);
        }
    });

    console.debug("[FL Genius Loci] Setting up API interceptors.");
    XMLHttpRequest.prototype.open = openBypass(XMLHttpRequest.prototype.open);
    XMLHttpRequest.prototype.setRequestHeader = installAuthSniffer(XMLHttpRequest.prototype.setRequestHeader);

    document.dispatchEvent(new CustomEvent(ExtensionMessages.pageEvent.injected));
}())
