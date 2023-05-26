import type { Placeholder, Snippet } from "../snippet-model";
import xmlFormat from "xml-formatter";

const schema = "http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet";

export function writeSnippetToXml(model: Snippet): string {
    const xml = writeXml(model);

    return xmlFormat(xml, {
        collapseContent: true,
    });
}

function writeXml(model: Snippet): string {
    const doc = document.implementation.createDocument(null, null);
    appendProcessingInstruction(doc);

    const codeSnippetsElement = appendChildElement(doc, "CodeSnippets");
    const codeSnippetElement = appendChildElement(codeSnippetsElement, "CodeSnippet");

    if (isNotNullOrWhiteSpace(model.format)){
        codeSnippetElement.setAttribute("Format", model.format);
    }

    appendHeader(codeSnippetElement, model);
    appendSnippet(codeSnippetElement, model);

    return new XMLSerializer().serializeToString(doc);
}

function appendProcessingInstruction(doc: XMLDocument) {
    const pi = doc.createProcessingInstruction("xml", "version=\"1.0\" encoding=\"utf-8\"");
    doc.appendChild(pi);
}

function appendHeader(codeSnippetElement: Node, model: Snippet) {
    const headerElement = appendChildElement(codeSnippetElement, "Header");

    if (isNotNullOrWhiteSpace(model.title)) {
        appendChildStringElement(headerElement, "Title", model.title);
    }

    if (isNotNullOrWhiteSpace(model.shortcut)) {
        appendChildStringElement(headerElement, "Shortcut", model.shortcut);
    }

    if (isNotNullOrWhiteSpace(model.description)) {
        appendChildStringElement(headerElement, "Description", model.description);
    }

    if (isNotNullOrWhiteSpace(model.author)) {
        appendChildStringElement(headerElement, "Author", model.author);
    }

    if (model.types.length > 0) {
        const snippetTypesElement = appendChildElement(headerElement, "SnippetTypes");
        const sortedSelectedTypes = Array.from(model.types).sort((a, b) => a.localeCompare(b));
        sortedSelectedTypes.forEach(type => appendChildStringElement(snippetTypesElement, "SnippetType", type));
    }
}

function appendSnippet(codeSnippetElement: Node, model: Snippet) {
    const snippetElement = appendChildElement(codeSnippetElement, "Snippet");

    if (model.placeholders.length > 0) {
        const declarationsElement = appendChildElement(snippetElement, "Declarations");
        const sortedPlaceholders = Array.from(model.placeholders).sort((a, b) => a.name.localeCompare(b.name));
        sortedPlaceholders.forEach(p => appendPlaceholder(declarationsElement, p));
    }

    if (isNotNullOrWhiteSpace(model.code)) {
        const codeElement = appendChildElement(snippetElement, "Code");
        appendCDATA(codeElement, model.code);

        if (isNotNullOrWhiteSpace(model.language)) {
            codeElement.setAttribute("Language", model.language);
        }

        if (isNotNullOrWhiteSpace(model.kind)) {
            codeElement.setAttribute("Kind", model.kind);
        }

        if (isNotNullOrWhiteSpace(model.delimiter)) {
            codeElement.setAttribute("Delimiter", model.delimiter);
        }
    }

    const validNamespaces = model.namespaces.filter(i => i !== "");
    if (validNamespaces.length > 0) {
        const importsElement = appendChildElement(snippetElement, "Imports");
        validNamespaces.forEach(n => appendNamespace(importsElement, n));
    }
}

function appendPlaceholder(declarationsElement: Node, placeholder: Placeholder) {
    const literalElement = appendChildElement(declarationsElement, "Literal");

    literalElement.setAttribute("Editable", String(placeholder.isEditable));
    appendChildStringElement(literalElement, "ID", placeholder.name);
    appendChildStringElement(literalElement, "Default", placeholder.defaultValue);

    if (isNotNullOrWhiteSpace(placeholder.function)) {
        appendChildStringElement(literalElement, "Function", placeholder.function);
    }

    if (isNotNullOrWhiteSpace(placeholder.tooltip)) {
        appendChildStringElement(literalElement, "ToolTip", placeholder.tooltip);
    }
}

function appendNamespace(importsElement: Node, namespace: string) {
    const importElement = appendChildElement(importsElement, "Import");
    appendChildStringElement(importElement, "Namespace", namespace);
}

function appendChildElement(parent: Node, name: string) {
    const doc = parent.ownerDocument ?? (parent as Document);
    const child = doc.createElementNS(schema, name);
    parent.appendChild(child);
    return child;
}

function appendChildStringElement(parent: Node, name: string, value: string) {
    const child = appendChildElement(parent, name);
    child.textContent = value;
    return child;
}

function appendCDATA(parent: Element, value: string) {
    parent.appendChild(parent.ownerDocument.createCDATASection(value));
}

function isNotNullOrWhiteSpace(value: string | null): value is string {
    return value !== null && value.trim().length !== 0;
}
