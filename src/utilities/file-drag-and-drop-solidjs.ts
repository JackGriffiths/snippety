import { attachFileDragAndDropHandler } from "./file-drag-and-drop";
import type { FileWithHandle } from "browser-fs-access";
import { onCleanup } from "solid-js";

export function makeFileDragAndDropHandler(
    dropTargetElement: HTMLElement,
    dropEffect: "copy" | "none" | "link" | "move",
    acceptedMimeType: string,
    fileDropped: (file: FileWithHandle) => void) {

    const [dragOverListener, dropListener] = attachFileDragAndDropHandler(dropTargetElement, dropEffect, acceptedMimeType, fileDropped);

    return onCleanup(() => {
        dropTargetElement.removeEventListener("dragover", dragOverListener);
        dropTargetElement.removeEventListener("drop", dropListener);
    });
}
