import type { FileSystemHandle, FileWithHandle } from "browser-fs-access";
import { onCleanup } from "solid-js";

export function makeFileDragAndDropHandler(
    dropTargetElement: HTMLElement,
    dropEffect: "copy" | "none" | "link" | "move",
    acceptedMimeType: string,
    fileDropped: (file: FileWithHandle) => void) {

    const [dragOverListener, dropListener] = attachDragDropListener(dropTargetElement, dropEffect, acceptedMimeType, fileDropped);

    return onCleanup(() => {
        dropTargetElement.removeEventListener("dragover", dragOverListener);
        dropTargetElement.removeEventListener("drop", dropListener);
    });
}

export function attachDragDropListener(
    dropTargetElement: HTMLElement,
    dropEffect: "copy" | "none" | "link" | "move",
    acceptedMimeType: string,
    fileDropped: (file: FileWithHandle) => void): [dragOverListener: (e: DragEvent) => void, dropListener: (e: DragEvent) => void] {

    const dragOverListener = (e: DragEvent) => {
        if (e.dataTransfer === null) {
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = dropEffect;
    };

    const dropListener = async (e: DragEvent) => {
        const file = await getFirstDroppedFile(e, acceptedMimeType);
        if (file !== null) {
            fileDropped(file);
        }
    };

    dropTargetElement.addEventListener("dragover", dragOverListener);
    dropTargetElement.addEventListener("drop", dropListener);

    return [dragOverListener, dropListener];
}

async function getFirstDroppedFile(dropEventArgs: DragEvent, acceptedMimeType: string): Promise<FileWithHandle | null> {
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
                if (handle === null || handle.kind === "directory") {
                    return null;
                }

                // We know the handle is for a file so we can cast it.
                const fileHandle = handle as unknown as FileSystemFileHandle;
                const file = await fileHandle.getFile();

                // Like the browser-fs-access libary does, we append the handle on to the object
                // to create an object that satisfies the FileWithHandle interface.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (file as any)["handle"] = fileHandle;

                return file;
            } else {
                return item.getAsFile();
            }
        }
    }

    return null;
}

interface DataTransferItemExtended extends DataTransferItem {
    getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
}
