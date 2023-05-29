import { onCleanup } from "solid-js";
import { MessageChannel, MessageHandler, tryInitMessageChannel } from "./window-messaging";

export function tryMakeMessageChannel(otherWindow: Window | null, messageHandler: MessageHandler): MessageChannel | null {
    const channel = tryInitMessageChannel(otherWindow, messageHandler);
    if (channel !== null) {
        onCleanup(() => channel.close());
    }
    return channel;
}

export * from "./window-messaging";
