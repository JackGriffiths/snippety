import { Observable } from "./observable";

export class Binding<T> {
    #value: Observable<T | null | undefined>;
    #element: HTMLInputElement;
    #unbindSignaller: AbortController;

    constructor(value: Observable<T | null | undefined>, element: HTMLInputElement) {
        this.#value = value;
        this.#value.subscribe(value => this.#onValueChange(value));

        this.#element = element;
        this.#onValueChange(value.value);

        this.#unbindSignaller = new AbortController();
        this.#element.addEventListener("change", e => this.#onElementChange((e.target as any).value),
            { signal: this.#unbindSignaller.signal});
    }

    #onValueChange(value: T | null | undefined) {
        value = value ?? null;

        if (this.#element.tagName === "P") {
            this.#element.textContent = value as any;
        } else {
            this.#element.value = value as any;
        }
    }

    #onElementChange(value: T | null | undefined) {
        this.#value.value = value;
    }

    unbind() {
        this.#unbindSignaller.abort();
    }
}
