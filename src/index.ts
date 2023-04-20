import { FileDragAndDrop } from "./file-drag-and-drop";
import { FileManager } from "./file-manager";
import { SnippetModel } from "./snippet-model";
import { SnippetParser } from "./snippet-parser";
import { SnippetWriter } from "./snippet-writer";

const fileManager = new FileManager();
FileDragAndDrop.init(document.body, "link", "application/xml", fileDropped);

// New button
document.getElementById("file-new-button")!
    .addEventListener("click", () => {
        fileManager.clearCurrentFile();
        populateForm(new SnippetModel());
        refreshFileName();
    });

// Open button
document.getElementById("file-open-button")!
    .addEventListener("click", async () => {
        const file = await fileManager.tryOpen();
        if (file === null) {
            return;
        }

        const xml = await file.text();
        const snippet = SnippetParser.fromXml(xml);

        // TODO: validate that it's a valid snippet file.

        fileManager.setCurrentFile(file.name, file.handle ?? null);
        populateForm(snippet);
        refreshFileName();
    });

// Save button
document.getElementById("file-save-button")!
    .addEventListener("click", async () => {
        const snippet = getFromForm();
        const xml = SnippetWriter.toXml(snippet);
        const defaultFileName = fileManager.currentFileName ?? "snippet.snippet";
        const file = await fileManager.trySave(defaultFileName, xml);

        if (file !== null) {
            fileManager.setCurrentFile(file.name, file.handle);
            refreshFileName();
        }
    });

// Save As button
if (fileManager.isSaveAsEnabled) {
    const saveAsButton = document.getElementById("file-save-as-button")!;

    saveAsButton.style.display = "inline-block";

    saveAsButton
        .addEventListener("click", async () => {
            const snippet = getFromForm();
            const xml = SnippetWriter.toXml(snippet);
            const defaultFileName = fileManager.currentFileName ?? "snippet.snippet";
            const file = await fileManager.trySaveAs(defaultFileName, xml);

            if (file !== null) {
                fileManager.setCurrentFile(file.name, file.handle);
                refreshFileName();
            }
        });
}

async function fileDropped(file: { name: string, blob: Blob, handle: FileSystemFileHandle | null }) {
    // TODO: validate that it's a valid snippet file.
    const xml = await file.blob.text();
    const snippet = SnippetParser.fromXml(xml);

    fileManager.setCurrentFile(file.name, file.handle);
    populateForm(snippet);
    refreshFileName();
}

function populateForm(snippet: SnippetModel) {
    (document.getElementById("title") as HTMLInputElement).value = snippet.title ?? "";
    (document.getElementById("description") as HTMLTextAreaElement).value = snippet.description ?? "";
}

function getFromForm(): SnippetModel {
    return {
        format: "1.0.0", // TODO: might not be the value that was loaded from the snippet file.
        title: (document.getElementById("title") as HTMLInputElement).value,
        description: (document.getElementById("description") as HTMLTextAreaElement)!.value,
    }
}

function refreshFileName() {
    document.getElementById("file-name")!.textContent = fileManager.currentFileName;

    if (fileManager.currentFileName !== null) {
        document.title = `${fileManager.currentFileName} - Snippety`;
    } else {
        document.title = "Snippety";
    }
}
