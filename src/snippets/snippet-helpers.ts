import { regexEscape } from "../utilities/regex";
import { defaultDelimiter, Language, Snippet } from "./snippet-model";

const reservedPlaceholders: ReadonlySet<string> = new Set(["selected", "end"]);

export function createPlaceholderRegex(delimiter: string) {
    const escapedDelimiter = regexEscape(delimiter);
    const pattern = escapedDelimiter + "(\\w+)" + escapedDelimiter;
    return new RegExp(pattern, "g");
}

export function parsePlaceholdersFromCode(code: string, placeholderRegex: RegExp): Set<string> {
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
    const delimiter = snippet.delimiter || defaultDelimiter;
    const replacePlaceholder = (name: string, replacement: string) => code.replaceAll(`${delimiter}${name}${delimiter}`, replacement);

    // Remove the reserved placeholders from the code.
    for (const name of reservedPlaceholders) {
        code = replacePlaceholder(name, "");
    }

    for (const placeholder of snippet.placeholders) {
        code = replacePlaceholder(placeholder.name, placeholder.defaultValue);
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
