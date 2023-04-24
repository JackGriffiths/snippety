import { Observable } from "./observable";

export class ObservableObject<T extends object> {
    #proxy: T;
    #observables: Map<string, Observable<any>>;

    constructor(obj: T) {
        this.#observables = new Map();

        this.#proxy = new Proxy<T>(obj, {
            set: (target, p, newValue, receiver) => {
                // As normal, update the value on the object.
                (target as any)[p] = newValue;

                // Notify the listeners.
                const observable = this.#observables.get(p as string);
                if (observable !== undefined) {
                    observable.notify();
                }

                return true;
            },
        })
    }

    get proxy() {
        return this.#proxy;
    }

    getObservableForProperty(propertyName: Extract<keyof T, string>) {
        let observable = this.#observables.get(propertyName);

        if (observable === undefined) {
            observable = new Observable(
                () => this.#proxy[propertyName],
                (value: any) => this.#proxy[propertyName] = value);

            this.#observables.set(propertyName, observable);
        }

        return observable;
    }
}
