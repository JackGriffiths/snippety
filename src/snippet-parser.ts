export class SnippetParser {

    static fromXml(xml: string) {
        const doc = new DOMParser().parseFromString(xml, "application/xml");

        const codeSnippets = doc.getElementsByTagName("CodeSnippet");
        if (codeSnippets.length > 1) {
            throw Error("Files with multiple snippets are not supported.");
        }

        const codeSnippet = codeSnippets[0];

        const header = SnippetParser.#getSingleElementOrNull(codeSnippet, "Header");

        if (header !== null) {
            const title = SnippetParser.#getSingleStringValueOrNull(header, "Title");
            const description = SnippetParser.#getSingleStringValueOrNull(header, "Description");

            return {
                title: title,
                description: description
            };
        }

        return {
            title: null,
            description: null
        }
    }

    static #getSingleElementOrNull(parent: Element, tagName: string): Element | null {
        const elements = parent.getElementsByTagName(tagName);
        return elements.length === 0 ? null : elements[0];
    }

    static #getSingleStringValueOrNull(parent: Element, tagName: string): string | null {
        return SnippetParser.#getSingleElementOrNull(parent, tagName)?.textContent ?? null;
    }
}
