/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { z } from "zod";

export const MetadataSchema = z.object({
	projectName: z.string(),
	createdAt: z.date().nullable(),
	orbitControls: z
		.object({
			position: z.tuple([z.number(), z.number(), z.number()]),
			target: z.tuple([z.number(), z.number(), z.number()]),
			zoom: z.number().optional(),
		})
		.optional(),
});
export type Metadata = z.infer<typeof MetadataSchema>;
