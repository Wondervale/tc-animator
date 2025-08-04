/** @format */

import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	base: "/tc-animator/",
	plugins: [
		react({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		rollupOptions: {
			treeshake: true,
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						if (id.includes("three")) {
							return "three";
						}
						if (id.includes("@react-three")) {
							return "@react-three";
						}
						if (id.includes("monaco-editor")) {
							return "monaco-editor";
						}
					}
				},
			},
		},
	},
});
