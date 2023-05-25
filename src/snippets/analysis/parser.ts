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
    const endOfFileChar = "\0";

    const peek = (offset: number) => currentPos + offset < text.length
        ? text[currentPos + offset]
        : endOfFileChar;

    const current = () => peek(0);
    const lookahead = () => peek(1);

    function readLiteral() {
        let literalValue = "";

        while (true) {
            if (current() === endOfFileChar) {
                // Reached the end of the literal. Don't consume the EOF char.
                break;
            }

            if (current() === delimiter && lookahead() !== delimiter) {
                // Reached the start of a placeholder. Don't consume the delimiter.
                break;
            }

            if (current() === delimiter && lookahead() === delimiter) {
                // Reached an escaped delimiter. Consume both chars but only add one to the value.
                literalValue += current();
                currentPos += 2;
            } else {
                // Consume the char as normal.
                literalValue += current();
                currentPos++;
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
            if (current() == delimiter) {
                // Consume the closing delimiter
                currentPos++;

                return {
                    kind: TokenKind.PlaceholderToken,
                    value: placeholderName,
                };
            }

            if (current() === endOfFileChar || current() === "\n" || current() === "\r") {
                // Reached a character that isn't part of the placeholder name or the closing delimiter.
                // That means the opening delimiter is not terminated by a closing delimiter.
                return {
                    kind: TokenKind.BadToken,
                    value: null,
                };
            }

            // Consume the character that is part of the placeholder name
            placeholderName += current();
            currentPos++;
        }
    }

    function lex() {
        const startPos = currentPos;
        let kind = TokenKind.BadToken;
        let value = null;

        if (current() == endOfFileChar) {
            kind = TokenKind.EndOfFileToken;
            value = null;
        } else if (current() === delimiter) {
            if (lookahead() === delimiter) {
                ({ kind, value } = readLiteral());
            } else {
                ({ kind, value } = readPlaceholder());
            }
        } else {
            ({ kind, value } = readLiteral());
        }

        return {
            sourceText: text.substring(startPos, currentPos),
            kind,
            value,
        };
    }

    return lex;
}
