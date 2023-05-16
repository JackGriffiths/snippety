import { createFileManager, isSaveAsEnabled } from "./snippets/snippet-file-manager";
import { generateCodePreview, parsePlaceholdersFromCode } from "./snippets/snippet-helpers";
import {
    createDefaultSnippet,
    Language,
    languageDescriptions,
    Snippet,
    snippetKindDescriptions,
    SnippetType,
    snippetTypeDescriptions
} from "./snippets/snippet-model";
import { parseSnippetFromXml } from "./snippets/snippet-parser";
import { writeSnippetToXml } from "./snippets/snippet-writer";
import { makeFileDragAndDropHandler } from "./utilities/file-drag-and-drop";
import { createDirtyFlag, makeLeavePrompt } from "./utilities/unsaved-changes";
import { registerWebComponents } from "./web-components";
import type { FileWithHandle } from "browser-fs-access";
import { batch, createEffect, createMemo, createUniqueId, For, Index, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { render } from "solid-js/web";
import { createStorageSignal } from "@solid-primitives/storage";

registerWebComponents();

function App() {
    const [fileName, { tryOpen, tryPick, trySave, trySaveAs, closeFile }] = createFileManager(parseSnippetFromXml, writeSnippetToXml);

    const [defaultAuthor, setDefaultAuthor] = createStorageSignal("default-author", "");
    const [defaultHelpUrl, setDefaultHelpUrl] = createStorageSignal("default-help-url", "");

    const [snippet, updateSnippet] = createStore<Snippet>(createNewSnippet());
    const canHaveNamespaces = () => snippet.language === Language.CSharp || snippet.language === Language.VisualBasic;
    const [isDirty, markClean] = createDirtyFlag(snippet);

    const pageTitle = () => `${isDirty() ? "*" : ""}${fileName() ?? "New Snippet"}`;
    createEffect(() => document.title = `${pageTitle()} - Snippety`);
    makeFileDragAndDropHandler(document.body, "link", "application/xml", fileDropped);
    makeLeavePrompt(() => isDirty(), "Are you sure you want to leave? There are unsaved changes that will be lost.");

    function Page() {
        return (
            <div id="page-container">
                <Toolbar />
                <div id="form-and-preview">
                    <Form />
                    <Preview />
                </div>
            </div>
        );
    }

    function Toolbar() {
        return (
            <div class="button-toolbar">
                <SaveButtons />

                <button type="button" onClick={newSnippet}>
                    New
                </button>

                <button type="button" onClick={openSnippet}>
                    Open File...
                </button>
            </div>
        );
    }

    function SaveButtons() {
        return (
            <>
                <button type="submit" class="accent" form="main-form" data-submit-type="save">
                    Save
                </button>

                <Show when={isSaveAsEnabled}>
                    <button type="submit" form="main-form" data-submit-type="save-as">
                        Save As...
                    </button>
                </Show>
            </>
        );
    }

    function Form() {
        const shortcutPattern = () => snippet.language === Language.Css ? "@[A-Za-z0-9_]*" : "[A-Za-z0-9_]*";

        return (
            <div id="inputs">
                <h1 id="page-title">
                    {pageTitle()}
                </h1>

                <form id="main-form" action="" onSubmit={saveSnippet}>
                    <div>
                        <label for="title" class="required">
                            Title
                        </label>

                        <input
                            id="title"
                            type="text"
                            autocomplete="off"
                            required
                            value={snippet.title}
                            onInput={e => updateSnippet("title", e.target.value)} />

                        <p class="help-text">
                            The title appears in IntelliSense when browsing code snippets.
                        </p>
                    </div>

                    <div>
                        <label for="description">
                            Description
                        </label>

                        <textarea
                            id="description"
                            rows="3"
                            autocomplete="off"
                            placeholder="e.g. Code snippet for..."
                            value={snippet.description}
                            onInput={e => updateSnippet("description", e.target.value)} />

                        <p class="help-text">
                            The description appears in IntelliSense when browsing code snippets.
                        </p>
                    </div>

                    <div>
                        <label for="shortcut">
                            Shortcut
                        </label>

                        <input
                            id="shortcut"
                            type="text"
                            autocomplete="off"
                            pattern={shortcutPattern()}
                            value={snippet.shortcut}
                            onInput={e => updateSnippet("shortcut", e.target.value)} />

                        <p class="help-text">
                            Must only contain alphanumeric characters or underscores. The exception is that CSS
                            snippets must start with the @ character.
                        </p>

                        <p class="help-text">
                            Snippets without a shortcut can still be inserted using the context menu in Visual Studio.
                        </p>
                    </div>

                    <div>
                        <label for="language" class="required">
                            Language
                        </label>

                        <select
                            id="language"
                            required
                            value={snippet.language}
                            onInput={e => updateLanguage(e.target.value as Language | "")}>

                            <option value="">Choose a language...</option>
                            <For each={Array.from(languageDescriptions)}>{([value, description]) =>
                                <option value={value}>{description}</option>
                            }</For>
                        </select>
                    </div>

                    <div>
                        <label for="code" class="required">
                            Code
                        </label>

                        <textarea
                            id="code"
                            rows="7"
                            autocomplete="off"
                            required
                            value={snippet.code}
                            onInput={e => updateSnippetCode(e.target.value)} />

                        <p class="help-text">
                            Use placeholders like <code>$name$</code> to define parts of the code which will be replaced.
                            There are two reserved placeholders that you can use in your snippets.
                        </p>

                        <p class="help-text">
                            <code>$end$</code> marks the location to place the cursor after the code snippet is inserted. It is
                            recommended that this placeholder is included in all snippets.
                        </p>

                        <p class="help-text">
                            <code>$selected$</code> represents text selected in the document that is to be inserted into the snippet
                            when it is invoked. This is only relevant for "Surrounds With" snippets.
                        </p>
                    </div>

                    <div>
                        <label>
                            Placeholders
                        </label>

                        <Show
                            when={snippet.placeholders.length > 0}
                            fallback={<p class="help-text">No custom placeholders.</p>}>

                            <ol id="placeholders">
                                <For each={snippet.placeholders}>{(placeholder, index) => {

                                    const defaultValueInputId = createUniqueId();
                                    const editableInputId = createUniqueId();
                                    const tooltipInputId = createUniqueId();

                                    return (
                                        <li>
                                            <p>{`$${placeholder.name}$`}</p>

                                            <div class="placeholder-inputs">
                                                <div>
                                                    <label for={defaultValueInputId} class="required">
                                                        Default Value
                                                    </label>

                                                    <input
                                                        id={defaultValueInputId}
                                                        type="text"
                                                        required
                                                        value={placeholder.defaultValue}
                                                        onInput={e => updatePlaceholderDefaultValue(index(), e.target.value)} />

                                                    <div style={{"margin-block-start": "0.75rem"}}>
                                                        <input
                                                            id={editableInputId}
                                                            type="checkbox"
                                                            checked={placeholder.isEditable}
                                                            onChange={e => updatePlaceholderEditable(index(), e.target.checked)} />

                                                        <label for={editableInputId}>
                                                            Editable after inserted?
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label for={tooltipInputId}>
                                                        Description
                                                    </label>

                                                    <input
                                                        id={tooltipInputId}
                                                        type="text"
                                                        value={placeholder.tooltip}
                                                        onInput={e => updatePlaceholderTooltip(index(), e.target.value)} />
                                                </div>
                                            </div>
                                        </li>
                                    );
                                }}</For>
                            </ol>
                        </Show>
                    </div>

                    <Show when={canHaveNamespaces()}>
                        <div>
                            <label>
                                Imports
                            </label>

                            <p class="help-text">
                                The namespaces that need to be imported for this snippet to compile.
                            </p>

                            <div id="imports">
                                <Index each={snippet.namespaces}>{(namespace, index) =>
                                    <div class="import">
                                        <input
                                            type="text"
                                            placeholder="e.g. System.Linq"
                                            value={namespace()}
                                            onInput={e => updateNamespace(index, e.target.value)} />

                                        <button type="button" onClick={() => removeNamespace(index)}>
                                            Remove
                                        </button>
                                    </div>
                                }</Index>
                            </div>

                            <button type="button" onClick={addNamespace}>
                                Add
                            </button>
                        </div>
                    </Show>

                    <div>
                        <label>
                            Type
                        </label>

                        <p class="help-text">
                            Specifies the type of snippet. If no types are selected, the snippet can be inserted anywhere in the code.
                        </p>

                        <fieldset>
                            <legend class="screen-reader-only">
                                Choose types
                            </legend>

                            <For each={Array.from(snippetTypeDescriptions)}>{([value, description]) => {
                                const checkboxInputId = createUniqueId();

                                return (
                                    <Show when={value !== SnippetType.Refactoring || snippet.types.includes(SnippetType.Refactoring)}>
                                        <div>
                                            <input
                                                id={checkboxInputId}
                                                type="checkbox"
                                                checked={snippet.types.includes(value)}
                                                onChange={e => toggleType(value, e.target.checked)} />

                                            <label for={checkboxInputId}>
                                                {description}
                                            </label>
                                        </div>
                                    </Show>
                                );
                            }}</For>
                        </fieldset>
                    </div>

                    <div>
                        <label>
                            Kind
                        </label>

                        <p class="help-text">
                            Specifies the kind of code that the snippet contains.
                        </p>

                        <fieldset>
                            <legend class="screen-reader-only">
                                Choose a kind
                            </legend>

                            <For each={Array.from(snippetKindDescriptions)}>{([value, description]) => {
                                const radioInputId = createUniqueId();

                                return (
                                    <div>
                                        <input
                                            id={radioInputId}
                                            type="radio"
                                            name="kind"
                                            checked={snippet.kind === value}
                                            onChange={() => updateSnippet("kind", value)} />

                                        <label for={radioInputId}>
                                            {description}
                                        </label>
                                    </div>
                                );
                            }}</For>
                        </fieldset>
                    </div>

                    <div>
                        <label for="author">
                            Author
                        </label>

                        <div class="input-group flex-horizontal flex-wrap" style={{"gap": "1rem"}}>
                            <input
                                id="author"
                                type="text"
                                autocomplete="name"
                                value={snippet.author}
                                onInput={e => updateSnippet("author", e.target.value)} />

                            <Show when={snippet.author !== defaultAuthor()}>
                                <button type="button" class="flex-no-shrink" onClick={() => setDefaultAuthor(snippet.author)}>
                                    Save As Default
                                </button>
                            </Show>
                        </div>

                    </div>

                    <div>
                        <label for="helpUrl">
                            Help URL
                        </label>

                        <div class="input-group flex-horizontal flex-wrap" style={{"gap": "1rem"}}>
                            <input
                                id="helpUrl"
                                type="url"
                                autocomplete="off"
                                value={snippet.helpUrl}
                                onInput={e => updateSnippet("helpUrl", e.target.value)} />

                            <Show when={snippet.helpUrl !== defaultHelpUrl()}>
                                <button type="button" class="flex-no-shrink" onClick={() => setDefaultHelpUrl(snippet.helpUrl)}>
                                    Save As Default
                                </button>
                            </Show>
                        </div>
                    </div>

                    <div class="button-toolbar">
                        <SaveButtons />
                    </div>
                </form>
            </div>
        );
    }

    function Preview() {
        const codePreview = createMemo(() => generateCodePreview(snippet));

        return (
            <div id="preview">
                <h2 class="screen-reader-only">
                    Preview
                </h2>

                <highlighted-code-block attr:language={snippet.language} attr:code={codePreview()} />
            </div>
        );
    }

    function newSnippet() {
        if (isDirty() && !confirm("Are you sure you want to create a new snippet? There are unsaved changes that will be lost.")) {
            return;
        }

        batch(() => {
            closeFile();
            updateSnippet(createNewSnippet());
            markClean();
        });
    }

    function createNewSnippet() {
        const newSnippet = createDefaultSnippet();
        newSnippet.author = defaultAuthor() ?? "";
        newSnippet.helpUrl = defaultHelpUrl() ?? "";
        return newSnippet;
    }

    async function openSnippet() {
        if (isDirty() && !confirm("Are you sure you want to open a file? There are unsaved changes that will be lost.")) {
            return;
        }

        const snippet = await tryPick();
        if (snippet === null) {
            return;
        }

        batch(() => {
            updateSnippet(snippet);
            markClean();
        });
    }

    async function fileDropped(file: FileWithHandle) {
        if (isDirty() && !confirm("Are you sure you want to open this file? There are unsaved changes that will be lost.")) {
            return;
        }

        const snippet = await tryOpen(file);
        if (snippet === null) {
            return;
        }

        batch(() => {
            updateSnippet(snippet);
            markClean();
        });
    }

    async function saveSnippet(e: SubmitEvent) {
        e.preventDefault();

        const useSaveAs = e.submitter?.dataset.submitType === "save-as";
        const wasSaved = useSaveAs ? await trySaveAs(snippet) : await trySave(snippet);

        if (wasSaved) {
            markClean();
        }
    }

    function updateLanguage(language: Language | "") {
        batch(() => {
            updateSnippet("language", language);

            if (!canHaveNamespaces() && snippet.namespaces.length > 0) {
                updateSnippet("namespaces", []);
            }
        });
    }

    function updateSnippetCode(code: string) {
        const previousPlaceholderNames = snippet.placeholders.map(i => i.name);
        const currentPlaceholdersNames = parsePlaceholdersFromCode(code);

        const removedPlaceholderNames = Array.from(previousPlaceholderNames).filter(i => !currentPlaceholdersNames.has(i));
        const newPlaceholderNames = Array.from(currentPlaceholdersNames).filter(i => !previousPlaceholderNames.includes(i));

        batch(() => {
            updateSnippet("code", code);

            if (removedPlaceholderNames.length > 0 || newPlaceholderNames.length > 0) {
                const placeholdersToRetain = snippet.placeholders.filter(i => !removedPlaceholderNames.includes(i.name));
                const placeholdersToAdd = newPlaceholderNames.map(i => ({
                    name: i,
                    defaultValue: "",
                    function: "",
                    tooltip: "",
                    isEditable: true,
                }));

                updateSnippet(produce(s => {
                    s.placeholders = placeholdersToRetain;
                    s.placeholders.push(...placeholdersToAdd);
                    s.placeholders.sort((a, b) => a.name.localeCompare(b.name));
                }));
            }
        });
    }

    function updatePlaceholderDefaultValue(placeholderIndex: number, value: string) {
        updateSnippet(produce(s => { s.placeholders[placeholderIndex].defaultValue = value; }));
    }

    function updatePlaceholderEditable(placeholderIndex: number, isEditable: boolean) {
        updateSnippet(produce(s => { s.placeholders[placeholderIndex].isEditable = isEditable; }));
    }

    function updatePlaceholderTooltip(placeholderIndex: number, value: string) {
        updateSnippet(produce(s => { s.placeholders[placeholderIndex].tooltip = value; }));
    }

    function addNamespace() {
        updateSnippet(produce(s => { s.namespaces.push(""); }));
    }

    function updateNamespace(index: number, value: string) {
        updateSnippet(produce(s => { s.namespaces[index] = value; }));
    }

    function removeNamespace(index: number) {
        updateSnippet(produce(s => { s.namespaces.splice(index, 1); }));
    }

    function toggleType(type: SnippetType, isSelected: boolean) {
        if (isSelected && !snippet.types.includes(type)) {
            updateSnippet(produce(s => { s.types.push(type); }));
        } else if (!isSelected && snippet.types.includes(type)) {
            updateSnippet(produce(s => { s.types = s.types.filter(t => t !== type); }));
        }
    }

    return <Page />;
}

render(() => <App />, document.getElementById("app") as HTMLElement);
