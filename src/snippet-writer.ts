import { SnippetModel } from "./snippet-model";
import xmlFormat from "xml-formatter";

export class SnippetWriter {
    static readonly #schema = "http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet";

    static toXml(model: SnippetModel): string {
        const xml = SnippetWriter.#writeXml(model);

        return xmlFormat(xml, {
            collapseContent: true,
        })
    }

    static #writeXml(model: SnippetModel): string {
        const doc = document.implementation.createDocument(null, null);
        SnippetWriter.#appendProcessingInstruction(doc);

        const codeSnippets = SnippetWriter.#appendChildElement(doc, SnippetWriter.#schema, "CodeSnippets");
        const codeSnippet = SnippetWriter.#appendChildElement(codeSnippets, SnippetWriter.#schema, "CodeSnippet");

        if (SnippetWriter.#isNotNullOrWhiteSpace(model.format)){
            codeSnippet.setAttribute("Format", model.format);
        }

        const header = SnippetWriter.#appendChildElement(codeSnippet, SnippetWriter.#schema, "Header");

        if (SnippetWriter.#isNotNullOrWhiteSpace(model.title)) {
            SnippetWriter.#appendChildStringElement(header, SnippetWriter.#schema, "Title", model.title);
        }

        if (SnippetWriter.#isNotNullOrWhiteSpace(model.shortcut)) {
            SnippetWriter.#appendChildStringElement(header, SnippetWriter.#schema, "Shortcut", model.shortcut);
        }

        if (SnippetWriter.#isNotNullOrWhiteSpace(model.description)) {
            SnippetWriter.#appendChildStringElement(header, SnippetWriter.#schema, "Description", model.description);
        }

        if (SnippetWriter.#isNotNullOrWhiteSpace(model.author)) {
            SnippetWriter.#appendChildStringElement(header, SnippetWriter.#schema, "Author", model.author);
        }

        if (SnippetWriter.#isNotNullOrWhiteSpace(model.helpUrl)) {
            SnippetWriter.#appendChildStringElement(header, SnippetWriter.#schema, "HelpUrl", model.helpUrl);
        }

        const snippet = SnippetWriter.#appendChildElement(codeSnippet, SnippetWriter.#schema, "Snippet");

        if (SnippetWriter.#isNotNullOrWhiteSpace(model.code)) {
            const code = SnippetWriter.#appendChildElement(snippet, SnippetWriter.#schema, "Code");

            if (SnippetWriter.#isNotNullOrWhiteSpace(model.language)) {
                code.setAttribute("Language", model.language);
            }

            code.appendChild(doc.createCDATASection(model.code));
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

    static #isNotNullOrWhiteSpace(value: string | null): value is string {
        return value !== null && value.trim().length !== 0;
    }
}
