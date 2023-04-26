import type { SnippetModel } from "./snippet-model";
import { createDefaultSnippet } from "./snippet-model";

export class SnippetParser {

    static fromXml(xml: string): SnippetModel {
        // TODO: what if it's not unparsable XML?
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        const codeSnippets = doc.getElementsByTagName("CodeSnippet");

        if (codeSnippets.length === 0) {
            throw Error("File does not contain a code snippet.")
        }

        if (codeSnippets.length > 1) {
            throw Error("Files with multiple snippets are not supported.");
        }

        return SnippetParser.#parseCodeSnippetElement(codeSnippets[0]);
    }

    static #parseCodeSnippetElement(codeSnippetElement: Element): SnippetModel {
        const model = createDefaultSnippet();

        model.format = codeSnippetElement.getAttribute("Format") ?? "";

        const header = SnippetParser.#getSingleElement(codeSnippetElement, "Header");

        if (header !== null) {
            model.title = SnippetParser.#getSingleStringValue(header, "Title") ?? "";
            model.shortcut = SnippetParser.#getSingleStringValue(header, "Shortcut") ?? "";
            model.description = SnippetParser.#getSingleStringValue(header, "Description") ?? "";
            model.author = SnippetParser.#getSingleStringValue(header, "Author") ?? "";
            model.helpUrl = SnippetParser.#getSingleStringValue(header, "HelpUrl") ?? "";
        }

        const snippet = SnippetParser.#getSingleElement(codeSnippetElement, "Snippet");

        if (snippet !== null) {
            const code = SnippetParser.#getSingleElement(snippet, "Code");
            if (code !== null) {
                model.language = code.getAttribute("Language") ?? "";
                model.code = code.textContent ?? "";
            }
        }

        return model;
    }

    static #getSingleElement(parent: Element, tagName: string): Element | null {
        const elements = parent.getElementsByTagName(tagName);
        return elements.length === 0 ? null : elements[0];
    }

    static #getSingleStringValue(parent: Element, tagName: string): string | null {
        return SnippetParser.#getSingleElement(parent, tagName)?.textContent ?? null;
    }
}
