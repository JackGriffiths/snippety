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

    model.format = codeSnippetElement.getAttribute("Format") ?? "";

    const header = getSingleElement(codeSnippetElement, "Header");

    if (header !== null) {
        model.title = getSingleStringValue(header, "Title") ?? "";
        model.shortcut = getSingleStringValue(header, "Shortcut") ?? "";
        model.description = getSingleStringValue(header, "Description") ?? "";
        model.author = getSingleStringValue(header, "Author") ?? "";
        model.helpUrl = getSingleStringValue(header, "HelpUrl") ?? "";

        const types = getSingleElement(header, "SnippetTypes");
        if (types !== null) {
            model.types = parseTypes(types);
        }
    }

    const snippet = getSingleElement(codeSnippetElement, "Snippet");

    if (snippet !== null) {
        const code = getSingleElement(snippet, "Code");
        if (code !== null) {
            model.language = getLanguageById(code.getAttribute("Language")) ?? "";
            model.code = code.textContent ?? "";
            model.kind = getSnippetKindByValue(code.getAttribute("Kind")) ?? SnippetKind.Any;
        }

        const declarations = getSingleElement(snippet, "Declarations");
        if (declarations !== null) {
            model.placeholders = parseDeclarations(declarations);
        }

        const imports = getSingleElement(snippet, "Imports");
        if (imports !== null) {
            model.namespaces = parseImports(imports);
        }
    }

    return model;
}

function parseTypes(header: Element) {
    const types: SnippetType[] = [];

    for (const element of header.getElementsByTagName("SnippetType")) {
        const type = getSnippetTypeByValue(element.textContent);
        if (type !== null) {
            types.push(type);
        }
    }

    return types;
}

function parseDeclarations(declarations: Element) {
    const placeholders: Placeholder[] = [];

    for (const literal of declarations.getElementsByTagName("Literal")) {
        const name = getSingleStringValue(literal, "ID");
        if (name === null) {
            continue;
        }

        // If the attribute is ommitted then the default value is true.
        // Hence, we check that the value is NOT false.
        const isEditable = Boolean(literal.getAttribute("Editable")?.toLowerCase() !== "false");

        placeholders.push({
            name: name,
            defaultValue: getSingleStringValue(literal, "Default") ?? "",
            function: getSingleStringValue(literal, "Function") ?? "",
            tooltip: getSingleStringValue(literal, "ToolTip") ?? "",
            isEditable: isEditable,
        });
    }

    return placeholders;
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
