export interface Snippet {
    format: string;
    title: string;
    shortcut: string;
    description: string;
    author: string;
    helpUrl: string;
    language: Language | "";
    code: string;
    placeholders: Placeholder[];
    namespaces: string[];
    types: SnippetType[];
    kind: SnippetKind;
}

export enum Language {
    Cpp = "CPP",
    CSharp = "CSharp",
    Css = "CSS",
    Html = "HTML",
    JavaScript = "JavaScript",
    Sql = "SQL",
    TypeScript = "TypeScript",
    VisualBasic = "VB",
    Xaml = "XAML",
    Xml = "XML",
}
type LanguageKey = keyof typeof Language;

export function getLanguageById(id: string | null): Language | "" {
    if (id === null || id === "") {
        return "";
    }

    // We use this so we can do case insensitive searching.
    const upperId = id.toUpperCase();

    const matchingKey = Object
        .keys(Language)
        .find(i => Language[i as LanguageKey].toUpperCase() === upperId) as LanguageKey | undefined;

    if (matchingKey !== undefined) {
        return Language[matchingKey];
    }

    // Some languages have alternative aliases. These should be defined in upper case.
    if (["C++", "C"].includes(upperId)) {
        return Language.Cpp;
    }

    if (upperId === "SQL_SSDT") {
        return Language.Sql;
    }

    return "";
}

export const languageDescriptions: ReadonlyMap<Language, string> = new Map([
    [Language.CSharp, "C#"],
    [Language.Cpp, "C++"],
    [Language.Css, "CSS"],
    [Language.Html, "HTML"],
    [Language.JavaScript, "JavaScript"],
    [Language.Sql, "SQL"],
    [Language.TypeScript, "TypeScript"],
    [Language.VisualBasic, "Visual Basic"],
    [Language.Xaml, "XAML"],
    [Language.Xml, "XML"],
]);

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
