import * as fileManager from "./file-manager";
import { initFileDragAndDrop } from "./file-drag-and-drop";
import type { SnippetModel } from "./snippet-model";
import { createDefaultSnippet } from "./snippet-model";
import { parseSnippetFromXml } from "./snippet-parser";
import { writeSnippetToXml } from "./snippet-writer";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { render, Show, For, Index } from "solid-js/web";

const [snippet, updateSnippet] = createStore<SnippetModel>(createDefaultSnippet());

const pageTitle = () => fileManager.currentFileName() ?? "New Snippet";
initFileDragAndDrop(document.body, "link", "application/xml", fileDropped);

function App() {
    createEffect(() => document.title = `${pageTitle()} - Snippety`);

    return (
        <div class="container">
            <Toolbar />
            <div id="inputs-and-preview">
                <Inputs />
                <Preview />
            </div>
        </div>
    );
}

function Toolbar() {
    return (
        <div id="toolbar">
            <button onClick={newSnippet}>New</button>
            <button onClick={openSnippet}>Open</button>
            <button type="submit" form="main-form" data-submit-type="save">Save</button>

            <Show when={fileManager.isSaveAsEnabled}>
                <button type="submit" form="main-form" data-submit-type="save-as">Save As</button>
            </Show>
        </div>
    );
}

function Inputs() {
    return (
        <div id="inputs">
            <h1 id="page-title">{pageTitle()}</h1>

            <form id="main-form" action="" onSubmit={saveSnippet}>
                <div>
                    <label for="title">Title</label>
                    <input id="title" type="text" required autocomplete="off" value={snippet.title} onInput={(e) => updateSnippet("title", e.target.value)} />

                    <p class="help-text">The title appears in IntelliSense when browsing code snippets.</p>
                </div>

                <div>
                    <label for="author">Author</label>
                    <input id="author" type="text" autocomplete="name" value={snippet.author} onInput={(e) => updateSnippet("author", e.target.value)} />
                </div>

                <div>
                    <label for="description">Description</label>
                    <textarea id="description" rows="5" autocomplete="off" value={snippet.description} onInput={(e) => updateSnippet("description", e.target.value)} />

                    <p class="help-text">The description appears in IntelliSense when browsing code snippets.</p>
                </div>

                <div>
                    <label for="shortcut">Shortcut</label>
                    <input id="shortcut" type="text" autocomplete="off" pattern="[A-Za-z0-9_]*" value={snippet.shortcut} onInput={(e) => updateSnippet("shortcut", e.target.value)} />

                    <p class="help-text">Must only contain alphanumeric characters and underscores. Snippets without a shortcut
                    can be inserted using the context menu.</p>
                </div>

                <div>
                    <label for="language">Language</label>
                    <select id="language" required value={snippet.language} onInput={(e) => updateSnippet("language", e.target.value)}>
                        <option value="">Choose a language...</option>
                        <option value="csharp">C#</option>
                        <option value="css">CSS</option>
                    </select>
                </div>

                <div>
                    <label for="code">Code</label>
                    <textarea id="code" required rows="5" autocomplete="off" value={snippet.code} onInput={(e) => updateSnippetCode(e.target.value)} />

                    <p class="help-text">The code block that should be inserted. Use placeholders like
                        <code>$propertyName$</code> to define parts of the code which will likely be customised after the code is inserted.
                    </p>

                    <p class="help-text">There are two reserved placeholders that you can use in your snippets.
                        <code>$selected$</code> represents text selected in the document that is to be inserted into the snippet
                        when it is invoked. <code>$end$</code>
                        marks the location to place the cursor after the code snippet is inserted.
                    </p>
                </div>

                <div>
                    <label>Placeholders</label>

                    <Show when={snippet.placeholders.length > 0} fallback={<p class="help-text">No placeholders added to the code snippet.</p>}>
                        <ol id="placeholders">
                            <For each={snippet.placeholders}>{
                                (placeholder, index) =>
                                    <li>
                                        <p>{`$${placeholder.name}$`}</p>

                                        <div class="flex-horizontal" style="gap: 1rem;">
                                            <div>
                                                <label for={`placeholder-${placeholder.name}-default-value`}>Default Value</label>
                                                <input id={`placeholder-${placeholder.name}-default-value`} type="text" required value={placeholder.defaultValue} onInput={(e) => updateSnippet("placeholders", index(), "defaultValue", e.target.value)} />
                                            </div>

                                            <div>
                                                <label for={`placeholder-${placeholder.name}-tooltip-value`}>Tooltip</label>
                                                <input id={`placeholder-${placeholder.name}-tooltip-value`} type="text" value={placeholder.tooltip} onInput={(e) => updateSnippet("placeholders", index(), "tooltip", e.target.value)} />
                                            </div>
                                        </div>
                                    </li>
                            }</For>
                        </ol>
                    </Show>
                </div>

                <div>
                    <label for="helpUrl">Help URL</label>
                    <input id="helpUrl" type="url" autocomplete="off" value={snippet.helpUrl} onInput={(e) => updateSnippet("helpUrl", e.target.value)} />
                </div>

                <div>
                    <label>Imports</label>
                    <p class="help-text">The namespaces that need to be imported for this snippet to compile.</p>

                    <div id="imports">
                        <Index each={snippet.namespaces}>{
                            (namespace, index) =>
                                <input type="text" placeholder="e.g. using System.Linq" value={namespace()} onInput={(e) => updateNamespace(index, e.target.value)} />
                        }</Index>
                    </div>

                    <button type="button" onClick={addNamespace}>
                        Add
                    </button>
                </div>
            </form>
        </div>
    );
}

function Preview() {
    return (
        <div id="preview">
            <h2 class="screen-reader-only">Preview</h2>
            <pre><code>{snippet.code}</code></pre>
        </div>
    );
}

function updateSnippetCode(code: string) {
    updateSnippet("code", code);

    const placeholdersNames = parsePlaceholdersFromCode(code);
    const existingPlaceholderNames = snippet.placeholders.map(i => i.name);

    const newPlaceholderNames = Array.from(placeholdersNames).filter(i => !existingPlaceholderNames.includes(i));
    const newPlaceholders = newPlaceholderNames.map(i => ({
        name: i,
        defaultValue: "",
        tooltip: "",
        isEditable: true,
    }));

    const removedPlaceholderNames = Array.from(existingPlaceholderNames).filter(i => !placeholdersNames.has(i));
    const removedPlaceholders = snippet.placeholders.filter(i => removedPlaceholderNames.includes(i.name));

    let updatePlaceholders = Array.from(snippet.placeholders);
    updatePlaceholders.push(...newPlaceholders);
    updatePlaceholders = updatePlaceholders.filter(i => !removedPlaceholders.includes(i));
    updatePlaceholders.sort((a, b) => a.name.localeCompare(b.name));

    updateSnippet("placeholders", updatePlaceholders);
}

function parsePlaceholdersFromCode(code: string): Set<string> {
    const placeholderRegex = /\$(\w+)\$/g;

    const reservedPlaceholders = new Set(["selected", "end"]);
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

function newSnippet() {
    updateSnippet(createDefaultSnippet());
    fileManager.clearCurrentFile();
}

async function openSnippet() {
    const file = await fileManager.tryOpen();
    if (file === null) {
        return;
    }

    // TODO: validate that it's a valid snippet file.
    const xml = await file.text();
    const parsedSnippet = parseSnippetFromXml(xml);
    updateSnippet(parsedSnippet);

    fileManager.setCurrentFile(file.name, file.handle ?? null);
}

async function saveSnippet(e: SubmitEvent) {
    e.preventDefault();

    const xml = writeSnippetToXml(snippet);

    const defaultFileName = snippet.shortcut || snippet.title; // TODO: strip invalid file name chars from the title.
    const defaultFileNameWithExt = `${defaultFileName}.snippet`;
    const useSaveAs = e.submitter?.dataset.submitType === "save-as";

    const file = useSaveAs ?
        await fileManager.trySaveAs(xml, defaultFileNameWithExt) :
        await fileManager.trySave(xml, defaultFileNameWithExt);

    if (file !== null) {
        fileManager.setCurrentFile(file.name, file.handle);
    }
}

async function fileDropped(file: { name: string, blob: Blob, handle: FileSystemFileHandle | null }) {
    // TODO: validate that it's a valid snippet file.
    const xml = await file.blob.text();
    const parsedSnippet = parseSnippetFromXml(xml);
    updateSnippet(parsedSnippet);

    fileManager.setCurrentFile(file.name, file.handle);
}

function addNamespace() {
    updateSnippet("namespaces", (namespaces) => [...namespaces, ""]);
}

function updateNamespace(index: number, value: string) {
    updateSnippet("namespaces", index, value);
}

render(() => <App />, document.getElementById("app") as HTMLElement);
