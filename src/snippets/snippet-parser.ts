import {
    getLanguageById,
    getSnippetKindByValue,
    getSnippetTypeByValue,
    Placeholder,
    Snippet,
    SnippetKind,
    SnippetType,
} from "./snippet-model";
import { createDefaultSnippet } from "./snippet-model";
import Result, * as res from "../utilities/result";

export function parseSnippetFromXml(xml: string): Result<Snippet> {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const snippets = doc.getElementsByTagName("CodeSnippet");

    if (snippets.length === 0) {
        return res.error<Snippet>("File does not contain a code snippet.");
    }

    if (snippets.length > 1) {
        return res.error<Snippet>("Files with multiple snippets are not supported.");
    }

    return res.ok(parseSnippetFromElement(snippets[0]));
}

function parseSnippetFromElement(codeSnippetElement: Element): Snippet {
    const model = createDefaultSnippet();

    model.format = codeSnippetElement.getAttribute("Format") ?? "1.0.0";

    const headerElement = getSingleElement(codeSnippetElement, "Header");

    if (headerElement !== null) {
        model.title = getSingleStringValue(headerElement, "Title") ?? "";
        model.shortcut = getSingleStringValue(headerElement, "Shortcut") ?? "";
        model.description = getSingleStringValue(headerElement, "Description") ?? "";
        model.author = getSingleStringValue(headerElement, "Author") ?? "";
        model.helpUrl = getSingleStringValue(headerElement, "HelpUrl") ?? "";

        const types = getSingleElement(headerElement, "SnippetTypes");
        if (types !== null) {
            model.types = parseTypes(types);
        }
    }

    const snippetElement = getSingleElement(codeSnippetElement, "Snippet");

    if (snippetElement !== null) {
        const codeElement = getSingleElement(snippetElement, "Code");
        if (codeElement !== null) {
            model.language = getLanguageById(codeElement.getAttribute("Language")) ?? "";
            model.code = codeElement.textContent ?? "";
            model.kind = getSnippetKindByValue(codeElement.getAttribute("Kind")) ?? SnippetKind.Any;
            model.delimiter = codeElement.getAttribute("Delimiter") ?? "";
        }

        const declarationsElement = getSingleElement(snippetElement, "Declarations");
        if (declarationsElement !== null) {
            model.placeholders = parseDeclarations(declarationsElement);
        }

        const importsElement = getSingleElement(snippetElement, "Imports");
        if (importsElement !== null) {
            model.namespaces = parseImports(importsElement);
        }
    }

    return model;
}

function parseTypes(headerElement: Element) {
    const types: SnippetType[] = [];

    for (const element of headerElement.getElementsByTagName("SnippetType")) {
        const type = getSnippetTypeByValue(element.textContent);
        if (type !== null) {
            types.push(type);
        }
    }

    return types;
}

function parseDeclarations(declarationsElement: Element) {
    const placeholders: Placeholder[] = [];

    for (const element of declarationsElement.getElementsByTagName("Literal")) {
        const name = getSingleStringValue(element, "ID");
        if (name === null) {
            continue;
        }

        // If the attribute is ommitted then the default value is true.
        // Hence, we check that the value is NOT false.
        const isEditable = Boolean(element.getAttribute("Editable")?.toLowerCase() !== "false");

        placeholders.push({
            name: name,
            defaultValue: getSingleStringValue(element, "Default") ?? "",
            function: getSingleStringValue(element, "Function") ?? "",
            tooltip: getSingleStringValue(element, "ToolTip") ?? "",
            isEditable: isEditable,
        });
    }

    return placeholders;
}

function parseImports(importsElement: Element) {
    const namespaces: string[] = [];

    for (const element of importsElement.getElementsByTagName("Import")) {
        const namespace = getSingleStringValue(element, "Namespace");
        if (namespace !== null) {
            namespaces.push(namespace);
        }
    }

    return namespaces;
}

function getSingleElement(parent: Element, tagName: string): Element | null {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length === 0 ? null : elements[0];
}

function getSingleStringValue(parent: Element, tagName: string): string | null {
    return getSingleElement(parent, tagName)?.textContent ?? null;
}
