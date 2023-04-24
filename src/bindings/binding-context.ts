import { ObservableObject } from "./observable-object";
import { Binding } from "./binding";

export class BindingContext<T extends object> {
    #document: Document;
    #boundItem: ObservableObject<T> | null;
    #bindings: Binding<any>[];

    constructor(document: Document) {
        this.#document = document;
        this.#boundItem = null;
        this.#bindings = [];
    }

    bind(item: T): T {
        if (this.#bindings.length !== 0) {
            this.unbind();
        }

        this.#boundItem = new ObservableObject(item);

        this.#document.querySelectorAll("[data-bind]")
            .forEach(element => {
                const property = element.getAttribute("data-bind") as Extract<keyof T, string>;
                const observable = this.#boundItem!.getObservableForProperty(property);
                const binding = new Binding<T>(observable, element as HTMLInputElement);
                this.#bindings.push(binding);
            });

        return this.#boundItem.proxy;
    }

    unbind() {
        this.#boundItem = null;
        this.#bindings.forEach((value) => value.unbind());
        this.#bindings = [];
    }
}
