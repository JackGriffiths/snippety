type Result<T> =
    | { readonly isOk: true; readonly value: T }
    | { readonly isOk: false; readonly error: string };

export default Result;

export function ok<T>(value: T): Result<T> {
    return {
        isOk: true,
        value: value,
    };
}

export function error<T>(message: string): Result<T> {
    return {
        isOk: false,
        error: message,
    };
}
