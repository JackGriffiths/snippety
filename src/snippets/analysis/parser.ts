// Inspired by Immo Landwerth's Minsk compiler: https://github.com/terrajobst/minsk

export interface Token {
    sourceText: string;
    kind: TokenKind;
    value: string | null;
}

export enum TokenKind {
    BadToken = "BadToken",
    EndOfFileToken = "EndOfFileToken",
    LiteralToken = "LiteralToken",
    PlaceholderToken = "PlaceholderToken",
}

const endOfFileChar = "\0";

export function parse(text: string, delimiter: string) {
    const lex = createLexer(text, delimiter);
    const tokens: Token[] = [];

    let token = lex();
    while (token.kind !== TokenKind.EndOfFileToken) {
        tokens.push(token);
        token = lex();
    }

    return tokens;
}

function createLexer(text: string, delimiter: string) {
    let currentPos = 0;

    const peek = (offset: number) => currentPos + offset < text.length
        ? text[currentPos + offset]
        : endOfFileChar;

    const current = () => peek(0);
    const lookahead = () => peek(1);

    function readLiteral() {
        let literalValue = "";
        let isDone = false;

        while (!isDone) {
            switch (current()) {
                case endOfFileChar:
                    // Reached the end of the literal. Don't consume the EOF char.
                    isDone = true;
                    break;
                case delimiter:
                    if (lookahead() === delimiter) {
                        // Reached an escaped delimiter. Consume both chars but only
                        // add one to the value.
                        literalValue += current();
                        currentPos += 2;
                    } else {
                        // Reached the start of a placeholder. Don't consume the delimiter.
                        isDone = true;
                    }
                    break;
                default:
                    // Consume the char as normal.
                    literalValue += current();
                    currentPos++;
                    break;
            }
        }

        return {
            kind: TokenKind.LiteralToken,
            value: literalValue,
        };
    }

    function readPlaceholder() {
        // Consume opening delimiter
        currentPos++;

        // The name will be built up as the characters are consumed
        let placeholderName = "";

        while (true) {
            switch (current()) {
                case endOfFileChar:
                case "\n":
                case "\r":
                    // Reached a character that isn't part of the placeholder name or
                    // the closing delimiter. That means the opening delimiter is not
                    // matched with a closing delimiter.
                    return {
                        kind: TokenKind.BadToken,
                        value: null,
                    };
                case delimiter:
                    // Consume the closing delimiter
                    currentPos++;

                    return {
                        kind: TokenKind.PlaceholderToken,
                        value: placeholderName,
                    };
                default:
                    // Consume the character that is part of the placeholder name
                    placeholderName += current();
                    currentPos++;
                    break;
            }
        }
    }

    function lex() {
        const startPos = currentPos;
        let kind = TokenKind.BadToken;
        let value = null;

        switch (current()) {
            case endOfFileChar:
                kind = TokenKind.EndOfFileToken;
                value = null;
                break;
            case delimiter:
                if (lookahead() === delimiter) {
                    ({ kind, value } = readLiteral());
                } else {
                    ({ kind, value } = readPlaceholder());
                }
                break;
            default:
                ({ kind, value } = readLiteral());
                break;
        }

        return {
            sourceText: text.substring(startPos, currentPos),
            kind,
            value,
        };
    }

    return lex;
}
