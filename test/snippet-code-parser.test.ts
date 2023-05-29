import { expect, test } from "vitest";
import { Token, TokenKind, parse } from "../src/snippets/analysis/parser";

test("Parse literal", () => {
    const input = "let x = 1;";
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "let x = 1;",
            kind: TokenKind.LiteralToken,
            value: "let x = 1;"
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Parse literal with escaped delimiter", () => {
    const input = "let x = 'the price is $$10.';";
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "let x = 'the price is $$10.';",
            kind: TokenKind.LiteralToken,
            value: "let x = 'the price is $10.';"
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Bad token", () => {
    const input = "$incomplete";
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "$incomplete",
            kind: TokenKind.BadToken,
            value: null
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Parse placeholder", () => {
    const input = "$example$";
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "$example$",
            kind: TokenKind.PlaceholderToken,
            value: "example"
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Parse placeholder with space", () => {
    const input = "$example one$";
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "$example one$",
            kind: TokenKind.PlaceholderToken,
            value: "example one"
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Different delimiter", () => {
    const input = ":example:";
    const tokens = parse(input, ":");

    const expectedTokens: Token[] = [
        {
            sourceText: ":example:",
            kind: TokenKind.PlaceholderToken,
            value: "example"
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Parse literals and placeholders", () => {
    const input = "let x = $number$;";
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "let x = ",
            kind: TokenKind.LiteralToken,
            value: "let x = ",
        },
        {
            sourceText: "$number$",
            kind: TokenKind.PlaceholderToken,
            value: "number"
        },
        {
            sourceText: ";",
            kind: TokenKind.LiteralToken,
            value: ";",
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Escaped placeholder", () => {
    const input = "$$example$$";
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "$$example$$",
            kind: TokenKind.LiteralToken,
            value: "$example$"
        },
    ];

    expect(tokens).toMatchObject(expectedTokens);
});

test("Placeholder cannot span multiple lines", () => {
    const input = `$exam
ple$`;
    const tokens = parse(input, "$");

    const expectedTokens: Token[] = [
        {
            sourceText: "$exam",
            kind: TokenKind.BadToken,
            value: null
        },
        {
            sourceText: `
ple`,
            kind: TokenKind.LiteralToken,
            value: `
ple`
        },
        {
            sourceText: "$",
            kind: TokenKind.BadToken,
            value: null
        }
    ];

    expect(tokens).toMatchObject(expectedTokens);
});
