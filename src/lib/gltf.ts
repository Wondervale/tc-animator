/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { WebIO } from "@gltf-transform/core";

/**
 * Loads a GLTF model from an ArrayBuffer and returns the binary GLB as Uint8Array.
 * @param buffer ArrayBuffer containing the GLTF file.
 * @returns Promise<Uint8Array> representing the GLB binary.
 */
export async function convertGltfToGlb(
	buffer: ArrayBuffer,
): Promise<Uint8Array> {
	const uri = URL.createObjectURL(new Blob([buffer]));

	const io = new WebIO();
	const document = await io.read(uri);
	const glb = await io.writeBinary(document);
	return glb;
}
