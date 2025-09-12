/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { fileOpen, fileSave } from "browser-fs-access";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { CartSchema, type Cart } from "@/schemas/SavedTrainPropertiesSchema";
import { MetadataSchema, type Metadata } from "@/schemas/ProjectSchema";
import { create } from "zustand";
import superjson from "superjson";
import { toast } from "sonner";

export const fileHeader = strToU8("🦊🚂🎬");

export const SCHEMA_VERSION = 0;

interface ProjectStore {
	saved: boolean;

	metadata: Metadata;

	cart: Cart | null;

	fileHandle?: FileSystemFileHandle;

	selectedObjectPath?: string; // JSON path to the selected object in the cart

	setMetadata: (metadata: ProjectStore["metadata"]) => void;

	setProjectName: (name: string) => void;
	setCart: (cart: Cart | null) => void;
	clearCart: () => void;

	setSelectedObjectPath: (path: string | undefined) => void;

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

			// Don't set save to false if only the selected object path is being updated
			if (nextState.selectedObjectPath) {
				nextState.saved = get().saved;
			}
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
		},

		cart: null,

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
					"metadata.json": strToU8(
						superjson.stringify(localMetadata),
					),
					"cart.json": strToU8(
						superjson.stringify(projectStore.cart),
					),
				},
				{ level: 9 },
			);

			// Prepend the file header
			const header = new Uint8Array(
				fileHeader.length + zipDataRaw.length,
			);
			header.set(fileHeader);
			header.set(zipDataRaw, fileHeader.length);

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
									/\.tcaproj$/,
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
			const bufferHeader = new Uint8Array(
				buffer.slice(0, fileHeader.length),
			);
			if (
				!bufferHeader.every(
					(value: number, index: number) => value === header[index],
				)
			) {
				throw new Error("Invalid TCA-Project file format.");
			}

			const zipData = new Uint8Array(buffer.slice(fileHeader.length));
			const unzipped = await unzipSync(zipData);

			for (const [filename, fileData] of Object.entries(unzipped)) {
				switch (filename) {
					case "metadata.json": {
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
							set({
								metadata: {
									schemaVersion: SCHEMA_VERSION,
									projectName: "",
									createdAt: null,
									lastModifiedAt: null,
								},
								cart: null,
								fileHandle: undefined,
							});

							continue;
						}

						set({
							metadata: parsed.data,
						});
						break;
					}
					case "cart.json": {
						const data = superjson.parse(
							strFromU8(fileData),
						) as Cart;

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
							set({
								metadata: {
									schemaVersion: SCHEMA_VERSION,
									projectName: "",
									createdAt: null,
									lastModifiedAt: null,
								},
								cart: null,
								fileHandle: undefined,
							});

							continue;
						}

						set({ cart: parsed.data });
						break;
					}
					default:
						console.warn(
							`Unknown file in TCA-Project: ${filename}`,
						);
						break;
				}
			}

			set({ saved: true, fileHandle: fileHandle.handle });
		},

		reset: () =>
			set({
				metadata: {
					schemaVersion: SCHEMA_VERSION,
					projectName: "",
					createdAt: null,
					lastModifiedAt: null,
				},
				cart: null,
				fileHandle: undefined,
			}),
	};
});
