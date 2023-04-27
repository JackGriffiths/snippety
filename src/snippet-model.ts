export interface SnippetModel {
    format: string;
    title: string;
    shortcut: string;
    description: string;
    author: string;
    helpUrl: string;
    language: string;
    code: string;
    placeholders: Placeholder[];
    namespaces: string[];
    types: SnippetType[];
}

export interface Placeholder {
    name: string;
    defaultValue: string;
    tooltip: string;
    isEditable: boolean;
}

export enum SnippetType {
    Expansion = "Expansion",
    SurroundsWith = "SurroundsWith",
    Refactoring = "Refactoring",
}

export const snippetTypeDescriptions: ReadonlyMap<SnippetType, string> = new Map([
    [SnippetType.Expansion, "Expansion"],
    [SnippetType.SurroundsWith, "Surrounds With"],
    [SnippetType.Refactoring, "Refactoring"],
])

export function createDefaultSnippet(): SnippetModel {
    return {
        format: "1.0.0",
        title: "",
        shortcut: "",
        description: "",
        author: "",
        helpUrl: "",
        language: "",
        code: "",
        placeholders: [],
        namespaces: [],
        types: [],
    };
}
