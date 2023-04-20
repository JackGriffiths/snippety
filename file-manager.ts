import {
    FileWithHandle,
    fileOpen,
    fileSave,
    supported as isFileSystemAccessSupported
} from "browser-fs-access";

export class FileManager {
    #currentFileName: string | null = null;
    #currentFileHandle: FileSystemFileHandle | null = null;

    get currentFileName() {
        return this.#currentFileName;
    }

    get isSaveAsEnabled() {
        return isFileSystemAccessSupported;
    }

    setCurrentFile(name: string, handle: FileSystemFileHandle | null) {
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
        };

        try {
            return await fileOpen(options) as FileWithHandle;
        } catch (error) {
            // User most likely cancelled the operation.
            return null;
        }
    }

    async trySave(defaultFileName: string, text: string) {
        return await FileManager.#trySaveText(defaultFileName, text, this.#currentFileHandle);
    }

    async trySaveAs(defaultFileName: string, text: string) {
        return await FileManager.#trySaveText(defaultFileName, text, null);
    }

    static async #trySaveText(defaultFileName: string, text: string, existingHandle: FileSystemFileHandle | null) {
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
                };
            } else {
                return {
                    name: defaultFileName,
                    handle: null,
                };
            }
        } catch {
            // User most likely cancelled the operation.
            return null;
        }
    }
}
