import xmlFormat from "xml-formatter";

export class SnippetWriter {
    static readonly #schema = "http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet";

    static toXml(snippet: { format: string, title: string, description: string | null}): string {
        const xml = SnippetWriter.#writeXml(snippet);

        return xmlFormat(xml, {
            collapseContent: true,
        })
    }

    static #writeXml(snippet: { format: string, title: string, description: string | null}): string {
        const doc = document.implementation.createDocument(null, null);
        SnippetWriter.#appendProcessingInstruction(doc);

        const codeSnippets = SnippetWriter.#appendChildElement(doc, SnippetWriter.#schema, "CodeSnippets");
        const codeSnippet = SnippetWriter.#appendChildElement(codeSnippets, SnippetWriter.#schema, "CodeSnippet");
        codeSnippet.setAttribute("Format", snippet.format);

        const header = SnippetWriter.#appendChildElement(codeSnippet, SnippetWriter.#schema, "Header");

        SnippetWriter.#appendChildStringElement(header, SnippetWriter.#schema, "Title", snippet.title);

        if (snippet.description !== null) {
            SnippetWriter.#appendChildStringElement(header, SnippetWriter.#schema, "Description", snippet.description);
        }

        return new XMLSerializer().serializeToString(doc);
    }

    static #appendProcessingInstruction(doc: XMLDocument) {
        const pi = doc.createProcessingInstruction("xml", "version=\"1.0\" encoding=\"utf-8\"");
        doc.appendChild(pi);
    }

    static #appendChildElement(parent: Node, schema: string, name: string) {
        const doc = parent instanceof Document ? parent : parent.ownerDocument!;
        const child = doc.createElementNS(schema, name);
        parent.appendChild(child);
        return child;
    }

    static #appendChildStringElement(parent: Node, schema: string, name: string, value: string) {
        const child = SnippetWriter.#appendChildElement(parent, schema, name);
        child.textContent = value;
        return child;
    }
}
