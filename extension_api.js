const ExtensionApi = (() => {
    const actionApi = chrome.action || chrome.browserAction;
    let creatingOffscreenDocument = null;

    function getURL(path) {
        return chrome.runtime.getURL(path);
    }

    function sendRuntimeMessage(message, responseCallback = undefined) {
        if (responseCallback) {
            chrome.runtime.sendMessage(message, responseCallback);
        } else {
            chrome.runtime.sendMessage(message);
        }
    }

    function onRuntimeMessage(listener) {
        chrome.runtime.onMessage.addListener(listener);
    }

    function getLastErrorMessage() {
        return chrome.runtime.lastError ? chrome.runtime.lastError.message : null;
    }

    function sendTabMessage(tabId, message, responseCallback = undefined) {
        if (responseCallback) {
            chrome.tabs.sendMessage(tabId, message, responseCallback);
        } else {
            chrome.tabs.sendMessage(tabId, message);
        }
    }

    function queryTabs(queryInfo, callback) {
        chrome.tabs.query(queryInfo, callback);
    }

    function onTabRemoved(listener) {
        chrome.tabs.onRemoved.addListener(listener);
    }

    function getStorageValue(key, defaultValue) {
        if (!chrome.storage || !chrome.storage.local) {
            return Promise.resolve(defaultValue);
        }

        return new Promise((resolve, reject) => {
            chrome.storage.local.get({[key]: defaultValue}, (result) => {
                const lastError = getLastErrorMessage();
                if (lastError) {
                    reject(lastError);
                    return;
                }

                resolve(result[key]);
            });
        });
    }

    function setStorageValue(key, value) {
        if (!chrome.storage || !chrome.storage.local) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            chrome.storage.local.set({[key]: value}, () => {
                const lastError = getLastErrorMessage();
                if (lastError) {
                    reject(lastError);
                    return;
                }

                resolve();
            });
        });
    }

    function setBadgeText(details, callback = undefined) {
        if (callback) {
            actionApi.setBadgeText(details, callback);
        } else {
            actionApi.setBadgeText(details);
        }
    }

    function setBadgeBackgroundColor(details) {
        actionApi.setBadgeBackgroundColor(details);
    }

    function setTitle(details, callback = undefined) {
        if (callback) {
            actionApi.setTitle(details, callback);
        } else {
            actionApi.setTitle(details);
        }
    }

    function onActionClicked(listener) {
        actionApi.onClicked.addListener(listener);
    }

    function canUseOffscreenDocument() {
        return Boolean(chrome.offscreen && chrome.offscreen.createDocument);
    }

    async function hasOffscreenDocument(path) {
        if (!canUseOffscreenDocument()) {
            return false;
        }

        const offscreenUrl = chrome.runtime.getURL(path);
        if (chrome.runtime.getContexts) {
            const contexts = await chrome.runtime.getContexts({
                contextTypes: ["OFFSCREEN_DOCUMENT"],
                documentUrls: [offscreenUrl],
            });
            return contexts.length > 0;
        }

        const matchedClients = await clients.matchAll();
        return matchedClients.some((client) => client.url === offscreenUrl);
    }

    async function ensureOffscreenDocument(path, reasons, justification) {
        if (!canUseOffscreenDocument() || await hasOffscreenDocument(path)) {
            return;
        }

        if (creatingOffscreenDocument) {
            await creatingOffscreenDocument;
            return;
        }

        creatingOffscreenDocument = chrome.offscreen.createDocument({
            url: path,
            reasons: reasons,
            justification: justification,
        });
        await creatingOffscreenDocument;
        creatingOffscreenDocument = null;
    }

    return {
        getURL,
        sendRuntimeMessage,
        onRuntimeMessage,
        getLastErrorMessage,
        sendTabMessage,
        queryTabs,
        onTabRemoved,
        getStorageValue,
        setStorageValue,
        setBadgeText,
        setBadgeBackgroundColor,
        setTitle,
        onActionClicked,
        canUseOffscreenDocument,
        ensureOffscreenDocument,
    };
})();
