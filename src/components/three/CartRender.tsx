/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import type { Attachment, Model } from "@/schemas/SavedTrainPropertiesSchema";

import CustomModelRenderer from "@/components/three/CustomModelRenderer";
import Dummy from "@/components/three/Dummy";
import { degreeToRadian } from "@/lib/utils";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";

import { CameraFacingText } from "@/components/three/CameraFacingText";
import { useRef } from "react";
import { Euler, Vector3, type Group, type Object3D } from "three";

function CartRender({ onSelect }: { onSelect: (obj: Object3D) => void }) {
	const { cart, setSelectedObjectPath } = useProjectStore();
	const groupRef = useRef<Group>(null);

	if (!cart?.model) return null;

	const jsonPath = "$.model";

	const { position } = cart.model;

	const pos: Vector3 = new Vector3(
		position?.posX || 0,
		position?.posY || 0,
		position?.posZ || 0,
	);
	const rot: Euler = new Euler(
		degreeToRadian(position?.rotX || 0),
		degreeToRadian(position?.rotY || 0),
		degreeToRadian(position?.rotZ || 0),
	);
	const scale: Vector3 = new Vector3(
		position?.sizeX || 1,
		position?.sizeY || 1,
		position?.sizeZ || 1,
	);

	return (
		<group
			ref={groupRef}
			position={pos}
			rotation={rot}
			onClick={(e) => {
				e.stopPropagation();
				if (groupRef.current) {
					onSelect(groupRef.current);
					setSelectedObjectPath(jsonPath);
				}
			}}
		>
			{/* Root mesh */}
			<group scale={scale}>
				<CustomModelRenderer jsonPath="$.model" />
			</group>
			<AttachmentRender
				attachments={cart.model}
				onSelect={onSelect}
				jsonPath="$.model"
			/>
		</group>
	);
}

function AttachmentItem({
	attachment,
	onSelect,
	jsonPath,
}: {
	attachment: Attachment | Model;
	onSelect: (obj: Object3D) => void;
	jsonPath: string;
}) {
	const preferences = usePreferences();
	const { setSelectedObjectPath } = useProjectStore();

	const groupRef = useRef<Group>(null);

	const pos: Vector3 = new Vector3(
		attachment.position?.posX || 0,
		attachment.position?.posY || 0,
		attachment.position?.posZ || 0,
	);
	const rot: Euler = new Euler(
		degreeToRadian(attachment.position?.rotX || 0),
		degreeToRadian(attachment.position?.rotY || 0),
		degreeToRadian(attachment.position?.rotZ || 0),
	);
	const scale: Vector3 = new Vector3(
		attachment.position?.sizeX || 1,
		attachment.position?.sizeY || 1,
		attachment.position?.sizeZ || 1,
	);

	return (
		<group
			ref={groupRef}
			position={pos}
			rotation={rot}
			onClick={(e) => {
				if (
					groupRef.current &&
					!["SEAT", "HITBOX"].includes(attachment.type)
				) {
					e.stopPropagation();
					onSelect(groupRef.current);
					setSelectedObjectPath(jsonPath);
				}
			}}
		>
			{/* Mesh - gets world scale */}
			<group scale={scale}>
				{(() => {
					switch (attachment.type) {
						case "SEAT":
							return (
								<>
									{preferences.debugText && (
										<CameraFacingText
											fontSize={0.3}
											color="white"
											anchorX="center"
											anchorY="middle"
											outlineWidth={0.05}
											outlineColor="black"
											position={[0, 3.5, 0]}
										>
											{`${
												attachment.names
													? Array.isArray(
															attachment.names,
														) &&
														attachment.names
															.length > 0
														? attachment.names[0]
														: "Seat"
													: "Seat"
											}\nPos:${pos
												.toArray()
												.map(
													(v) => `\n${v.toFixed(2)}`,
												)}`}
										</CameraFacingText>
									)}
									<Dummy />
								</>
							);
						case "HITBOX":
							return null; // Hitboxes are not rendered visually
						default:
							return <CustomModelRenderer jsonPath={jsonPath} />;
					}
				})()}
			</group>

			{/* Debug text - NOT scaled */}
			{preferences.debugText &&
				!["SEAT", "HITBOX"].includes(attachment.type) && (
					<CameraFacingText
						position={[0, 1.5, 0]} // follows position/rotation but not scale
						fontSize={0.3}
						color="yellow"
						anchorX="center"
						anchorY="middle"
						scale={[1, 1, 1]} // ensure no accidental scaling
						outlineWidth={0.05}
						outlineColor="black"
					>
						{`${
							attachment.names
								? Array.isArray(attachment.names) &&
									attachment.names.length > 0
									? attachment.names[0]
									: ""
								: ""
						}\nPos:${pos.toArray().map((v) => v.toFixed(2))}\nrot:${rot
							.toArray()
							.filter((v): v is number => typeof v === "number")
							.map((v) =>
								v.toFixed(2),
							)}\nscale:${scale.toArray().map((v) => v.toFixed(2))}`}
					</CameraFacingText>
				)}

			{/* Recurse down */}
			{attachment.attachments && (
				<AttachmentRender
					attachments={attachment}
					onSelect={onSelect}
					jsonPath={`${jsonPath}`}
				/>
			)}
		</group>
	);
}

function AttachmentRender({
	attachments,
	onSelect,
	jsonPath,
}: {
	attachments: Attachment | Model;
	onSelect: (obj: Object3D) => void;
	jsonPath: string;
}) {
	return Object.entries(attachments.attachments || {}).map(
		([key, attachment]) => (
			<AttachmentItem
				key={key}
				attachment={attachment}
				onSelect={onSelect}
				jsonPath={`${jsonPath}.attachments.${key}`}
			/>
		),
	);
}

export default CartRender;
