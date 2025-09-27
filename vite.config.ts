/** @format */

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vite.dev/config/
export default defineConfig({
	base: "/tc-animator/",
	plugins: [
		ViteImageOptimizer(),
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
		target: "esnext",

		rollupOptions: {
			treeshake: true,
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						if (id.includes("react-three")) {
							return "react-three";
						}

						if (id.includes("three")) {
							return "three";
						}

						if (id.includes("monaco")) {
							return "monaco";
						}

						if (id.includes("lucide")) {
							return "lucide";
						}

						if (id.includes("tailwind")) {
							return "tailwind";
						}

						if (id.includes("lodash")) {
							return "lodash";
						}

						if (id.includes("radix")) {
							return "radix";
						}

						if (id.includes("zustand")) {
							return "zustand";
						}

						if (id.includes("jsep")) {
							return "jsep";
						}

						if (id.includes("nbt")) {
							return "nbt";
						}

						if (id.includes("react")) {
							return "react";
						}
					}
				},
			},
		},
	},
});
