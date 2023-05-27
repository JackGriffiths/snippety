import { onCleanup } from "solid-js";

// These are the messages that can be sent between pages.
export type WindowMessage =
    | { type: "ready" }
    | { type: "droppedFile", data: FileAndHandle };

export type FileAndHandle = {
    file: File,
    handle?: FileSystemFileHandle,
}

export function tryInitMessageChannel(otherWindow: Window | null, messageHandler: MessageHandler): MessageChannel | null {
    if (otherWindow === null) {
        return null;
    }

    if (otherWindow.origin !== window.origin) {
        // We don't allow cross-origin communication.
        return null;
    }

    const channel: MessageChannel = {
        otherWindow: otherWindow,
        postMessage: message => otherWindow.postMessage(message, { "targetOrigin": "/" }),
        close: () => window.removeEventListener("message", messageListener),
    };

    const messageListener = async (e: MessageEvent) => {
        if (e.source === otherWindow) {
            await messageHandler(e.data, channel);
        }
    };

    window.addEventListener("message", messageListener);

    return channel;
}

// This is the SolidJS version, with automatic cleanup.
export function tryMakeMessageChannel(otherWindow: Window | null, messageHandler: MessageHandler): MessageChannel | null {
    const channel = tryInitMessageChannel(otherWindow, messageHandler);
    if (channel !== null) {
        onCleanup(() => channel.close());
    }
    return channel;
}

export type MessageChannel = {
    otherWindow: Window,
    postMessage: (message: WindowMessage) => void,
    close: VoidFunction,
}

export type MessageHandler = (message: WindowMessage, channel: MessageChannel) => void | Promise<void>;
