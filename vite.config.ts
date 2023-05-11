import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import postcssNesting from "postcss-nesting";

export default defineConfig({
    plugins: [
        solidPlugin()
    ],
    css: {
        postcss: {
            plugins: [
                postcssNesting()
            ]
        }
    }
});
