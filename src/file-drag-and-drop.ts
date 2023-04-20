export class FileDragAndDrop {
    static init(
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
            const file = await this.#getFirstDroppedFile(e, acceptedMimeType);
            if (file !== null) {
                fileDropped(file);
            }
        });
    }

    static async #getFirstDroppedFile(dropEventArgs: DragEvent, acceptedMimeType: string): Promise<{ name: string, blob: Blob, handle: FileSystemFileHandle | null } | null> {
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

                if (typeof (item as any)["getAsFileSystemHandle"] === "function") {
                    const handle = await (item as any)["getAsFileSystemHandle"]() as FileSystemFileHandle;

                    return {
                        name: handle.name,
                        blob: await handle.getFile(),
                        handle: handle,
                    };
                } else {
                    const file = item.getAsFile()!;

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
}
