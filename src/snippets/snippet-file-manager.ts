import type { Snippet } from "./snippet-model";
import { parseSnippetFromXml } from "./io/file-parser";
import { writeSnippetToXml } from "./io/file-writer";
import Result, * as res from "../utilities/result";
import { FileWithHandle, fileOpen, fileSave, supported as isFileSystemAccessSupported } from "browser-fs-access";
import { Accessor, createSignal } from "solid-js";

export { isFileSystemAccessSupported as hasFileSystemAccess };

type Operations = {
    tryOpen: (file: FileWithHandle) => Promise<Result<Snippet>>,
    tryPick: () => Promise<Result<Snippet | null>>,
    trySave: (snippet: Snippet) => Promise<Result<boolean>>,
    trySaveAs: (snippet: Snippet) => Promise<Result<boolean>>,
    closeFile: VoidFunction,
};

export function createFileManager(): [fileName: Accessor<string | null>, fileOperations: Operations] {
    const [fileName, setFileName] = createSignal<string | null>(null);
    const [fileHandle, setFileHandle] = createSignal<FileSystemFileHandle | null>(null);

    const tryOpen = async (file: FileWithHandle) => {
        const result = parseSnippetFromXml(await file.text());

        if (result.isOk) {
            setFileName(file.name);
            setFileHandle(file.handle ?? null);
        }

        return result;
    };

    const tryPick = async () => {
        const file = await tryPickFile();

        if (file === null) {
            // Assume that the user just pressed cancel.
            // TODO: are we sure there wasn't an error returned when picking the file?
            return res.ok<Snippet | null>(null);
        }

        const openResult = await tryOpen(file);

        if (!openResult.isOk) {
            return res.error<Snippet | null>(openResult.error);
        }

        return res.ok<Snippet | null>(openResult.value);
    };

    const trySaveInternal = async (snippet: Snippet, useExistingFileHandle: boolean) => {
        const xml = writeSnippetToXml(snippet);
        const existingFileHandle = useExistingFileHandle ? fileHandle() : null;
        const defaultFileName = fileName() ?? getDefaultFileName(snippet);
        const saveResult = await trySaveText(xml, existingFileHandle, defaultFileName);

        if (!saveResult.isOk) {
            return res.error<boolean>(saveResult.error);
        }

        const file = saveResult.value;

        if (file === null) {
            // The snippet wasn't saved, but this wasn't caused by an error.
            // Just report back false to indicate that the snippet wasn't saved.
            return res.ok(false);
        }

        setFileName(file.name);
        setFileHandle(file.handle);
        return res.ok(true);
    };

    const trySave = (snippet: Snippet) => trySaveInternal(snippet, /* useExistingFileHandle */ true);
    const trySaveAs = (snippet: Snippet) => trySaveInternal(snippet, /* useExistingFileHandle */ false);

    const closeFile = () => {
        setFileName(null);
        setFileHandle(null);
    };

    const operations = {
        tryOpen,
        tryPick,
        trySave,
        trySaveAs,
        closeFile
    };

    return [fileName, operations];
}

async function tryPickFile() {
    const options = {
        description: "Visual Studio snippet",
        extensions: [".snippet"],
        multiple: false,
        excludeAcceptAllOption: true
    };

    try {
        return await fileOpen(options) as FileWithHandle;
    } catch (error) {
        // User most likely cancelled the operation, which we can just ignore.
        // If the file was locked then the browser would not have even allowed
        // the user to select the file.
        console.error(error);
        return null;
    }
}

async function trySaveText(
    text: string,
    existingHandle: FileSystemFileHandle | null,
    defaultFileName: string): Promise<Result<{ name: string, handle: FileSystemFileHandle | null } | null>> {

    const data = new Blob([text], {
        type: "application/xml"
    });

    const options = {
        fileName: defaultFileName,
        description: "Visual Studio snippet",
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
            return res.ok({
                name: handle.name,
                handle: handle,
            });
        } else {
            return res.ok({
                name: defaultFileName,
                handle: null,
            });
        }
    } catch (error) {
        console.error(error);

        if (error instanceof DOMException) {
            // There appear to be three possible ways in which the save could fail.
            // None of these are easy to detect in a robust way.

            if (error.name === "AbortError") {
                if (error.message === "The user aborted a request.") {
                    // 1) User cancels by pressing the cancel button on the dialog.
                    return res.ok(null);
                } else {
                    // 2) User tried to save to a file that is locked.
                    return res.error("File not saved. This could be because the file is locked by another process.");
                }
            }

            if (error.name === "NotAllowedError") {
                // 3) User denied permission for the application to save the file in place.
                return res.ok(null);
            }
        }

        // Fallback error.
        return res.error("File not saved. Something went wrong.");
    }
}

function getDefaultFileName(snippet: Snippet) {
    // It doesn't matter if this will contain characters that are invalid for file names.
    // When the save window is shown, the invalid characters will automatically be substituted.
    const fileName = snippet.shortcut || snippet.title;
    return `${fileName}.snippet`;
}
