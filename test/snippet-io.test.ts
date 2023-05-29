import { assert, expect, test } from "vitest";
import { Language, Snippet, SnippetKind, SnippetType } from "../src/snippets/snippet-model";
import { parseSnippetFromXml } from "../src/snippets/io/file-parser";
import { writeSnippetToXml } from "../src/snippets/io/file-writer";

test("Round trip starting from model", () => {

    const snippet: Snippet = {
        format: "1.0.0",
        title: "Example title",
        description: "Example description",
        shortcut: "example",
        author: "Example author",
        delimiter: ":",
        language: Language.CSharp,
        code: "var x = :number:;",
        placeholders: [
            {
                name: "number",
                defaultValue: "10",
                function: "",
                isEditable: true,
                tooltip: "A number"
            }
        ],
        namespaces: [
            "System"
        ],
        kind: SnippetKind.MethodBody,
        types: [
            SnippetType.Expansion,
        ],
    };

    const xml = writeSnippetToXml(snippet);
    const roundTripSnippet = parseSnippetFromXml(xml);

    assert(roundTripSnippet.isOk === true);
    expect(roundTripSnippet.value).toMatchObject(snippet);
});


test("Round trip starting from XML", () => {

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<CodeSnippets xmlns="http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet">
    <CodeSnippet Format="1.0.0">
        <Header>
            <Title>Example title</Title>
            <Shortcut>example</Shortcut>
            <Description>Example description</Description>
            <Author>Example author</Author>
            <SnippetTypes>
                <SnippetType>Expansion</SnippetType>
            </SnippetTypes>
        </Header>
        <Snippet>
            <Declarations>
                <Literal Editable="true">
                    <ID>number</ID>
                    <Default>10</Default>
                    <ToolTip>A number</ToolTip>
                </Literal>
            </Declarations>
            <Code Language="CSharp" Kind="method body" Delimiter=":"><![CDATA[var x = :number:;]]></Code>
            <Imports>
                <Import>
                    <Namespace>System</Namespace>
                </Import>
            </Imports>
        </Snippet>
    </CodeSnippet>
</CodeSnippets>`.replace(/\n/g, "\r\n");

    const snippet = parseSnippetFromXml(xml);
    assert(snippet.isOk);

    const roundTripXml = writeSnippetToXml(snippet.value);
    expect(roundTripXml).toStrictEqual(xml);
});
