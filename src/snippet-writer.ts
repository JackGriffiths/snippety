import type { SnippetModel } from "./snippet-model";
import xmlFormat from "xml-formatter";

export function writeSnippetToXml(model: SnippetModel): string {
    const xml = writeXml(model);

    return xmlFormat(xml, {
        collapseContent: true,
    })
}

function writeXml(model: SnippetModel): string {
    const schema = "http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet";

    const doc = document.implementation.createDocument(null, null);
    appendProcessingInstruction(doc);

    const codeSnippets = appendChildElement(doc, schema, "CodeSnippets");
    const codeSnippet = appendChildElement(codeSnippets, schema, "CodeSnippet");

    if (isNotNullOrWhiteSpace(model.format)){
        codeSnippet.setAttribute("Format", model.format);
    }

    const header = appendChildElement(codeSnippet, schema, "Header");

    if (isNotNullOrWhiteSpace(model.title)) {
        appendChildStringElement(header, schema, "Title", model.title);
    }

    if (isNotNullOrWhiteSpace(model.shortcut)) {
        appendChildStringElement(header, schema, "Shortcut", model.shortcut);
    }

    if (isNotNullOrWhiteSpace(model.description)) {
        appendChildStringElement(header, schema, "Description", model.description);
    }

    if (isNotNullOrWhiteSpace(model.author)) {
        appendChildStringElement(header, schema, "Author", model.author);
    }

    if (isNotNullOrWhiteSpace(model.helpUrl)) {
        appendChildStringElement(header, schema, "HelpUrl", model.helpUrl);
    }

    if (model.types.length > 0) {
        const snippetTypes = appendChildElement(header, schema, "SnippetTypes");
        const sortedSelectedTypes = Array.from(model.types).sort((a, b) => a.localeCompare(b));

        for (const type of sortedSelectedTypes) {
            appendChildStringElement(snippetTypes, schema, "SnippetType", type);
        }
    }

    const snippet = appendChildElement(codeSnippet, schema, "Snippet");

    if (model.placeholders.length > 0) {
        const declarations = appendChildElement(snippet, schema, "Declarations");

        for (const placeholder of model.placeholders) {
            const literal = appendChildElement(declarations, schema, "Literal");

            literal.setAttribute("IsEditable", String(placeholder.isEditable));
            appendChildStringElement(literal, schema, "ID", placeholder.name);
            appendChildStringElement(literal, schema, "Default", placeholder.defaultValue);

            if (isNotNullOrWhiteSpace(placeholder.tooltip)) {
                appendChildStringElement(literal, schema, "ToolTip", placeholder.tooltip);
            }
        }
    }

    if (isNotNullOrWhiteSpace(model.code)) {
        const code = appendChildElement(snippet, schema, "Code");

        if (isNotNullOrWhiteSpace(model.language)) {
            code.setAttribute("Language", model.language);
        }

        if (isNotNullOrWhiteSpace(model.kind)) {
            code.setAttribute("Kind", model.kind);
        }

        code.appendChild(doc.createCDATASection(model.code));
    }

    const nonEmptyNamespaces = model.namespaces.filter(i => i !== "");

    if (nonEmptyNamespaces.length > 0) {
        const imports = appendChildElement(snippet, schema, "Imports");
        for (const namespace of nonEmptyNamespaces) {
            const _import = appendChildElement(imports, schema, "Import");
            appendChildStringElement(_import, schema, "Namespace", namespace);
        }
    }

    return new XMLSerializer().serializeToString(doc);
}

function appendProcessingInstruction(doc: XMLDocument) {
    const pi = doc.createProcessingInstruction("xml", "version=\"1.0\" encoding=\"utf-8\"");
    doc.appendChild(pi);
}

function appendChildElement(parent: Node, schema: string, name: string) {
    const doc = parent instanceof Document ? parent : parent.ownerDocument!;
    const child = doc.createElementNS(schema, name);
    parent.appendChild(child);
    return child;
}

function appendChildStringElement(parent: Node, schema: string, name: string, value: string) {
    const child = appendChildElement(parent, schema, name);
    child.textContent = value;
    return child;
}

function isNotNullOrWhiteSpace(value: string | null): value is string {
    return value !== null && value.trim().length !== 0;
}
