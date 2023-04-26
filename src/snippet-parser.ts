import type { SnippetModel } from "./snippet-model";
import { createDefaultSnippet } from "./snippet-model";

export function parseSnippetFromXml(xml: string): SnippetModel {
    // TODO: what if it's not unparsable XML?
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const codeSnippets = doc.getElementsByTagName("CodeSnippet");

    if (codeSnippets.length === 0) {
        throw Error("File does not contain a code snippet.")
    }

    if (codeSnippets.length > 1) {
        throw Error("Files with multiple snippets are not supported.");
    }

    return parseCodeSnippetElement(codeSnippets[0]);
}

function parseCodeSnippetElement(codeSnippetElement: Element): SnippetModel {
    const model = createDefaultSnippet();

    model.format = codeSnippetElement.getAttribute("Format") ?? "";

    const header = getSingleElement(codeSnippetElement, "Header");

    if (header !== null) {
        model.title = getSingleStringValue(header, "Title") ?? "";
        model.shortcut = getSingleStringValue(header, "Shortcut") ?? "";
        model.description = getSingleStringValue(header, "Description") ?? "";
        model.author = getSingleStringValue(header, "Author") ?? "";
        model.helpUrl = getSingleStringValue(header, "HelpUrl") ?? "";
    }

    const snippet = getSingleElement(codeSnippetElement, "Snippet");

    if (snippet !== null) {
        const code = getSingleElement(snippet, "Code");
        if (code !== null) {
            model.language = code.getAttribute("Language") ?? "";
            model.code = code.textContent ?? "";
        }

        const imports = getSingleElement(snippet, "Imports");
        if (imports !== null) {
            model.namespaces = parseImports(imports);
        }
    }

    return model;
}

function parseImports(imports: Element) {
    const namesapces: string[] = [];

    for (const _import of imports.getElementsByTagName("Import")) {
        const namespace = getSingleStringValue(_import, "Namespace");
        if (namespace !== null) {
            namesapces.push(namespace);
        }
    }

    return namesapces;
}

function getSingleElement(parent: Element, tagName: string): Element | null {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length === 0 ? null : elements[0];
}

function getSingleStringValue(parent: Element, tagName: string): string | null {
    return getSingleElement(parent, tagName)?.textContent ?? null;
}
