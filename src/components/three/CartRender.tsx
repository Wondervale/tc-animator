/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import type { Attachment, Model } from "@/schemas/SavedTrainPropertiesSchema";

import Cube from "@/components/three/Cube";
import { degreeToRadian } from "@/lib/utils";
import { useProjectStore } from "@/stores/ProjectStore";

function CartRender() {
	const { cart } = useProjectStore();

	if (!cart?.model) return null;

	const { position } = cart.model;

	const pos: [number, number, number] = [position?.posX || 0, position?.posY || 0, position?.posZ || 0];

	const rot: [number, number, number] = [
		degreeToRadian(position?.rotX || 0),
		degreeToRadian(position?.rotY || 0),
		degreeToRadian(position?.rotZ || 0),
	];

	const scale: [number, number, number] = [position?.sizeX || 1, position?.sizeY || 1, position?.sizeZ || 1];

	return (
		<group position={pos} rotation={rot} scale={scale}>
			<AttachmentRender attachments={cart.model} />
		</group>
	);
}

function AttachmentRender({ attachments }: { attachments: Attachment | Model }) {
	return (
		<>
			{Object.entries(attachments.attachments || {}).map(([key, attachment]) => {
				const pos: [number, number, number] = [
					attachment.position?.posX || 0,
					attachment.position?.posY || 0,
					attachment.position?.posZ || 0,
				];

				const rot: [number, number, number] = [
					degreeToRadian(attachment.position?.rotX || 0),
					degreeToRadian(attachment.position?.rotY || 0),
					degreeToRadian(attachment.position?.rotZ || 0),
				];

				const scale: [number, number, number] = [
					attachment.position?.sizeX || 1,
					attachment.position?.sizeY || 1,
					attachment.position?.sizeZ || 1,
				];

				return (
					<group key={key} position={pos} rotation={rot} scale={scale}>
						{/* Placeholder cube */}
						<Cube args={[1, 1, 1]} position={[0, 0, 0]} />

						{/* Recursively render nested attachments */}
						{attachment.attachments && <AttachmentRender attachments={attachment} />}
					</group>
				);
			})}
		</>
	);
}

export default CartRender;
