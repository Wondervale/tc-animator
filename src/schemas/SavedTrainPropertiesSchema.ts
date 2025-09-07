/** @format */

import NBT from "@avensaas/nbt-parser";
import { z } from "zod";

const PositionSchema = z.looseObject({
	transform: z.string().optional(),
	posX: z.number(),
	posY: z.number(),
	posZ: z.number(),
	rotX: z.number(),
	rotY: z.number(),
	rotZ: z.number(),
	sizeX: z.number().optional(),
	sizeY: z.number().optional(),
	sizeZ: z.number().optional(),
	anchor: z.string().optional(),
});

const DisplayItemSchema = z.looseObject({
	enabled: z.boolean(),
});

const ItemSchema = z.looseObject({
	"==": z.literal("org.bukkit.inventory.ItemStack"),
	DataVersion: z.number(),
	id: z.string(),
	count: z.number(),
	components: z
		.record(z.string(), z.string())
		.transform((components) => {
			// Try to parse each component value as JSON, fallback to string if parsing fails
			const parsed: Record<string, unknown> = {};

			for (const [key, value] of Object.entries(components)) {
				try {
					parsed[key] = NBT.parseSNBT(value).toJSON();
				} catch {
					parsed[key] = value;
				}
			}

			return parsed;
		})
		.optional(),
	schema_version: z.number(),
});

export type InternalAttachment = {
	type: string;
	item?: z.infer<typeof ItemSchema>;
	position: {
		posX: number;
		posY: number;
		posZ: number;
		rotX?: number;
		rotY?: number;
		rotZ?: number;
		sizeX?: number;
		sizeY?: number;
		sizeZ?: number;
	};
	attachments?: Record<string, Attachment>;
	displayItem?: unknown;
	shulkerColor?: string;
	schematic?: string;
	displayMode?: string;
	firstPersonViewMode?: string;
	firstPersonViewLockMode?: string;
	lockRotation?: boolean;
	names?: string[];
	text?: string;
	animations?: Record<
		string,
		{
			nodes: string[];
			looped?: boolean;
			speed?: number;
		}
	>;
	brightness?: {
		block: number;
		sky: number;
	};
};

export const AttachmentSchema: z.ZodType<InternalAttachment> = z.lazy(() =>
	z.object({
		type: z.string(),
		item: ItemSchema.optional(),
		position: PositionSchema,
		attachments: z.record(z.string(), AttachmentSchema).optional(),
		displayItem: DisplayItemSchema.optional(),
		shulkerColor: z.string().optional(),
		schematic: z.string().optional(),
		displayMode: z.string().optional(),
		firstPersonViewMode: z.string().optional(),
		firstPersonViewLockMode: z.string().optional(),
		lockRotation: z.boolean().optional(),
		names: z.array(z.string()).optional(),
		text: z.string().optional(),
		animations: z
			.record(
				z.string(),
				z.looseObject({
					nodes: z.array(z.string()),
					looped: z.boolean().optional(),
					speed: z.number().optional(),
				}),
			)
			.optional(),
		brightness: z
			.object({
				block: z.number(),
				sky: z.number(),
			})
			.optional(),
	}),
);
export type Attachment = z.infer<typeof AttachmentSchema>;

export const ModelSchema = z.looseObject({
	type: z.string(),
	entityType: z.string(),
	attachments: z.record(z.string(), AttachmentSchema),
	position: PositionSchema.optional(),
	item: ItemSchema.optional(),
	shulkerColor: z.string().optional(),
	editor: z
		.object({
			selectedIndex: z.number().optional(),
			animNodeSelectedOption: z.number().optional(),
			scrollOffset: z.number().optional(),
			expanded: z.boolean().optional(),
		})
		.passthrough()
		.optional(),
	animations: z
		.record(
			z.string(),
			z
				.object({
					nodes: z.array(z.string()),
					looped: z.boolean().optional(),
					speed: z.number().optional(),
				})
				.passthrough(),
		)
		.optional(),
	physical: z
		.object({
			cartLength: z.number().optional(),
			wheelCenter: z.number().optional(),
			wheelDistance: z.number().optional(),
			cartCouplerLength: z.number().optional(),
		})
		.passthrough()
		.optional(),
});
export type Model = z.infer<typeof ModelSchema>;

export const CartSchema = z.looseObject({
	model: ModelSchema.optional(),
	entityType: z.string(),
	flipped: z.boolean().optional(),
});
export type Cart = z.infer<typeof CartSchema>;

export const SavedTrainSchema = z.looseObject({
	savedName: z.string(),
	name: z.string().optional(),
	carts: z.record(z.string(), CartSchema).optional(),
	claims: z.array(z.string()).optional(),
	spawnPattern: z.string().optional(),
	flipped: z.boolean().optional(),
	spawnLimit: z.number().optional(),
	usedModels: z.array(z.string()).optional(),
});
export type SavedTrain = z.infer<typeof SavedTrainSchema>;

export const SavedTrainPropertiesSchema = z.record(
	z.string(),
	SavedTrainSchema,
);
export type SavedTrainProperties = z.infer<typeof SavedTrainPropertiesSchema>;

export function validateSavedTrainProperties(data: unknown): {
	valid: boolean;
	errors?: string[];
} {
	const result = SavedTrainPropertiesSchema.safeParse(data);

	if (result.success) {
		return { valid: true };
	}

	return {
		valid: false,
		errors: result.error.issues.map(
			(issue) => `${issue.path.join(".")}: ${issue.message}`,
		),
	};
}
