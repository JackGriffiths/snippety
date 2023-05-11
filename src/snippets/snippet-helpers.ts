import { Language, Placeholder, Snippet } from "./snippet-model";

const reservedPlaceholders: ReadonlySet<string> = new Set(["selected", "end"]);

export function parsePlaceholdersFromCode(code: string): Set<string> {
    const placeholderRegex = /\$(\w+)\$/g;
    const foundPlaceholders = new Set<string>([]);

    for (const match of code.matchAll(placeholderRegex)) {
        const name = match[1];

        if (reservedPlaceholders.has(name) || foundPlaceholders.has(name)) {
            continue;
        }

        foundPlaceholders.add(name);
    }

    return foundPlaceholders;
}

export function generateCodePreview(snippet: Snippet) {
    let preview = "";

    if (snippet.language !== "") {
        const importStatements = formatImports(snippet.namespaces, snippet.language);

        if (importStatements !== "") {
            preview += `${importStatements}\n\n`;
        }
    }

    let code = snippet.code;
    const getPlaceholderPreview = (placeholder: Placeholder) => placeholder.defaultValue || placeholder.name;
    const replacePlaceholder = (name: string, replacement: string) => code.replaceAll(`$${name}$`, replacement);

    // Remove the reserved placeholders from the code.
    for (const name of reservedPlaceholders) {
        code = replacePlaceholder(name, "");
    }

    for (const placeholder of snippet.placeholders) {
        code = replacePlaceholder(placeholder.name, getPlaceholderPreview(placeholder));
    }

    preview += code;

    return preview;
}

function formatImports(namespaces: string[], language: Language) {
    const nonEmptyNamespaces = namespaces.filter(i => i !== "");

    if (nonEmptyNamespaces.length === 0) {
        return "";
    }

    const importFormatter =
        language === Language.CSharp ? (namespace: string) => `using ${namespace};` :
        language === Language.VisualBasic ? (namespace: string) => `Imports ${namespace}` :
        null;

    if (importFormatter === null) {
        throw Error("Language does not support imports/namespaces.");
    }

    return nonEmptyNamespaces
        .map(importFormatter)
        .join("\n");
}
