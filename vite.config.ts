import postcssNesting from "postcss-nesting";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
    plugins: [
        solidPlugin()
    ],
    test: {
        environment: "jsdom"
    },
    css: {
        postcss: {
            plugins: [
                postcssNesting()
            ]
        }
    },
    build: {
        rollupOptions: {
            input: {
                "index": "index.html",
                "editor": "editor.html",
            },
            output: {
                manualChunks: {
                    "common": [
                        "/src/window-messaging.ts",
                        "/src/utilities/file-drag-and-drop.ts"
                    ]
                }
            }
        },
    }
});
