export interface Snippet {
    format: string;
    title: string;
    shortcut: string;
    description: string;
    author: string;
    language: Language | "";
    code: string;
    placeholders: Placeholder[];
    delimiter: string;
    namespaces: string[];
    types: SnippetType[];
    kind: SnippetKind;
}

export const defaultDelimiter = "$";
export const reservedPlaceholders: ReadonlySet<string> = new Set(["selected", "end"]);

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

export function getLanguageById(id: string | null): Language | null {
    if (id === null || id === "") {
        return null;
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

    return null;
}

export function getShortcutRegexPatternForLanguage(language: Language | "") {
    switch (language) {
        case Language.Css:
            // The @ char followed by alphanumeric and underscore chars
            return "@[A-Za-z0-9_]*";
        case Language.Cpp:
            // Alphanumeric chars only
            return "[A-Za-z0-9]*";
        default:
            // Alphanumeric and underscore chars
            return "[A-Za-z0-9_]*";
    }
}

export interface Placeholder {
    name: string;
    defaultValue: string;
    function: string;
    tooltip: string;
    isEditable: boolean;
}

export enum SnippetType {
    Expansion = "Expansion",
    SurroundsWith = "SurroundsWith",
    Refactoring = "Refactoring",
}
type SnippetTypeKey = keyof typeof SnippetType;

export const snippetTypeDescriptions: ReadonlyMap<SnippetType, string> = new Map([
    [SnippetType.Expansion, "Expansion"],
    [SnippetType.SurroundsWith, "Surrounds With"],
    [SnippetType.Refactoring, "Refactoring"],
]);

export function getSnippetTypeByValue(value: string | null): SnippetType | null {
    if (value === null || value === "") {
        return null;
    }

    // We use this so we can do case insensitive searching.
    const valueUpperCase = value.toUpperCase();

    const matchingKey = Object
        .keys(SnippetType)
        .find(i => SnippetType[i as SnippetTypeKey].toUpperCase() === valueUpperCase) as SnippetTypeKey | undefined;

    return matchingKey === undefined ? null : SnippetType[matchingKey];
}

export enum SnippetKind {
    Any = "any",
    File = "file",
    TypeDeclaration = "type decl",
    MethodDeclaration = "method decl",
    MethodBody = "method body",
}
type SnippetKindKey = keyof typeof SnippetKind;

export const snippetKindDescriptions: ReadonlyMap<SnippetKind, string> = new Map([
    [SnippetKind.Any, "Any"],
    [SnippetKind.File, "File"],
    [SnippetKind.TypeDeclaration, "Type Declaration"],
    [SnippetKind.MethodDeclaration, "Method Declaration"],
    [SnippetKind.MethodBody, "Method Body"],
]);

export function getSnippetKindByValue(value: string | null): SnippetKind | null {
    if (value === null || value === "") {
        return null;
    }

    // We use this so we can do case insensitive searching.
    const valueUpperCase = value.toUpperCase();

    const matchingKey = Object
        .keys(SnippetKind)
        .find(i => SnippetKind[i as SnippetKindKey].toUpperCase() === valueUpperCase) as SnippetKindKey | undefined;

    return matchingKey === undefined ? null : SnippetKind[matchingKey];
}

export function createDefaultSnippet(): Snippet {
    return {
        format: "1.0.0",
        title: "",
        shortcut: "",
        description: "",
        author: "",
        language: "",
        code: "",
        placeholders: [],
        delimiter: "",
        namespaces: [],
        types: [],
        kind: SnippetKind.Any,
    };
}
