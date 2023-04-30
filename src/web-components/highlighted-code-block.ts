import hljs from "highlight.js/lib/core";
import css from "highlight.js/lib/languages/css";
import csharp from "highlight.js/lib/languages/csharp";

export class HighlightedCodeBlock extends HTMLElement {
    #codeElement: HTMLElement;
    #lightColorSchemeMatcher: MediaQueryList;
    #colorSchemeChangeEventListener: ((e: MediaQueryListEvent) => void) | null = null;
    #themeStyleSheet: CSSStyleSheet;

    static {
        // This disables automatic highlighting of code blocks.
        // Instead we manually invoke highlighting and update the DOM element.
        hljs.configure({ languages: []});

        hljs.registerLanguage("css", css);
        hljs.registerLanguage("csharp", csharp);
    }

    static readonly tagName = "highlighted-code-block";

    constructor() {
        super();

        const preEl = document.createElement("pre");
        const codeEl = preEl.appendChild(document.createElement("code"));

        this.attachShadow({ mode: "open" }).append(preEl);

        this.#codeElement = codeEl;
        this.#lightColorSchemeMatcher = window.matchMedia("(prefers-color-scheme: light)");
        this.#themeStyleSheet = new CSSStyleSheet();
    }

    static get observedAttributes() {
        return ["language", "code"];
    }

    async connectedCallback() {
        await this.#addStyleSheets();
        await this.#detectAndApplyTheme();
        this.#colorSchemeChangeEventListener = async () => await this.#detectAndApplyTheme();
        this.#lightColorSchemeMatcher.addEventListener("change", this.#colorSchemeChangeEventListener);
    }

    async #addStyleSheets() {
        if (this.shadowRoot === null) {
            return;
        }

        this.shadowRoot.adoptedStyleSheets = [await this.#createComponentStyleSheet(), this.#themeStyleSheet];
    }

    async #createComponentStyleSheet() {
        const css = (await import("./highlighted-code-block.css?inline")).default;
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(css);
        return stylesheet;
    }

    attributeChangedCallback(name: string) {
        switch (name) {
            case "language":
            case "code":
                this.#update();
                break;
        }
    }

    #update() {
        const language = this.getAttribute("language");
        const hasLanguage = language !== null && language !== "";
        const code = this.getAttribute("code");
        const hasCode = code !== null && code !== "";

        if (hasLanguage && hasCode) {
            this.#codeElement.innerHTML = hljs.highlight(code, { language: language }).value;
        } else {
            this.#codeElement.textContent = code;
        }
    }

    disconnectedCallback() {
        if (this.#colorSchemeChangeEventListener !== null) {
            this.#lightColorSchemeMatcher.removeEventListener("change", this.#colorSchemeChangeEventListener);
        }
    }

    async #detectAndApplyTheme() {
        const theme = this.#lightColorSchemeMatcher.matches ? Theme.Light : Theme.Dark;
        const css = await this.#loadStylesForTheme(theme);
        const layer = `@layer hljs {${css}}`;
        this.#themeStyleSheet.replaceSync(layer);
    }

    async #loadStylesForTheme(theme: Theme) {
        switch (theme) {
            case Theme.Light:
                return (await import("highlight.js/styles/a11y-light.css?inline")).default;
            case Theme.Dark:
                return (await import("highlight.js/styles/a11y-dark.css?inline")).default;
            default:
                throw Error(`Unhandled theme: ${theme}`);
        }
    }
}

enum Theme {
    Light,
    Dark,
}
