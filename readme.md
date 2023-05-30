# Snippety

Snippety is a web application for creating and editing Visual Studio snippet files.

- Hosted on GitHub Pages [here](https://jackgriffiths.github.io/snippety)
- Created using [SolidJS](https://www.solidjs.com)
- Uses [highlight.js](https://highlightjs.org/) for code highlighting
- Built with [Vite](https://vitejs.dev)

## Future Work

### Functions

Visual Studio allows C# snippets to use [functions](https://learn.microsoft.com/en-us/visualstudio/ide/code-snippet-functions?view=vs-2022)
to dynamically evaluate the value of a placeholder. For example, the built-in `ctor`
snippet uses a `ClassName()` function to evaluate the name of the class in which the
snippet is being invoked.

These functions are not yet supported in Snippety.

### Installable PWA

Snippety could be packaged as a PWA that is installable and works offline. It could also be set up to act as a file handler for `.snippet` files, although this feature is not widely supported by browsers yet.
