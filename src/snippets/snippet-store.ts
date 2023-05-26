import { evaluate } from "./analysis/evaluator";
import { TokenKind, parse } from "./analysis/parser";
import { defaultDelimiter, Language, Placeholder, reservedPlaceholders, Snippet, SnippetKind, SnippetType } from "./snippet-model";
import { batch, createMemo } from "solid-js";
import { createStore, produce } from "solid-js/store";

export default function createSnippetStore(createDefault: () => Snippet) {
    // Create the reactive signal for the snippet.
    const [snippet, set] = createStore<Snippet>(createDefault());
    const setWith = (func: (snippet: Snippet) => void) => set(produce(func));

    // Set up derived logic.
    const canHaveNamespaces = () => snippet.language === Language.CSharp || snippet.language === Language.VisualBasic;
    const parsedTokens = createMemo(() => parse(snippet.code, snippet.delimiter || defaultDelimiter));
    const isValidCode = () => parsedTokens().find(i => i.kind === TokenKind.BadToken) === undefined;
    const preview = createMemo(() => evaluate(snippet, parsedTokens()));

    // While editing the snippet's code, it's quite easy to briefly lose a placeholder.
    // For example, to replace the method name of this code "public int Add(int $x1$, int $x2$) {}"
    // with a placeholder, typing $ before Add would briefly cause a placeholder of "$Add(int $" to be
    // parsed. Therefore $x1$ and $x2$ would be removed from the model. Only once the closing $ was
    // added after Add would they reappear. This could be annoying if details such as the default values
    // for $x1$ and $x2$ has already been entered. To fix this, we can use a recycle bin to reinstate
    // deleted placeholders.
    const placeholderRecycleBin = new Map<string, Placeholder>();

    // This is used when opening up a snippet from a file or when doing "New".
    const replace = (snippet: Snippet) => {
        set(snippet);
        placeholderRecycleBin.clear();
    };

    // Reparse the placeholders in the code block and synchronize the model.
    const updatePlaceholders = () => {
        const [added, removed] = reparsePlaceholders(snippet);

        if (added.size === 0 && removed.size === 0) {
            // No change, nothing to do.
            return;
        }

        setWith(s => {
            // Evaluate what needs to be done to the model.
            const toRetain = s.placeholders.filter(i => !removed.has(i.name));
            const toRemove = s.placeholders.filter(i => removed.has(i.name));
            const toAdd = Array.from(added).map(i => placeholderRecycleBin.get(i) || createPlaceholder(i));

            // Update the recycle bin.
            toAdd.forEach(i => placeholderRecycleBin.delete(i.name));
            toRemove.forEach(i => placeholderRecycleBin.set(i.name, i));

            // Update the model.
            s.placeholders = toRetain;
            s.placeholders.push(...toAdd);
            s.placeholders.sort((a, b) => a.name.localeCompare(b.name));
        });
    };

    return {
        snippet,
        canHaveNamespaces,
        isValidCode,
        snippetOps: {
            new: () => replace(createDefault()),
            replace,
            preview,
            updateTitle: (title: string) =>
                set("title", title),
            updateDescription: (description: string) =>
                set("description", description),
            updateShortcut: (shortcut: string) =>
                set("shortcut", shortcut),
            updateKind: (kind: SnippetKind) =>
                set("kind", kind),
            updateAuthor: (author: string) =>
                set("author", author),
            updateLanguage: (language: Language | "") =>
                batch(() => {
                    set("language", language);
                    if (!canHaveNamespaces() && snippet.namespaces.length > 0) {
                        set("namespaces", []);
                    }
                }),
            updateCode: (code: string) =>
                batch(() => {
                    set("code", code);
                    updatePlaceholders();
                }),
            updateDelimiter: (delimiter: string) =>
                batch(() => {
                    set("delimiter", delimiter);
                    updatePlaceholders();
                }),
            types: {
                add: (type: SnippetType) => {
                    if (!snippet.types.includes(type)) {
                        setWith(s => { s.types.push(type); });
                    }
                },
                remove: (type: SnippetType) => {
                    if (snippet.types.includes(type)) {
                        setWith(s => { s.types = s.types.filter(t => t !== type); });
                    }
                },
            },
            placeholders: {
                updateDefaultValue: (index: number, value: string) =>
                    setWith(s => { s.placeholders[index].defaultValue = value; }),
                updateEditable: (index: number, isEditable: boolean) =>
                    setWith(s => { s.placeholders[index].isEditable = isEditable; }),
                updateTooltip: (index: number, value: string) =>
                    setWith(s => { s.placeholders[index].tooltip = value; }),
            },
            namespaces: {
                add: () =>
                    setWith(s => { s.namespaces.push(""); }),
                update: (index: number, value: string) =>
                    setWith(s => { s.namespaces[index] = value; }),
                remove: (index: number) =>
                    setWith(s => { s.namespaces.splice(index, 1); }),
            }
        }
    };
}

function createPlaceholder(name: string): Placeholder {
    return {
        name: name,
        defaultValue: "",
        function: "",
        tooltip: "",
        isEditable: true,
    };
}

function reparsePlaceholders(snippet: Snippet): [added: Set<string>, removed: Set<string>] {
    const previous = snippet.placeholders.map(i => i.name);
    const current = parsePlaceholders(snippet.code, snippet.delimiter || defaultDelimiter);

    const added = Array.from(current).filter(i => !previous.includes(i));
    const removed = Array.from(previous).filter(i => !current.has(i));

    return [new Set(added), new Set(removed)];
}

function parsePlaceholders(code: string, delimiter: string): Set<string> {
    const tokens = parse(code, delimiter);
    const placeholders = tokens
        .filter(i => i.kind === TokenKind.PlaceholderToken)
        .map(i => i.value as string)
        .filter(i => !reservedPlaceholders.has(i));

    return new Set(placeholders);
}
