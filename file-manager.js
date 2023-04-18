import { fileOpen, fileSave, supported as isFileSystemAccessSupported } from "lib/browser-fs-access";

export class FileManager {
    #currentFileName = null;
    #currentFileHandle = null;

    get currentFileName() {
        return this.#currentFileName;
    }

    get isSaveAsEnabled() {
        return isFileSystemAccessSupported;
    }

    setCurrentFile(name, handle) {
        this.#currentFileName = name;
        this.#currentFileHandle = handle;
    }

    clearCurrentFile() {
        this.#currentFileName = null;
        this.#currentFileHandle = null;
    }

    async tryOpen() {
        const options = {
            mimeTypes: ["application/xml"],
            extensions: [".snippet"],
            multiple: false,
            excludeAcceptAllOption: true
        }

        try {
            const file = await fileOpen(options);

            return {
                name: file.name,
                blob: file,
                handle: file.handle
            };
        } catch (error) {
            // User most likely cancelled the operation.
            return null;
        }
    }

    async trySave(defaultFileName, text) {
        return await FileManager.#trySaveText(defaultFileName, text, this.#currentFileHandle);
    }

    async trySaveAs(defaultFileName, text) {
        return await FileManager.#trySaveText(defaultFileName, text, null);
    }

    static async #trySaveText(defaultFileName, text, existingHandle) {
        const data = new Blob([text], {
            type: "application/xml"
        });

        const options = {
            fileName: defaultFileName,
            extensions: [".snippet"],
            excludeAcceptAllOption: true,
        };

        try {
            const handle = await fileSave(
                data,
                options,
                existingHandle,
                /* throwIfExistingHandleNotGood */ false
            );

            if (handle !== null) {
                return {
                    name: handle.name,
                    handle: handle,
                }
            } else {
                return {
                    name: defaultFileName,
                    handle: null,
                }
            }
        } catch {
            // User most likely cancelled the operation.
            return null;
        }
    }
}
