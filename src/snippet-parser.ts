import { SnippetModel } from "./snippet-model";

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
        const snippet = new SnippetModel();
        snippet.format = codeSnippetElement.getAttribute("Format");

        const header = SnippetParser.#getSingleElement(codeSnippetElement, "Header");

        if (header !== null) {
            snippet.title = SnippetParser.#getSingleStringValue(header, "Title");
            snippet.description = SnippetParser.#getSingleStringValue(header, "Description");
        }

        return snippet;
    }

    static #getSingleElement(parent: Element, tagName: string): Element | null {
        const elements = parent.getElementsByTagName(tagName);
        return elements.length === 0 ? null : elements[0];
    }

    static #getSingleStringValue(parent: Element, tagName: string): string | null {
        return SnippetParser.#getSingleElement(parent, tagName)?.textContent ?? null;
    }
}
