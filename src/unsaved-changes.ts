import { Accessor, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

export function createDirty<T extends object>(item: T): [dirty: Accessor<boolean>, markClean: VoidFunction] {
    const serialize = () => JSON.stringify(item);
    const [cleanState, setCleanState] = createSignal(serialize());
    const dirty = createMemo(() => serialize() !== cleanState());
    const markClean = () => { setCleanState(serialize()); };

    return [dirty, markClean];
}

export function makeLeavePrompt(when: () => boolean, message: string): VoidFunction {
    const listener: OnBeforeUnloadEventHandler = (e: Event) => {
        // Prompts the browser to show the alert to the user asking for confirmation
        // that they want to leave.
        e.preventDefault();

        // @ts-expect-error: It should be possible to just call preventDefault but
        // some browsers (e.g. Chrome) don't support this. They still require that
        // the deprecated returnValue property is set.
        e.returnValue = message;

        // This message will almost certainly be ignored by the browser and a generic
        // message will be displayed instead.
        return message;
    };

    let isAttached = false;

    createEffect(() => {
        if (when()) {
            window.addEventListener("beforeunload", listener);
            isAttached = true;
        } else if (isAttached) {
            window.removeEventListener("beforeunload", listener);
            isAttached = false;
        }
    });

    return onCleanup(() => {
        window.removeEventListener("beforeunload", listener);
    });
}
