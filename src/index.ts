import { attachDragDropListener } from "./utilities/file-drag-and-drop";
import { MessageChannel, WindowMessage, tryInitMessageChannel } from "./window-messaging";
import type { FileWithHandle } from "browser-fs-access";

// If a file is dropped on to this page, we want to open up the editor
// in a new tab and pass the file across to it. Some coordination between
// the two tabs is required to achieve this.

// Ideally as soon as the editor tab is opened we could use the
// window.postMessage API to send the file across to it. However the
// new tab is not immediately ready to receive messages. Instead what
// happens is the new tab will send a "ready" message to it's
// opener window (i.e. this window/tab). Upon receiving this message,
// this tab then proceeds to post the file to the editor tab which will
// process it accordingly.

let droppedFile: FileWithHandle | null = null;
attachDragDropListener(document.body, "link", "application/xml", onFileDropped);

function onFileDropped(file: FileWithHandle) {
    // Open up the editor in a new tab.
    const targetWindowForDroppedFile = window.open("/editor.html");

    if (targetWindowForDroppedFile !== null) {
        // Set up a channel with the new tab so that
        // we know when it's ready to receive the file.
        droppedFile = file;
        tryInitMessageChannel(targetWindowForDroppedFile, onMessageReceived);
    }
}

function onMessageReceived(message: WindowMessage, channel: MessageChannel) {
    // Send the file to the editor tab when it's ready to receive it.
    if (message.type === "ready" && droppedFile !== null) {

        // Reply with the file
        channel.postMessage({
            type: "droppedFile",
            data: {
                file: droppedFile,
                handle: droppedFile.handle,
            }
        });

        // Clean up
        droppedFile = null;
        channel.close();
    }
}
