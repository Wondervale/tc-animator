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
		chunkSizeWarningLimit: 1000,
		minify: "terser",

		rollupOptions: {
			treeshake: true,
			external: (id) => {
				// Exclude unused Three.js modules
				if (id.includes("three/src/loaders/")) return true;
				if (id.includes("three/src/controls/")) return true;
				if (id.includes("three/src/exporters/")) return true;
				return false;
			},
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						if (id.includes("react-three")) {
							return "react-three";
						}

						if (id.includes("three")) {
							// Split Three.js into smaller chunks
							if (id.includes("three/examples/jsm/")) {
								return "three-examples";
							}
							if (id.includes("three/src/math/")) {
								return "three-math";
							}
							if (id.includes("three/src/renderers/")) {
								return "three-renderers";
							}
							if (id.includes("three/src/scenes/")) {
								return "three-scenes";
							}
							if (id.includes("three/src/materials/")) {
								return "three-materials";
							}
							if (id.includes("three/src/geometries/")) {
								return "three-geometries";
							}
							return "three-core";
						}

						// Handle react-konva explicitly so it isn't accidentally left unchunked
						if (id.includes("react-konva")) {
							return "react-konva";
						}

						// Konva (core) - exclude react wrappers
						if (
							id.includes("konva") &&
							!id.includes("react") &&
							!id.includes("react-konva")
						) {
							return "konva";
						}

						if (id.includes("monaco")) {
							return "monaco";
						}

						if (id.includes("lucide")) {
							// Split Lucide icons by category
							if (id.includes("lucide-react/icons/")) {
								return "lucide-icons";
							}
							return "lucide-core";
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

						// Ensure zustand/react helpers are grouped with zustand
						if (id.includes("zustand/react")) {
							return "zustand";
						}

						if (id.includes("zustand") && !id.includes("react")) {
							return "zustand";
						}

						if (id.includes("jsep")) {
							return "jsep";
						}

						if (id.includes("nbt")) {
							return "nbt";
						}

						if (
							id.includes("react") &&
							!id.includes("react-konva") &&
							!id.includes("react-three") &&
							!id.includes("zustand")
						) {
							return "react";
						}
					}
				},
			},
		},
	},
	server: {
		allowedHosts: [".ngrok-free.app", ".trycloudflare.com"],
	},
});
