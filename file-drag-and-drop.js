export class FileDragAndDrop {
    static init(dropTargetElement, dropEffect, acceptedMimeType, fileDropped) {

        dropTargetElement.addEventListener("dragover", e => {
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

    static async #getFirstDroppedFile(dropEventArgs, acceptedMimeType) {
        for (const item of dropEventArgs.dataTransfer.items) {
            if (item.kind === "file" && item.type === acceptedMimeType) {

                // We've found one. Prevent the default behaviour of opening the file up in
                // a new tab, because we're going to handle it ourselves.
                dropEventArgs.preventDefault();

                // We prefer to get the handle to the file if the browser allows it so we
                // can allow the user to overwrite the file with any changes they make.
                if (item.getAsFileSystemHandle === undefined) {
                    const file = item.getAsFile();

                    return {
                        name: file.name,
                        blob: file,
                        handle: null
                    };
                } else {
                    const handle = await item.getAsFileSystemHandle();

                    return {
                        name: handle.name,
                        blob: await handle.getFile(),
                        handle: handle,
                    }
                }
            }
        }

        return null;
    }
}
