/**
 * Copyright (c) 2025 Foxxite | Articca
 * All rights reserved.
 *
 * @format
 */

import { fileOpen, fileSave, type FileWithHandle } from "browser-fs-access";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { convertGltfToGlb } from "@/lib/gltf";
import { toPureArrayBuffer } from "@/lib/utils";
import { type Guideline } from "@/schemas/GuidelineSchema";
import { MetadataSchema, type Metadata } from "@/schemas/ProjectSchema";
import {
	CartSchema,
	type Attachment,
	type Cart,
} from "@/schemas/SavedTrainPropertiesSchema";
import equal from "fast-deep-equal";
import { toast } from "sonner";
import superjson from "superjson";
import { create } from "zustand";

export const FILE_EXTENSION = ".tcaproj";
export const FILE_HEADER = strToU8("🦊🚂🎬");
export const SCHEMA_VERSION = 0;

interface ModelFile {
	arrayBuffer: ArrayBuffer;
	blob: Blob;
	url: string;
}

interface ProjectStore {
	// Core state
	saved: boolean;
	metadata: Metadata;
	cart: Cart | null;

	modelIds: number[];
	modelFiles: Map<number, ModelFile>;
	fileHandle?: FileSystemFileHandle;
	selectedObjectPath?: string; // JSON path to selected object in cart

	// Setters and actions
	setMetadata: (metadata: ProjectStore["metadata"]) => void;
	setProjectName: (name: string) => void;
	setCart: (cart: Cart | null) => void;
	clearCart: () => void;
	setSelectedObjectPath: (path: string | undefined) => void;

	// Guidelines logic (moved from GuidelineStore)
	addGuideline: (guideline: Guideline) => void;
	removeGuideline: (index: number) => void;
	updateGuideline: (index: number, updated: Partial<Guideline>) => void;
	resetGuidelines: () => void;

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
		if (cart.model.attachments) traverseAttachments(cart.model.attachments);
	}

	return Array.from(collected).sort((a, b) => a - b);
}

function getArrayBufferGLBMimeType(arrayBuffer: ArrayBuffer): string {
	const header = new Uint8Array(arrayBuffer.slice(0, 4));
	if (
		header[0] === 0x67 && // 'g'
		header[1] === 0x6c && // 'l'
		header[2] === 0x54 && // 'T'
		header[3] === 0x46 // 'F'
	) {
		return "model/gltf-binary";
	}
	return "model/gltf+json";
}

function gltArrayBufferToModelFile(arrayBuffer: ArrayBuffer): ModelFile {
	const blob = new Blob([arrayBuffer], {
		type: getArrayBufferGLBMimeType(arrayBuffer),
	});
	const url = URL.createObjectURL(blob);
	return { arrayBuffer, blob, url };
}

export const useProjectStore = create<ProjectStore>((setOrg, get, store) => {
	const set: typeof setOrg = (partial) => {
		const update = typeof partial === "function" ? partial(get()) : partial;
		const prevState = get();
		const nextState: Partial<ProjectStore> = { ...update };

		let shouldSetSavedFalse = false;

		// Detect metadata changes (excluding orbitControls)
		if ("metadata" in nextState && nextState.metadata) {
			const prevMeta = { ...prevState.metadata };
			const nextMeta = { ...nextState.metadata };
			delete prevMeta.orbitControls;
			delete nextMeta.orbitControls;
			if (!equal(prevMeta, nextMeta)) {
				shouldSetSavedFalse = true;
			}
		}

		if ("saved" in nextState && nextState.saved === true) {
			nextState.saved = true;
		} else if (shouldSetSavedFalse) {
			nextState.saved = false;
		}

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
			guidelines: [],
		},
		cart: null,
		modelIds: [],
		modelFiles: new Map<number, ModelFile>(),
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

		// --- Guideline actions moved here ---
		addGuideline: (guideline) =>
			set((state) => ({
				metadata: {
					...state.metadata,
					guidelines: [...state.metadata.guidelines, guideline],
				},
			})),

		removeGuideline: (index) =>
			set((state) => ({
				metadata: {
					...state.metadata,
					guidelines: state.metadata.guidelines.filter(
						(_, i) => i !== index,
					),
				},
			})),

		updateGuideline: (index, updated) =>
			set((state) => ({
				metadata: {
					...state.metadata,
					guidelines: state.metadata.guidelines.map((g, i) =>
						i === index ? { ...g, ...updated } : g,
					),
				},
			})),

		resetGuidelines: () =>
			set((state) => ({
				metadata: {
					...state.metadata,
					guidelines: [],
				},
			})),
		// -----------------------------------

		saveProject: async (newFile) => {
			const projectStore = get();
			if (!projectStore.cart) throw new Error("No cart data to save.");

			const fileName = `${projectStore.metadata.projectName || "TCA-Project"}${FILE_EXTENSION}`;

			const localMetadata = {
				...projectStore.metadata,
				createdAt: projectStore.metadata.createdAt || new Date(),
			};

			const zipFiles: Record<string, Uint8Array> = {
				"metadata.json": strToU8(superjson.stringify(localMetadata)),
				"cart.json": strToU8(superjson.stringify(projectStore.cart)),
			};

			for (const modelId of projectStore.modelIds) {
				const data = projectStore.modelFiles.get(modelId);
				if (!data) continue;

				const extension =
					getArrayBufferGLBMimeType(data.arrayBuffer) ===
					"model/gltf-binary"
						? ".glb"
						: ".gltf";

				if (extension === ".gltf") {
					const glbData = await convertGltfToGlb(data.arrayBuffer);
					zipFiles[`models/${modelId}.glb`] = glbData;
				} else {
					zipFiles[`models/${modelId}.glb`] = new Uint8Array(
						data.arrayBuffer,
					);
				}
			}

			const zipDataRaw = zipSync(zipFiles, { level: 9, mem: 8 });
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
				const localFileHandle = await toast
					.promise(
						fileSave(blob, {
							fileName,
							extensions: [FILE_EXTENSION],
							mimeTypes: ["application/binary"],
							id: "tca-project",
						}),
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
				}
			} else {
				await toast
					.promise(
						fileHandle.createWritable().then(async (writer) => {
							await writer.write(fixedBuffer);
							await writer.close();
						}),
						{
							loading: "Saving project...",
							success: "Project saved successfully!",
							error: "Failed to save the project.",
						},
					)
					.unwrap();

				set({
					saved: true,
					fileHandle,
					metadata: {
						...localMetadata,
						lastModifiedAt: new Date(),
					},
				});
			}
		},

		loadProjectFromFileDialog: async () => {
			const fileHandle = await fileOpen({
				description: "Select a TCA-Project file",
				extensions: [FILE_EXTENSION],
				mimeTypes: ["application/binary"],
				id: "tca-project",
				startIn: "documents",
			}).catch(() => null);

			if (!fileHandle) throw new Error("No file selected.");
			await get().loadProjectFromFileHandle(fileHandle);
		},

		loadProjectFromFileHandle: async (fileHandle) => {
			if (!fileHandle) throw new Error("No file handle.");

			await get().reset();
			const buffer = await fileHandle.arrayBuffer();
			const bufferHeader = new Uint8Array(
				buffer.slice(0, FILE_HEADER.length),
			);
			if (!bufferHeader.every((v, i) => v === FILE_HEADER[i])) {
				throw new Error("Invalid TCA-Project file format.");
			}

			const zipData = new Uint8Array(buffer.slice(FILE_HEADER.length));
			const unzipped = unzipSync(zipData);

			for (const [filename, fileData] of Object.entries(unzipped)) {
				if (filename === "metadata.json") {
					const parsed = MetadataSchema.safeParse(
						superjson.parse(strFromU8(fileData)),
					);
					if (parsed.success) set({ metadata: parsed.data });
					else {
						toast.error("Invalid metadata in project file.");
						get().reset();
					}
				} else if (filename === "cart.json") {
					const parsed = CartSchema.safeParse(
						superjson.parse(strFromU8(fileData)),
					);
					if (parsed.success)
						set({
							cart: parsed.data,
							modelIds: collectModelIds(parsed.data),
						});
					else {
						toast.error("Invalid cart data in project file.");
						get().reset();
					}
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
								gltArrayBufferToModelFile(
									toPureArrayBuffer(fileData.buffer),
								),
							);
							return { modelFiles: newMap };
						});
					}
				}
			}

			set({ saved: true, fileHandle: fileHandle.handle });
		},

		reset: () => set(store.getInitialState()),

		setModelFile: (modelId, data) =>
			set((state) => {
				const newMap = new Map(state.modelFiles);
				if (data) newMap.set(modelId, gltArrayBufferToModelFile(data));
				else newMap.delete(modelId);
				return { modelFiles: newMap, saved: false };
			}),

		removeModelFile: (modelId) =>
			set((state) => {
				const newMap = new Map(state.modelFiles);
				newMap.delete(modelId);
				return { modelFiles: newMap, saved: false };
			}),

		logState: () => console.log("ProjectStore state:", get()),
	};
});
