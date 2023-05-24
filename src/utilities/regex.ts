// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
export function regexEscape(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
