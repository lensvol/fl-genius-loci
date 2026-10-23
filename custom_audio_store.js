var CustomAudioStore = (() => {
    const DB_NAME = ExtensionSettings.customAudio.databaseName;
    const DB_VERSION = ExtensionSettings.customAudio.databaseVersion;
    const AUDIO_STORE = ExtensionSettings.customAudio.audioStoreName;
    const AREA_STORE = ExtensionSettings.customAudio.areaStoreName;

    const SUPPORTED_AUDIO_MIME_TYPES = new Set(ExtensionSettings.customAudio.supportedMimeTypes);
    const SUPPORTED_AUDIO_EXTENSIONS = new Set(ExtensionSettings.customAudio.supportedExtensions);

    function openDatabase() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === "undefined") {
                reject(new Error("IndexedDB is not available in this browser context."));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(AUDIO_STORE)) {
                    database.createObjectStore(AUDIO_STORE, {keyPath: "id"});
                }

                if (!database.objectStoreNames.contains(AREA_STORE)) {
                    database.createObjectStore(AREA_STORE, {keyPath: "areaId"});
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Failed to open custom audio storage."));
        });
    }

    function withStore(storeName, mode, callback) {
        return openDatabase().then((database) => {
            return new Promise((resolve, reject) => {
                const transaction = database.transaction(storeName, mode);
                const store = transaction.objectStore(storeName);
                const request = callback(store);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error("Custom audio storage request failed."));
                transaction.oncomplete = () => database.close();
                transaction.onerror = () => {
                    database.close();
                    reject(transaction.error || new Error("Custom audio storage transaction failed."));
                };
            });
        });
    }

    function normalizeAreaId(areaId) {
        return String(areaId);
    }

    function normalizeAreaName(areaName) {
        return String(areaName).trim();
    }

    function fileExtension(filename) {
        const normalizedFilename = String(filename || "").toLowerCase();
        const dotIndex = normalizedFilename.lastIndexOf(".");
        return dotIndex === -1 ? "" : normalizedFilename.slice(dotIndex);
    }

    function isSupportedAudioFile(fileData) {
        const mimeType = String(fileData.type || "").toLowerCase();
        return SUPPORTED_AUDIO_MIME_TYPES.has(mimeType)
            || SUPPORTED_AUDIO_EXTENSIONS.has(fileExtension(fileData.name));
    }

    function validateArea(areaId, areaName) {
        const normalizedAreaId = normalizeAreaId(areaId);
        const normalizedAreaName = normalizeAreaName(areaName);
        if (!normalizedAreaId || !normalizedAreaName || normalizedAreaId === ExtensionSettings.unknownLocation || normalizedAreaName === ExtensionSettings.unknownLocation) {
            throw new Error("Cannot save a custom mapping before Fallen London reports a complete area.");
        }

        return {
            areaId: normalizedAreaId,
            areaName: normalizedAreaName,
        };
    }

    function validateFileData(fileData) {
        if (!fileData || !fileData.dataUrl || typeof fileData.dataUrl !== "string") {
            throw new Error("The selected audio file was not received by the extension.");
        }

        if (!isSupportedAudioFile(fileData)) {
            throw new Error("Please choose a supported audio file such as an MP3.");
        }

        if (Number(fileData.size || 0) > ExtensionSettings.customAudio.maxImportSizeBytes) {
            throw new Error(`Please choose an audio file ${ExtensionSettings.customAudio.maxImportSizeLabel} or smaller.`);
        }

        return {
            name: String(fileData.name || "Custom audio"),
            type: String(fileData.type || "audio/mpeg"),
            size: Number(fileData.size || 0),
            dataUrl: fileData.dataUrl,
        };
    }

    function blobFromDataUrl(dataUrl, fallbackType) {
        const match = String(dataUrl).match(/^data:([^;,]+)?(;base64)?,(.*)$/);
        if (!match) {
            throw new Error("The selected file data could not be read.");
        }

        const mimeType = match[1] || fallbackType || "audio/mpeg";
        const isBase64 = Boolean(match[2]);
        const payload = match[3] || "";
        const byteString = isBase64 ? atob(payload) : decodeURIComponent(payload);
        const bytes = new Uint8Array(byteString.length);

        for (let i = 0; i < byteString.length; i += 1) {
            bytes[i] = byteString.charCodeAt(i);
        }

        return new Blob([bytes], {type: mimeType});
    }

    function createAssetId(areaId) {
        const suffix = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        return `area-${encodeURIComponent(areaId)}-${suffix}`;
    }

    function customTrackId(assetId) {
        return `${ExtensionSettings.customAudio.trackIdPrefix}${assetId}`;
    }

    function getAllAreaMappings() {
        return withStore(AREA_STORE, "readonly", (store) => store.getAll())
            .then((mappings) => {
                const mappingByAreaId = {};
                mappings.forEach((mapping) => {
                    mappingByAreaId[mapping.areaId] = mapping;
                });
                return mappingByAreaId;
            });
    }

    function getAreaMapping(areaId) {
        return withStore(AREA_STORE, "readonly", (store) => store.get(normalizeAreaId(areaId)));
    }

    function getAudioAsset(assetId) {
        return withStore(AUDIO_STORE, "readonly", (store) => store.get(assetId));
    }

    function saveAreaAssignment({areaId, areaName, fileData}) {
        const normalizedArea = validateArea(areaId, areaName);
        const normalizedFile = validateFileData(fileData);
        const audioBlob = blobFromDataUrl(normalizedFile.dataUrl, normalizedFile.type);
        const now = Date.now();
        const assetId = createAssetId(normalizedArea.areaId);

        return getAreaMapping(normalizedArea.areaId)
            .then((previousMapping) => openDatabase().then((database) => {
                return new Promise((resolve, reject) => {
                    const transaction = database.transaction([AUDIO_STORE, AREA_STORE], "readwrite");
                    const audioStore = transaction.objectStore(AUDIO_STORE);
                    const areaStore = transaction.objectStore(AREA_STORE);
                    const audioAsset = {
                        id: assetId,
                        blob: audioBlob,
                        originalFilename: normalizedFile.name,
                        type: audioBlob.type,
                        size: normalizedFile.size || audioBlob.size,
                        updatedAt: now,
                    };
                    const mapping = {
                        areaId: normalizedArea.areaId,
                        areaName: normalizedArea.areaName,
                        assetId: assetId,
                        originalFilename: normalizedFile.name,
                        audioType: audioBlob.type,
                        audioSize: normalizedFile.size || audioBlob.size,
                        updatedAt: now,
                    };

                    audioStore.put(audioAsset);
                    areaStore.put(mapping);

                    if (previousMapping && previousMapping.assetId && previousMapping.assetId !== assetId) {
                        audioStore.delete(previousMapping.assetId);
                    }

                    transaction.oncomplete = () => {
                        database.close();
                        resolve(mapping);
                    };
                    transaction.onerror = () => {
                        database.close();
                        reject(transaction.error || new Error("Failed to save the custom area assignment."));
                    };
                });
            }));
    }

    return {
        customTrackId,
        getAllAreaMappings,
        getAudioAsset,
        saveAreaAssignment,
    };
})();
