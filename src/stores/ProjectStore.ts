/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { fileOpen, fileSave, type FileWithHandle } from "browser-fs-access";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { MetadataSchema, type Metadata } from "@/schemas/ProjectSchema";
import {
	CartSchema,
	type Attachment,
	type Cart,
} from "@/schemas/SavedTrainPropertiesSchema";
import { toast } from "sonner";
import superjson from "superjson";
import { create } from "zustand";

import { convertGltfToGlb } from "@/lib/gltf";
import { toPureArrayBuffer } from "@/lib/utils";
import { useGuidelineStore } from "@/stores/GuidelineStore";
import equal from "fast-deep-equal";

export const FILE_EXTENSION = ".tcaproj";
export const FILE_HEADER = strToU8("🦊🚂🎬");

export const SCHEMA_VERSION = 0;

interface ProjectStore {
	// Core state
	saved: boolean;

	metadata: Metadata;

	cart: Cart | null;

	modelIds: number[];
	modelFiles: Map<number, ArrayBuffer>;

	fileHandle?: FileSystemFileHandle;

	selectedObjectPath?: string; // JSON path to the selected object in the cart

	// Setters and actions
	setMetadata: (metadata: ProjectStore["metadata"]) => void;

	setProjectName: (name: string) => void;
	setCart: (cart: Cart | null) => void;
	clearCart: () => void;

	setSelectedObjectPath: (path: string | undefined) => void;

	// Persistence
	saveProject: (newFile?: boolean) => Promise<void>;

	loadProjectFromFileDialog: () => Promise<void>;
	loadProjectFromFileHandle: (handle: FileWithHandle) => Promise<void>;

	reset: () => void;

	// Model file logic
	setModelFile: (modelId: number, data: ArrayBuffer | undefined) => void;
	removeModelFile: (modelId: number) => void;

	// Debug
	logState: () => void;
}

function collectModelIds(cart: Cart | null): number[] {
	if (!cart) return [];
	const collected = new Set<number>();

	function extractFromComponents(components?: Record<string, unknown>) {
		if (
			components &&
			typeof components === "object" &&
			"minecraft:custom_model_data" in components
		) {
			const custom = components["minecraft:custom_model_data"] as {
				floats?: number[];
			};
			if (custom?.floats) {
				for (const val of custom.floats) {
					collected.add(val);
				}
			}
		}
	}

	function traverseAttachments(attachments: Record<string, Attachment>) {
		for (const key of Object.keys(attachments)) {
			const attachment = attachments[key];

			extractFromComponents(attachment.item?.components);

			if (attachment.attachments) {
				traverseAttachments(attachment.attachments);
			}
		}
	}

	if (cart.model) {
		extractFromComponents(cart.model.item?.components);

		if (cart.model.attachments) {
			traverseAttachments(cart.model.attachments);
		}
	}

	return Array.from(collected).sort((a, b) => a - b);
}

export const useProjectStore = create<ProjectStore>((setOrg, get, store) => {
	const set: typeof setOrg = (partial) => {
		const update = typeof partial === "function" ? partial(get()) : partial;

		// Only set saved = false if metadata changes (excluding orbitControls), cart, or modelIds change
		const prevState = get();
		const nextState: Partial<ProjectStore> = { ...update };

		let shouldSetSavedFalse = false;

		// Check if metadata is being updated (excluding orbitControls)
		if ("metadata" in nextState && nextState.metadata) {
			const prevMeta = { ...prevState.metadata };
			const nextMeta = { ...nextState.metadata };
			delete prevMeta.orbitControls;
			delete nextMeta.orbitControls;

			if (!equal(prevMeta, nextMeta)) {
				shouldSetSavedFalse = true;
			}
		}

		// If explicitly setting saved: true, honor it
		if ("saved" in nextState && nextState.saved === true) {
			nextState.saved = true;
		} else if (shouldSetSavedFalse) {
			nextState.saved = false;
		}

		// always do partial update -> omit replace
		return setOrg(nextState);
	};

	return {
		saved: false,

		metadata: {
			schemaVersion: SCHEMA_VERSION,

			projectName: "",

			createdAt: null,
			lastModifiedAt: null,

			orbitControls: undefined,

			guidelines: useGuidelineStore.getState().guidelines,
		},

		cart: null,

		modelIds: [],
		modelFiles: new Map<number, ArrayBuffer>(),

		selectedObjectPath: undefined,

		setSelectedObjectPath: (path) => set({ selectedObjectPath: path }),

		setMetadata: (metadata) => set({ metadata }),

		setProjectName: (name) =>
			set((state) => ({
				metadata: {
					...state.metadata,
					projectName: name,
				},
			})),
		setCart: (cart) => set({ cart, modelIds: collectModelIds(cart) }),
		clearCart: () => set({ cart: null }),

		saveProject: async (newFile) => {
			const projectStore = useProjectStore.getState();

			if (!projectStore.cart) {
				throw new Error("No cart data to save.");
			}

			const fileName = `${projectStore.metadata.projectName || "TCA-Project"}${FILE_EXTENSION}`;

			// Setup the metadata with the current date if not set
			const localMetadata = {
				...projectStore.metadata,
				createdAt: projectStore.metadata.createdAt || new Date(),
			};

			const zipFiles: Record<string, Uint8Array> = {
				"metadata.json": strToU8(superjson.stringify(localMetadata)),
				"cart.json": strToU8(superjson.stringify(projectStore.cart)),
			};

			// add .gltf and .glb models to a "models/" folder
			for (const modelId of projectStore.modelIds) {
				// 1. Check if the file is a .glb or .gltf
				const data = projectStore.modelFiles.get(modelId);
				if (!data) continue;

				// 2. Determine file type by checking the first few bytes
				const header = new Uint8Array(data.slice(0, 4));
				let extension = ".gltf"; // default
				if (
					header[0] === 0x67 && // 'g'
					header[1] === 0x6c && // 'l'
					header[2] === 0x54 && // 'T'
					header[3] === 0x46 // 'F'
				) {
					extension = ".glb";
				}

				// 3. If it's a .gltf, convert to .glb
				if (extension === ".gltf") {
					const glbData = await convertGltfToGlb(data);
					zipFiles[`models/${modelId}.glb`] = glbData;
				} else {
					zipFiles[`models/${modelId}.glb`] = new Uint8Array(data);
				}
			}

			// Create the zip file with fflate
			const zipDataRaw = zipSync(zipFiles, { level: 9, mem: 8 });

			// Prepend the file header
			const header = new Uint8Array(
				FILE_HEADER.length + zipDataRaw.length,
			);
			header.set(FILE_HEADER);
			header.set(zipDataRaw, FILE_HEADER.length);

			const fixedBuffer = new Uint8Array(header.length);
			fixedBuffer.set(header);

			const blob = new Blob([fixedBuffer], {
				type: "application/binary",
			});

			const fileHandle = projectStore.fileHandle;

			if (!fileHandle || newFile) {
				// Save using browser-fs-access
				const localFileHandle = await toast
					.promise(
						Promise.race([
							fileSave(blob, {
								fileName,
								extensions: [FILE_EXTENSION],
								mimeTypes: ["application/binary"],
								id: "tca-project",
							}),
							new Promise<never>((_, reject) =>
								setTimeout(
									() => reject(new Error("Save timed out.")),
									15000,
								),
							),
						]),
						{
							loading: "Saving project...",
							success: "Project saved successfully!",
							error: "Failed to save the project.",
						},
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
								lastModifiedAt: new Date(),
								projectName: localFileHandle.name.replace(
									FILE_EXTENSION,
									"",
								),
							},
						});
					}
				}
			} else {
				// Save to the existing file handle
				const success = await toast
					.promise(
						Promise.race([
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
							new Promise<never>((_, reject) =>
								setTimeout(
									() => reject(new Error("Save timed out.")),
									15000,
								),
							),
						]),
						{
							loading: "Saving project...",
							success: "Project saved successfully!",
							error: "Failed to save the project.",
						},
					)
					.unwrap();

				if (success) {
					set({
						saved: true,
						fileHandle,
						metadata: {
							...localMetadata,
							lastModifiedAt: new Date(),
						},
					});
				}
			}
		},

		loadProjectFromFileDialog: async () => {
			const fileHandle = await fileOpen({
				description: "Select a TCA-Project file",
				extensions: [FILE_EXTENSION],
				mimeTypes: ["application/binary"],
				id: "tca-project",
				startIn: "documents",
			}).catch(() => {
				return null;
			});

			if (!fileHandle) {
				throw new Error("No file selected.");
			}

			await get().loadProjectFromFileHandle(fileHandle);
		},

		loadProjectFromFileHandle: async (fileHandle) => {
			if (!fileHandle) {
				throw new Error("No file handle.");
			}

			await get().reset();

			const buffer = await fileHandle.arrayBuffer();

			const header = new Uint8Array(FILE_HEADER.length);
			header.set(FILE_HEADER);
			const bufferHeader = new Uint8Array(
				buffer.slice(0, FILE_HEADER.length),
			);
			if (
				!bufferHeader.every(
					(value: number, index: number) => value === header[index],
				)
			) {
				throw new Error("Invalid TCA-Project file format.");
			}

			const zipData = new Uint8Array(buffer.slice(FILE_HEADER.length));
			const unzipped = await unzipSync(zipData);

			for (const [filename, fileData] of Object.entries(unzipped)) {
				if (filename === "metadata.json") {
					const data = superjson.parse(strFromU8(fileData));

					const parsed = MetadataSchema.safeParse(data);
					if (!parsed.success) {
						console.error(
							"Invalid metadata in project:",
							parsed.error,
						);
						toast.error(
							"We couldn't load your project. The metadata is invalid. See the browser console for more details.",
							{ duration: 10000 },
						);

						// Reset self
						get().reset();

						continue;
					}

					set({
						metadata: parsed.data,
					});
				} else if (filename === "cart.json") {
					const data = superjson.parse(strFromU8(fileData)) as Cart;

					const parsed = CartSchema.safeParse(data);

					if (!parsed.success) {
						console.error(
							"Invalid cart data in project:",
							parsed.error,
						);
						toast.error(
							"We couldn't load your project. The cart data is invalid. See the browser console for more details.",
							{ duration: 10000 },
						);

						// Reset self
						get().reset();

						continue;
					}

					set({
						cart: parsed.data,
						modelIds: collectModelIds(parsed.data),
					});
				} else if (
					filename.startsWith("models/") &&
					filename.endsWith(".glb")
				) {
					const modelId = parseInt(
						filename.replace("models/", "").replace(".glb", ""),
					);
					if (!isNaN(modelId)) {
						set((state) => {
							const newMap = new Map(state.modelFiles);
							newMap.set(
								modelId,
								toPureArrayBuffer(fileData.buffer),
							);
							return { modelFiles: newMap };
						});
					}
				} else {
					console.warn(`Unknown file in TCA-Project: ${filename}`);
				}
			}

			set({ saved: true, fileHandle: fileHandle.handle });
		},

		reset: () => set(store.getInitialState()),

		setModelFile: (modelId, data) => {
			set((state) => {
				const newMap = new Map(state.modelFiles);
				if (data) {
					newMap.set(modelId, data);
				} else {
					newMap.delete(modelId);
				}
				return { modelFiles: newMap, saved: false };
			});
		},
		removeModelFile: (modelId) => {
			set((state) => {
				const newMap = new Map(state.modelFiles);
				newMap.delete(modelId);
				return { modelFiles: newMap, saved: false };
			});
		},

		// Debug
		logState: () => {
			const state = get();
			console.log("ProjectStore state:", state);
		},
	};
});
