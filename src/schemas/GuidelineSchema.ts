/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { z } from "zod";

export const GuidelineSchema = z.object({
	plane: z.enum(["XY", "XZ", "YZ"]),
	position: z
		.tuple([z.number(), z.number(), z.number()])
		.default([0.5, 0, 0.5]),
	cellSize: z.number().default(1 / 16),
	sectionSize: z.number().default(1),
	cellThickness: z.number().default(0.5),
	sectionThickness: z.number().default(1.5),
	cellColor: z
		.string()
		.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
		.optional(),
});
export type Guideline = z.infer<typeof GuidelineSchema>;
