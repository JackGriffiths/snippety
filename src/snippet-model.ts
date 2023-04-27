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
}

export interface Placeholder {
    name: string;
    defaultValue: string;
    tooltip: string;
    isEditable: boolean;
}

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
    };
}
