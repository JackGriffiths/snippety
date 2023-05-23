import type { Snippet } from "./snippet-model";
import Result, * as res from "../utilities/result";
import { FileWithHandle, fileOpen, fileSave, supported as isFileSystemAccessSupported } from "browser-fs-access";
import { Accessor, createSignal } from "solid-js";

export { isFileSystemAccessSupported as hasFileSystemAccess };

type FileParser = (text: string) => Result<Snippet>;
type FileWriter = (snippet: Snippet) => string;

type Operations = {
    tryOpen: (file: FileWithHandle) => Promise<Result<Snippet>>,
    tryPick: () => Promise<Result<Snippet | null>>,
    trySave: (snippet: Snippet) => Promise<boolean>,
    trySaveAs: (snippet: Snippet) => Promise<boolean>,
    closeFile: VoidFunction,
};

export function createFileManager(parser: FileParser, writer: FileWriter): [fileName: Accessor<string | null>, fileOperations: Operations] {
    const [fileName, setFileName] = createSignal<string | null>(null);
    const [fileHandle, setFileHandle] = createSignal<FileSystemFileHandle | null>(null);

    const tryOpen = async (file: FileWithHandle) => {
        const result = parser(await file.text());

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
        const xml = writer(snippet);
        const existingFileHandle = useExistingFileHandle ? fileHandle() : null;
        const defaultFileName = fileName() ?? getDefaultFileName(snippet);
        const file = await trySaveText(xml, existingFileHandle, defaultFileName);

        if (file === null) {
            return false;
        }

        setFileName(file.name);
        setFileHandle(file.handle);
        return true;
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
        // User most likely cancelled the operation.
        return null;
    }
}

async function trySaveText(
    text: string,
    existingHandle: FileSystemFileHandle | null,
    defaultFileName: string): Promise<{ name: string, handle: FileSystemFileHandle | null } | null> {

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

function getDefaultFileName(snippet: Snippet) {
    const fileName = snippet.shortcut || snippet.title; // TODO: strip invalid file name chars from the title.
    return `${fileName}.snippet`;
}
