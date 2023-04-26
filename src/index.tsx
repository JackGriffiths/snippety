import { FileManager } from "./file-manager";
import { initFileDragAndDrop } from "./file-drag-and-drop";
import type { SnippetModel } from "./snippet-model";
import { createDefaultSnippet } from "./snippet-model";
import { parseSnippetFromXml } from "./snippet-parser";
import { writeSnippetToXml } from "./snippet-writer";
import { createSignal, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { render, Show, Index } from "solid-js/web";

const fileManager = new FileManager();
initFileDragAndDrop(document.body, "link", "application/xml", fileDropped);

const [pageTitle, setPageTitle] = createSignal("New Snippet");
const [snippet, updateSnippet] = createStore<SnippetModel>(createDefaultSnippet());

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
                    <input id="shortcut" type="text" autocomplete="off" value={snippet.shortcut} onInput={(e) => updateSnippet("shortcut", e.target.value)} />

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
                    <textarea id="code" required rows="5" autocomplete="off" value={snippet.code} onInput={(e) => updateSnippet("code", e.target.value)} />
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

function newSnippet() {
    updateSnippet(createDefaultSnippet());
    fileManager.clearCurrentFile();
    setPageTitle("New Snippet");
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
    setPageTitle(file.name);
}

async function saveSnippet(e: SubmitEvent) {
    e.preventDefault();

    const xml = writeSnippetToXml(snippet);
    const defaultFileName = fileManager.currentFileName ?? "snippet.snippet";

    const useSaveAs = e.submitter?.dataset.submitType === "save-as";

    const file = useSaveAs ?
        await fileManager.trySaveAs(defaultFileName, xml) :
        await fileManager.trySave(defaultFileName, xml);

    if (file !== null) {
        fileManager.setCurrentFile(file.name, file.handle);
        setPageTitle(file.name);
    }
}

async function fileDropped(file: { name: string, blob: Blob, handle: FileSystemFileHandle | null }) {
    // TODO: validate that it's a valid snippet file.
    const xml = await file.blob.text();
    const parsedSnippet = parseSnippetFromXml(xml);
    updateSnippet(parsedSnippet);

    fileManager.setCurrentFile(file.name, file.handle);
    setPageTitle(file.name);
}

function addNamespace() {
    updateSnippet("namespaces", (namespaces) => [...namespaces, ""]);
}

function updateNamespace(index: number, value: string) {
    updateSnippet("namespaces", index, value);
}

render(() => <App />, document.getElementById("app") as HTMLElement);
