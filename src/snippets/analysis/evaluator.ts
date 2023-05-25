import { Token, TokenKind } from "./parser";
import { Language, Placeholder, Snippet, reservedPlaceholders } from "../snippet-model";

export function evaluate(snippet: Snippet, tokens: Token[]): string {
    const parts = [
        formatImports(snippet.namespaces, snippet.language),
        formatCodeBlock(tokens, snippet.placeholders)
    ];

    return parts
        .filter(i => i !== "")
        .join("\n\n");
}

function formatImports(namespaces: string[], language: Language | "") {
    if (language === "") {
        return "";
    }

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

function formatCodeBlock(tokens: Token[], placeholders: Placeholder[]) {
    let code = "";
    const placeholderReplacements = new Map(placeholders.map(i => [i.name, i.defaultValue || i.name]));

    for (const token of tokens) {
        switch (token.kind) {
            case TokenKind.BadToken:
                code += token.sourceText;
                break;
            case TokenKind.LiteralToken:
                code += token.value ?? "";
                break;
            case TokenKind.PlaceholderToken:
                if (token.value !== null && !reservedPlaceholders.has(token.value)) {
                    code += placeholderReplacements.get(token.value);
                }
                break;
            case TokenKind.EndOfFileToken:
                break;
        }
    }

    return code;
}
