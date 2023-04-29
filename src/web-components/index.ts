import { HighlightedCodeBlock } from "./highlighted-code-block";
import type { ComponentProps } from "solid-js"

export function registerWebComponents() {
    registerIfRequired(HighlightedCodeBlock.tagName, HighlightedCodeBlock);
}

function registerIfRequired(tagName: string, classConstructor: CustomElementConstructor) {
    if (customElements.get(tagName)) {
        return;
    }

    customElements.define(tagName, classConstructor);
}

declare module "solid-js" {
    namespace JSX {
        interface IntrinsicElements {
            [HighlightedCodeBlock.tagName]: ComponentProps<"div"> & {
                "attr:language": string,
                "attr:code": string,
            }
        }
    }
}
