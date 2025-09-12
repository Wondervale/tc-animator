/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { z } from "zod";

export const MetadataSchema = z.object({
	schemaVersion: z.number().min(0).default(0),

	projectName: z.string(),

	createdAt: z.date().optional().nullable(),
	lastModifiedAt: z.date().optional().nullable(),

	orbitControls: z
		.object({
			position: z.tuple([z.number(), z.number(), z.number()]),
			target: z.tuple([z.number(), z.number(), z.number()]),
			zoom: z.number().optional(),
		})
		.optional(),
});
export type Metadata = z.infer<typeof MetadataSchema>;
