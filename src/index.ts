import { BindingContext } from "./bindings/binding-context";
import { FileDragAndDrop } from "./file-drag-and-drop";
import { FileManager } from "./file-manager";
import { SnippetModel } from "./snippet-model";
import { SnippetParser } from "./snippet-parser";
import { SnippetWriter } from "./snippet-writer";

const bindingContext = new BindingContext<SnippetModel>(document);
let snippet = bindingContext.bind(new SnippetModel());

const fileManager = new FileManager();
FileDragAndDrop.init(document.body, "link", "application/xml", fileDropped);

// New button
document.getElementById("file-new-button")!
    .addEventListener("click", () => {
        snippet = bindingContext.bind(new SnippetModel());
        fileManager.clearCurrentFile();
        refreshPageTitle();
    });

// Open button
document.getElementById("file-open-button")!
    .addEventListener("click", async () => {
        const file = await fileManager.tryOpen();
        if (file === null) {
            return;
        }

        // TODO: validate that it's a valid snippet file.
        const xml = await file.text();
        const parsedSnippet = SnippetParser.fromXml(xml);
        snippet = bindingContext.bind(parsedSnippet);

        fileManager.setCurrentFile(file.name, file.handle ?? null);
        refreshPageTitle();
    });

// Save / Save As button
document.getElementById("main-form")!
    .addEventListener("submit", async (e) => {
        e.preventDefault();

        const xml = SnippetWriter.toXml(snippet);
        const defaultFileName = fileManager.currentFileName ?? "snippet.snippet";

        const useSaveAs = e.submitter?.id === "file-save-as-button";

        const file = useSaveAs ?
            await fileManager.trySaveAs(defaultFileName, xml) :
            await fileManager.trySave(defaultFileName, xml);

        if (file !== null) {
            fileManager.setCurrentFile(file.name, file.handle);
            refreshPageTitle();
        }
    });

if (fileManager.isSaveAsEnabled) {
    const saveAsButton = document.getElementById("file-save-as-button")!;
    saveAsButton.style.display = "inline-block";
}

async function fileDropped(file: { name: string, blob: Blob, handle: FileSystemFileHandle | null }) {
    // TODO: validate that it's a valid snippet file.
    const xml = await file.blob.text();
    const parsedSnippet = SnippetParser.fromXml(xml);
    snippet = bindingContext.bind(parsedSnippet);

    fileManager.setCurrentFile(file.name, file.handle);
    refreshPageTitle();
}

function refreshPageTitle() {
    const title = fileManager.currentFileName ?? "New Snippet";
    document.getElementById("page-title")!.textContent = title;
    document.title = `${title} - Snippety`;
}
