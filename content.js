console.log("[FL Genius Loci] Content script started.");

function injectExtensionScript(path) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = ExtensionApi.getURL(path);
        script.onload = function () {
            this.remove();
            resolve();
        };
        (document.head || document.documentElement).appendChild(script);
    });
}

injectExtensionScript("extension_settings.js")
    .then(() => injectExtensionScript(ExtensionSettings.messagesPath))
    .then(() => injectExtensionScript(ExtensionSettings.injectedScriptPath));

function sendToPage(action, detail) {
    window.postMessage({
        action: action,
        ...detail
    }, ExtensionSettings.fallenLondonOrigin);
}

window.addEventListener(ExtensionMessages.pageEvent.locationChanged, (event) => {
    ExtensionApi.sendRuntimeMessage({
        action: ExtensionMessages.runtime.locationChanged,
        location: event.detail.location,
        areaId: event.detail.areaId,
        areaName: event.detail.areaName,
    });
});

window.addEventListener(ExtensionMessages.pageEvent.settingChanged, (event) => {
    ExtensionApi.sendRuntimeMessage({
        action: ExtensionMessages.runtime.settingChanged,
        setting: event.detail.setting
    }, () => {});
});

document.addEventListener(ExtensionMessages.pageEvent.injected, () => {
    ExtensionApi.sendRuntimeMessage({action: ExtensionMessages.runtime.hello});
});

document.addEventListener(ExtensionMessages.pageEvent.toggleMute, () => {
    ExtensionApi.sendRuntimeMessage({action: ExtensionMessages.runtime.toggleMute});
});

window.addEventListener(ExtensionMessages.pageEvent.volumeChanged, (event) => {
    ExtensionApi.sendRuntimeMessage({
        action: ExtensionMessages.runtime.volumeChanged,
        volume: event.detail.volume,
    });
});

window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.action !== ExtensionMessages.pageMessage.saveCustomAreaAssignment) {
        return;
    }

    ExtensionApi.sendRuntimeMessage({
        action: ExtensionMessages.runtime.saveCustomAreaAssignment,
        areaId: event.data.areaId,
        areaName: event.data.areaName,
        fileData: event.data.fileData,
    }, (response) => {
        const lastError = ExtensionApi.getLastErrorMessage();
        if (lastError || !response || !response.ok) {
            sendToPage(ExtensionMessages.pageMessage.customAreaAssignmentError, {
                areaId: event.data.areaId,
                areaName: event.data.areaName,
                mapping: response ? response.mapping : null,
                error: lastError || (response && response.error) || "Failed to save the custom area assignment.",
            });
            return;
        }

        sendToPage(ExtensionMessages.pageMessage.customAreaAssignmentSaved, {
            mapping: response.mapping,
        });
    });
});

ExtensionApi.onRuntimeMessage((message, sender, sendResponse) => {
    if (message.action === ExtensionMessages.tab.setMapping) {
        sendToPage(ExtensionMessages.pageMessage.setMapping, {
            settings: message.mapping.settings,
            areas: message.mapping.areas,
        });
    } else if (message.action === ExtensionMessages.tab.muteStatus) {
        sendToPage(ExtensionMessages.pageMessage.muteStatus, {
            isMuted: message.isMuted,
        });
    } else if (message.action === ExtensionMessages.tab.track) {
        sendToPage(ExtensionMessages.pageMessage.track, {
            track: (message.track || ExtensionSettings.ui.noTrackLabel).replace(ExtensionSettings.tracksPathPrefix, ""),
        });
    } else if (message.action === ExtensionMessages.tab.requestState) {
        sendToPage(ExtensionMessages.pageMessage.requestState, {});
    } else if (message.action === ExtensionMessages.tab.volumeStatus) {
        sendToPage(ExtensionMessages.pageMessage.volumeStatus, {
            volume: message.volume,
        });
    } else if (message.action === ExtensionMessages.tab.customAreaAssignmentError) {
        sendToPage(ExtensionMessages.pageMessage.customAreaAssignmentError, {
            areaId: message.areaId,
            areaName: message.areaName,
            error: message.error,
        });
    }
})
