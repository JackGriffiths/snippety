import type { FileSystemHandle } from "browser-fs-access";

export function initFileDragAndDrop(
    dropTargetElement: HTMLElement,
    dropEffect: "copy" | "none" | "link" | "move",
    acceptedMimeType: string,
    fileDropped: (file: { name: string, blob: Blob, handle: FileSystemFileHandle | null }) => void) {

    dropTargetElement.addEventListener("dragover", e => {
        if (e.dataTransfer === null) {
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = dropEffect;
    });

    dropTargetElement.addEventListener("drop", async e => {
        const file = await getFirstDroppedFile(e, acceptedMimeType);
        if (file !== null) {
            fileDropped(file);
        }
    });
}

async function getFirstDroppedFile(dropEventArgs: DragEvent, acceptedMimeType: string): Promise<{ name: string, blob: Blob, handle: FileSystemFileHandle | null } | null> {
    if (dropEventArgs.dataTransfer === null) {
        return null;
    }

    for (const item of dropEventArgs.dataTransfer.items) {
        if (item.kind === "file" && item.type === acceptedMimeType) {

            // We've found one. Prevent the default behaviour of opening the file up in
            // a new tab, because we're going to handle it ourselves.
            dropEventArgs.preventDefault();

            // We prefer to get the handle to the file if the browser allows it so we
            // can allow the user to overwrite the file with any changes they make.
            // The "getAsFileSystemHandle" function isn't well supported so isn't defined
            // on the DataTransferItem type by either TypeScript or "browser-fs-access".
            // Therefore a custom interface was added to include the function.
            const extendedItem = item as DataTransferItemExtended;

            if (extendedItem.getAsFileSystemHandle !== undefined) {
                const handle = await extendedItem.getAsFileSystemHandle();
                if (handle === null || handle.kind == "directory") {
                    return null;
                }

                const fileHandle = handle as unknown as FileSystemFileHandle;

                return {
                    name: handle.name,
                    blob: await fileHandle.getFile(),
                    handle: fileHandle,
                };
            } else {
                const file = item.getAsFile();
                if (file === null) {
                    return null;
                }

                return {
                    name: file.name,
                    blob: file,
                    handle: null
                };
            }
        }
    }

    return null;
}

interface DataTransferItemExtended extends DataTransferItem {
    getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
}
