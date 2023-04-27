import {
    FileWithHandle,
    fileOpen,
    fileSave,
    supported as isFileSystemAccessSupported
} from "browser-fs-access";
import { createSignal } from "solid-js";

const [currentFileName, setCurrentFileName] = createSignal<string | null>(null);
const [currentFileHandle, setCurrentFileHandle] = createSignal<FileSystemFileHandle | null>(null);

export { currentFileName };
export { isFileSystemAccessSupported as isSaveAsEnabled};

export function setCurrentFile(name: string, handle: FileSystemFileHandle | null) {
    setCurrentFileName(name);
    setCurrentFileHandle(handle);
}

export function clearCurrentFile() {
    setCurrentFileName(null);
    setCurrentFileHandle(null);
}

export async function tryOpen() {
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

export async function trySave(defaultFileName: string, text: string) {
    return await trySaveText(defaultFileName, text, currentFileHandle()); // TODO: do we need to specify untracked access?
}

export async function trySaveAs(defaultFileName: string, text: string) {
    return await trySaveText(defaultFileName, text, null);
}

async function trySaveText(defaultFileName: string, text: string, existingHandle: FileSystemFileHandle | null) {
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
