export class Observable<T> {
    #getValue: () => T;
    #setValue: (value: T) => void;
    #listeners: ((value: T) => void)[];

    constructor(getValue: () => T, setValue: (value: T) => void) {
        this.#getValue = getValue;
        this.#setValue = setValue;
        this.#listeners = [];
    }

    get value() {
        return this.#getValue();
    }

    set value(newValue: T) {
        this.#setValue(newValue);
    }

    notify() {
        const value = this.#getValue();
        this.#listeners.forEach(listener => listener(value));
    }

    subscribe(listener: (value: T) => void) {
        this.#listeners.push(listener);
    }
}
