/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { fileOpen, fileSave } from "browser-fs-access";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import type { Cart } from "@/schemas/SavedTrainPropertiesSchema";
import { create } from "zustand";
import superjson from "superjson";
import { toast } from "sonner";

export const fileHeader = strToU8("🦊🚂🎬");

interface ProjectStore {
	saved: boolean;

	metadata: {
		projectName: string;
		createdAt: Date | null;

		orbitControls?: {
			position: [number, number, number];
			target: [number, number, number];
			zoom?: number;
		};
	};

	cart: Cart | null;

	fileHandle?: FileSystemFileHandle;

	setMetadata: (metadata: ProjectStore["metadata"]) => void;

	setProjectName: (name: string) => void;
	setCart: (cart: Cart | null) => void;
	clearCart: () => void;

	saveProject: (newFile?: boolean) => Promise<void>;
	loadProjectFromFile: () => Promise<void>;

	reset: () => void;
}

export const useProjectStore = create<ProjectStore>((setOrg, get) => {
	const set: typeof setOrg = (partial) => {
		const update = typeof partial === "function" ? partial(get()) : partial;

		// enforce saved = false unless explicitly true
		const nextState: Partial<ProjectStore> = { ...update };
		if ("saved" in nextState && nextState.saved === true) {
			nextState.saved = true;
		} else {
			// Don't set saved to false if the orbit controls are being updated
			if (!nextState.metadata?.orbitControls) {
				nextState.saved = false;
			}
		}

		// always do partial update -> omit replace
		return setOrg(nextState);
	};

	return {
		saved: false,

		metadata: {
			projectName: "",
			createdAt: null,
			orbitControls: undefined,
		},

		cart: null,

		setMetadata: (metadata) => set({ metadata }),

		setProjectName: (name) =>
			set((state) => ({
				metadata: {
					...state.metadata,
					projectName: name,
				},
			})),
		setCart: (cart) => set({ cart }),
		clearCart: () => set({ cart: null }),

		saveProject: async (newFile) => {
			const projectStore = useProjectStore.getState();

			if (!projectStore.cart) {
				throw new Error("No cart data to save.");
			}

			const fileName = `${projectStore.metadata.projectName || "TCA-Project"}.tcaproj`;

			// Setup the metadata with the current date if not set
			const localMetadata = {
				...projectStore.metadata,
				createdAt: projectStore.metadata.createdAt || new Date(),
			};

			// Create the zip file with fflate
			const zipDataRaw = zipSync(
				{
					"metadata.json": strToU8(superjson.stringify(localMetadata)),
					"cart.json": strToU8(superjson.stringify(projectStore.cart)),
				},
				{ level: 9 }
			);

			// Prepend the file header
			const header = new Uint8Array(fileHeader.length + zipDataRaw.length);
			header.set(fileHeader);
			header.set(zipDataRaw, fileHeader.length);

			const fixedBuffer = new Uint8Array(header.length);
			fixedBuffer.set(header);

			const blob = new Blob([fixedBuffer], { type: "application/binary" });

			const fileHandle = projectStore.fileHandle;

			if (!fileHandle || newFile) {
				// Save using browser-fs-access
				const localFileHandle = await toast
					.promise(
						fileSave(blob, {
							fileName,
							extensions: [".tcaproj"],
							mimeTypes: ["application/binary"],
							id: "tca-project",
						}),
						{
							loading: "Saving project...",
							success: "Project saved successfully!",
							error: "Failed to save the project.",
						}
					)
					.unwrap();

				if (localFileHandle) {
					set({
						saved: true,
						fileHandle: localFileHandle,
						metadata: { ...localMetadata },
					});

					if (localFileHandle.name !== fileName) {
						set({
							metadata: {
								...localMetadata,
								projectName: localFileHandle.name.replace(/\.tcaproj$/, ""),
							},
						});
					}
				}
			} else {
				// Save to the existing file handle
				const success = await toast
					.promise(
						fileHandle
							.createWritable()
							.then(async (writer) => {
								await writer.write(fixedBuffer);
								await writer.close();

								return true;
							})
							.catch(() => {
								return false;
							}),
						{
							loading: "Saving project...",
							success: "Project saved successfully!",
							error: "Failed to save the project.",
						}
					)
					.unwrap();

				if (success) {
					set({
						saved: true,
						fileHandle,
						metadata: { ...localMetadata },
					});
				}
			}
		},

		loadProjectFromFile: async () => {
			const fileHandle = await fileOpen({
				description: "Select a TCA-Project file",
				extensions: [".tcaproj"],
				mimeTypes: ["application/binary"],
				id: "tca-project",
				startIn: "documents",
			}).catch(() => {
				return null;
			});

			if (!fileHandle) {
				throw new Error("No file selected.");
			}

			const buffer = await fileHandle.arrayBuffer();

			const header = new Uint8Array(fileHeader.length);
			header.set(fileHeader);
			const bufferHeader = new Uint8Array(buffer.slice(0, fileHeader.length));
			if (!bufferHeader.every((value: number, index: number) => value === header[index])) {
				throw new Error("Invalid TCA-Project file format.");
			}

			const zipData = new Uint8Array(buffer.slice(fileHeader.length));
			const unzipped = await unzipSync(zipData);

			for (const [filename, fileData] of Object.entries(unzipped)) {
				switch (filename) {
					case "metadata.json": {
						set({
							metadata: superjson.parse(strFromU8(fileData)),
						});
						break;
					}
					case "cart.json": {
						const cart = superjson.parse(strFromU8(fileData)) as Cart;
						set({ cart });
						break;
					}
					default:
						console.warn(`Unknown file in TCA-Project: ${filename}`);
						break;
				}
			}

			set({ saved: true, fileHandle: fileHandle.handle });
		},

		reset: () => set({ metadata: { projectName: "", createdAt: null }, cart: null, fileHandle: undefined }),
	};
});
