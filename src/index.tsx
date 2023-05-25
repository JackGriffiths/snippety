import { createFileManager, hasFileSystemAccess } from "./snippets/snippet-file-manager";
import {
    createDefaultSnippet,
    defaultDelimiter,
    Language,
    languageDescriptions,
    snippetKindDescriptions,
    SnippetType,
    snippetTypeDescriptions
} from "./snippets/snippet-model";
import { parseSnippetFromXml } from "./snippets/snippet-parser";
import createSnippetStore from "./snippets/snippet-store";
import { writeSnippetToXml } from "./snippets/snippet-writer";
import { makeFileDragAndDropHandler } from "./utilities/file-drag-and-drop";
import { createDirtyFlag, makeLeavePrompt } from "./utilities/unsaved-changes";
import { showScreenReaderOnlyToast, showSuccessToast } from "./notifications";
import { registerWebComponents } from "./web-components";
import type { FileWithHandle } from "browser-fs-access";
import { batch, createEffect, createUniqueId, For, Index, Show } from "solid-js";
import { render } from "solid-js/web";
import { createStorageSignal } from "@solid-primitives/storage";
import { Toaster } from "solid-toast";

registerWebComponents();

function App() {
    // Configure the file manager
    const [fileName, fileOperations] = createFileManager(parseSnippetFromXml, writeSnippetToXml);
    const { tryOpen, tryPick, trySave, trySaveAs, closeFile } = fileOperations;

    // Use user-specific settings
    const [defaultAuthor, setDefaultAuthor] = createStorageSignal("default-author", "");
    const [defaultHelpUrl, setDefaultHelpUrl] = createStorageSignal("default-help-url", "");

    // Set up the model
    const { snippet, canHaveNamespaces, isValidCode, snippetOps } = createSnippetStore(createNewSnippet);
    const [isDirty, markClean] = createDirtyFlag(snippet);

    // Configure some page-wide logic
    const pageTitle = () => `${fileName() ?? "New Snippet"}`;
    createEffect(() => document.title = `${pageTitle()} - Snippety`);
    makeFileDragAndDropHandler(document.body, "link", "application/xml", fileDropped);
    makeLeavePrompt(() => isDirty(), "Are you sure you want to leave? There are unsaved changes that will be lost.");

    function Page() {
        return (
            <main>
                <Toaster position="top-center" />

                <h1>
                    <Show when={isDirty()}>
                        <span aria-hidden="true">*</span>
                    </Show>
                    {pageTitle()}
                </h1>

                <Show when={isDirty()}>
                    <p class="screen-reader-only">
                        This snippet has changes that are unsaved.
                    </p>
                </Show>

                <div id="form-and-preview-wrapper">
                    <Form />
                    <Preview />
                </div>
            </main>
        );
    }

    function Toolbar() {
        return (
            <div class="button-toolbar" role="toolbar" aria-label="Primary">
                <SaveButtons />

                <button type="button" onClick={newSnippet}>
                    New
                </button>

                <button type="button" onClick={openSnippet} aria-label="Open File">
                    Open File
                    <span aria-hidden="true">
                        ...
                    </span>
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

                <Show when={hasFileSystemAccess}>
                    <button type="submit" form="main-form" data-submit-type="save-as">
                        Save As
                        <span aria-hidden="true">
                            ...
                        </span>
                    </button>
                </Show>
            </>
        );
    }

    function Form() {
        const shortcutPattern = () => snippet.language === Language.Css ? "@[A-Za-z0-9_]*" : "[A-Za-z0-9_]*";

        const addCodeValidation = (element: HTMLTextAreaElement) => {
            createEffect(() => {
                const errorMessage = isValidCode() ? "" : "Please ensure all opening delimiters have a corresponding closing delimiter.";
                element.setCustomValidity(errorMessage);
            });
        };

        return (
            <form id="main-form" action="" onSubmit={saveSnippet}>
                <Toolbar />

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
                        onInput={e => snippetOps.updateTitle(e.target.value)}
                        aria-describedby="title-help-text" />

                    <p id="title-help-text" class="help-text">
                        The title appears in IntelliSense when browsing code snippets.
                    </p>
                </div>

                <div>
                    <label for="description">
                        Description
                    </label>

                    <textarea
                        id="description"
                        aria-describedby="description-help-text"
                        rows="3"
                        autocomplete="off"
                        placeholder="e.g. Code snippet for..."
                        value={snippet.description}
                        onInput={e => snippetOps.updateDescription(e.target.value)} />

                    <p id="description-help-text" class="help-text">
                        The description appears in IntelliSense when browsing code snippets.
                    </p>
                </div>

                <div>
                    <label for="shortcut">
                        Shortcut
                    </label>

                    <input
                        id="shortcut"
                        aria-describedby="shortcut-help-text-1 shortcut-help-text-2"
                        type="text"
                        autocomplete="off"
                        pattern={shortcutPattern()}
                        value={snippet.shortcut}
                        onInput={e => snippetOps.updateShortcut(e.target.value)} />

                    <p id="shortcut-help-text-1" class="help-text">
                        Must only contain alphanumeric characters or underscores. The exception is that CSS
                        snippets must start with the @ character.
                    </p>

                    <p id="shortcut-help-text-2" class="help-text">
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
                        onInput={e => snippetOps.updateLanguage(e.target.value as Language | "")}>

                        <option value="">
                            Choose a language...
                        </option>

                        <For each={Array.from(languageDescriptions)}>{([value, description]) =>
                            <option value={value}>
                                {description}
                            </option>
                        }</For>
                    </select>
                </div>

                <div>
                    <label for="code" class="required">
                        Code
                    </label>

                    <textarea
                        ref={(ref) => addCodeValidation(ref)}
                        id="code"
                        aria-describedby="code-help-text-1 code-help-text-2 code-help-text-3"
                        rows="7"
                        autocomplete="off"
                        required
                        value={snippet.code}
                        onInput={e => snippetOps.updateCode(e.target.value)} />

                    <p id="code-help-text-1" class="help-text">
                        Use placeholders like <code>{wrapWithDelimiter("name")}</code> to define parts of the code which will be replaced.
                        There are two reserved placeholders that you can use in your snippets.
                    </p>

                    <p id="code-help-text-2" class="help-text">
                        <code>{wrapWithDelimiter("end")}</code> marks the location to place the cursor after the code snippet is inserted. It is
                        recommended that this placeholder is included in all snippets.
                    </p>

                    <p id="code-help-text-3" class="help-text">
                        <code>{wrapWithDelimiter("selected")}</code> represents text selected in the document that is to be inserted into the snippet
                        when it is invoked. This is only relevant for "Surrounds With" snippets.
                    </p>
                </div>

                <section aria-labelledby="placeholders-section-label">
                    <label id="placeholders-section-label">
                        Placeholders
                    </label>

                    <Show
                        when={snippet.placeholders.length > 0}
                        fallback={<p class="help-text">No custom placeholders.</p>}>

                        <ol id="placeholders">
                            <For each={snippet.placeholders}>{(placeholder, index) => {

                                const labelId = createUniqueId();
                                const defaultValueInputId = createUniqueId();
                                const editableInputId = createUniqueId();
                                const tooltipInputId = createUniqueId();

                                return (
                                    <li>
                                        <section aria-labelledby={labelId}>
                                            <p id={labelId}>
                                                {wrapWithDelimiter(placeholder.name)}
                                            </p>

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
                                                        onInput={e => snippetOps.placeholders.updateDefaultValue(index(), e.target.value)} />

                                                    <div style={{"margin-block-start": "0.75rem"}}>
                                                        <input
                                                            id={editableInputId}
                                                            type="checkbox"
                                                            checked={placeholder.isEditable}
                                                            onChange={e => snippetOps.placeholders.updateEditable(index(), e.target.checked)} />

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
                                                        onInput={e => snippetOps.placeholders.updateTooltip(index(), e.target.value)} />
                                                </div>
                                            </div>
                                        </section>
                                    </li>
                                );
                            }}</For>
                        </ol>
                    </Show>
                </section>

                <div>
                    <label for="delimiter">
                        Delimiter Character
                    </label>

                    <input
                        id="delimiter"
                        type="text"
                        autocomplete="off"
                        maxLength="1"
                        value={snippet.delimiter}
                        onInput={e => snippetOps.updateDelimiter(e.target.value)}
                        aria-describedby="delimiter-help-text" />

                    <p id="delimiter-help-text" class="help-text">
                        The default delimiter is the {defaultDelimiter} character.
                    </p>
                </div>

                <Show when={canHaveNamespaces()}>
                    <section aria-labelledby="imports-section-label">
                        <label id="imports-section-label">
                            Imports
                        </label>

                        <p class="help-text">
                            The namespaces that need to be imported for this snippet to compile.
                        </p>

                        <ol id="imports">
                            <Index each={snippet.namespaces}>{(namespace, index) =>
                                <li>
                                    <div class="import">
                                        <input
                                            type="text"
                                            value={namespace()}
                                            onInput={e => snippetOps.namespaces.update(index, e.target.value)} />

                                        <button type="button" onClick={() => snippetOps.namespaces.remove(index)}>
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            }</Index>
                        </ol>

                        <button type="button" onClick={addAndFocusNamespace}>
                            Add
                        </button>
                    </section>
                </Show>

                <section aria-labelledby="type-section-label">
                    <label id="type-section-label">
                        Type
                    </label>

                    <p class="help-text">
                        Specifies the type of snippet. If no types are selected, the snippet can be inserted anywhere in the code.
                    </p>

                    <fieldset>
                        <legend class="screen-reader-only">
                            What type of snippet is this?
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
                                            onChange={e => addOrRemoveType(value, e.target.checked)} />

                                        <label for={checkboxInputId}>
                                            {description}
                                        </label>
                                    </div>
                                </Show>
                            );
                        }}</For>
                    </fieldset>
                </section>

                <section aria-labelledby="kind-section-label">
                    <label id="kind-section-label">
                        Kind
                    </label>

                    <p class="help-text">
                        Specifies the kind of code that the snippet contains.
                    </p>

                    <fieldset>
                        <legend class="screen-reader-only">
                            What kind of code does this snippet contain?
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
                                        onChange={() => snippetOps.updateKind(value)} />

                                    <label for={radioInputId}>
                                        {description}
                                    </label>
                                </div>
                            );
                        }}</For>
                    </fieldset>
                </section>

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
                            onInput={e => snippetOps.updateAuthor(e.target.value)} />

                        <Show when={snippet.author !== defaultAuthor()}>
                            <button type="button" class="flex-no-shrink" onClick={saveCurrentAuthorAsDefault}>
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
                            onInput={e => snippetOps.updateHelpUrl(e.target.value)} />

                        <Show when={snippet.helpUrl !== defaultHelpUrl()}>
                            <button type="button" class="flex-no-shrink" onClick={saveCurrentHelpUrlAsDefault}>
                                Save As Default
                            </button>
                        </Show>
                    </div>
                </div>

                <div class="button-toolbar" role="toolbar" aria-label="Secondary">
                    <SaveButtons />
                </div>
            </form>
        );
    }

    function Preview() {
        return (
            <section id="preview" aria-labeledby="preview-heading">
                <h2 id="preview-heading" class="screen-reader-only">
                    Preview
                </h2>

                <highlighted-code-block attr:language={snippet.language} attr:code={snippetOps.preview()} />

                <Show when={snippet.placeholders.length > 0}>
                    <h3 class="screen-reader-only">
                        Placeholders and their default values
                    </h3>

                    <ol id="placeholder-previews">
                        <For each={snippet.placeholders}>{(placeholder) =>
                            <li>
                                <span aria-hidden="true" class="ff-monospace">
                                    {wrapWithDelimiter(placeholder.name)} &#x02192; {placeholder.defaultValue}
                                </span>
                                <span class="screen-reader-only">
                                    {wrapWithDelimiter(placeholder.name)} has a default value of {placeholder.defaultValue}
                                </span>
                            </li>
                        }</For>
                    </ol>
                </Show>
            </section>
        );
    }

    function newSnippet() {
        if (isDirty() && !confirm("Are you sure you want to create a new snippet? There are unsaved changes that will be lost.")) {
            return;
        }

        batch(() => {
            closeFile();
            snippetOps.new();
            markClean();
        });

        showScreenReaderOnlyToast("Form cleared");
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

        const result = await tryPick();

        if (result.isOk) {
            if (result.value !== null) {
                const snippet = result.value;

                batch(() => {
                    snippetOps.replace(snippet);
                    markClean();
                });
            }
        } else if (result.error !== "") {
            alert(result.error);
        }
    }

    async function fileDropped(file: FileWithHandle) {
        if (isDirty() && !confirm("Are you sure you want to open this file? There are unsaved changes that will be lost.")) {
            return;
        }

        const result = await tryOpen(file);

        if (result.isOk) {
            batch(() => {
                snippetOps.replace(result.value);
                markClean();
            });
        } else if (result.error !== "") {
            alert(result.error);
        }
    }

    async function saveSnippet(e: SubmitEvent) {
        e.preventDefault();

        const useSaveAs = e.submitter?.dataset.submitType === "save-as";
        const result = useSaveAs ? await trySaveAs(snippet) : await trySave(snippet);

        if (result.isOk) {
            const wasSaved = result.value;

            if (wasSaved) {
                markClean();

                if (hasFileSystemAccess) {
                    showSuccessToast("Saved successfully");
                } else {
                    showSuccessToast("File created successfully");
                }
            }
        } else if (result.error !== "") {
            alert(result.error);
        }
    }

    function wrapWithDelimiter(name: string) {
        const delimiter = snippet.delimiter || defaultDelimiter;
        return delimiter + name + delimiter;
    }

    function addOrRemoveType(type: SnippetType, isSelected: boolean) {
        if (isSelected) {
            snippetOps.types.add(type);
        } else {
            snippetOps.types.remove(type);
        }
    }

    function addAndFocusNamespace() {
        snippetOps.namespaces.add();

        // Move focus on to the new text input.
        const lastNamespaceEl = document.getElementById("imports")?.lastElementChild;
        lastNamespaceEl?.querySelector("input")?.focus();
    }

    function saveCurrentAuthorAsDefault() {
        setDefaultAuthor(snippet.author);
        showSuccessToast("Default author updated");
    }

    function saveCurrentHelpUrlAsDefault() {
        setDefaultHelpUrl(snippet.helpUrl);
        showSuccessToast("Default help URL updated");
    }

    return <Page />;
}

render(() => <App />, document.getElementById("app") as HTMLElement);
