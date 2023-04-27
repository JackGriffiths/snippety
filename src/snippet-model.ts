export interface Snippet {
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
    kind: SnippetKind;
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
]);

export enum SnippetKind {
    Any = "any",
    File = "file",
    TypeDeclaration = "type decl",
    MethodDeclaration = "method decl",
    MethodBody = "method body",
}

export const snippetKindDescriptions: ReadonlyMap<SnippetKind, string> = new Map([
    [SnippetKind.Any, "Any"],
    [SnippetKind.File, "File"],
    [SnippetKind.TypeDeclaration, "Type Declaration"],
    [SnippetKind.MethodDeclaration, "Method Declaration"],
    [SnippetKind.MethodBody, "Method Body"],
]);

export function createDefaultSnippet(): Snippet {
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
        kind: SnippetKind.Any,
    };
}
