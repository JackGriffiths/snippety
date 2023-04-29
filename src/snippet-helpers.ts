import { Placeholder, Snippet } from "./snippet-model";

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

    // TODO: handle VB style of imports.
    const importStatements = snippet.namespaces
        .filter(i => i !== "")
        .map(i => i.endsWith(";") ? i : `${i};`)
        .map(i => `using ${i}`)
        .join("\n");

    if (importStatements !== "") {
        preview += `${importStatements}\n\n`;
    }

    let code = snippet.code;

    const getPlaceholderPreview = (placeholder: Placeholder) => placeholder.defaultValue || placeholder.name;
    const replacePlaceholder = (name: string, replacement: string) => code.replaceAll(`$${name}$`, replacement);

    // Remove the reserved placeholders from the code.
    for (let name of reservedPlaceholders) {
        code = replacePlaceholder(name, "");
    }

    for (let placeholder of snippet.placeholders) {
        code = replacePlaceholder(placeholder.name, getPlaceholderPreview(placeholder));
    }

    preview += code;

    return preview;
}
