/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import type { Attachment, Model } from "@/schemas/SavedTrainPropertiesSchema";

import Cube from "@/components/three/Cube";
import Dummy from "@/components/three/Dummy";
import { Text, type TextProps } from "@react-three/drei";
import { degreeToRadian } from "@/lib/utils";
import { useProjectStore } from "@/stores/ProjectStore";
import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { usePreferences } from "@/stores/PreferencesStore";
import { Euler, Quaternion, Vector3, type Object3D } from "three";

function CartRender() {
	const { cart } = useProjectStore();

	if (!cart?.model) return null;

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
		<group position={pos} rotation={rot}>
			{/* Root mesh */}
			<group scale={scale}>
				<Cube />
			</group>
			<AttachmentRender attachments={cart.model} />
		</group>
	);
}

function AttachmentRender({
	attachments,
}: {
	attachments: Attachment | Model;
}) {
	const preferences = usePreferences();

	return (
		<>
			{Object.entries(attachments.attachments || {}).map(
				([key, attachment]) => {
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
						<group key={key} position={pos} rotation={rot}>
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
															position={[
																0, 3.5, 0,
															]}
														>
															{`S: ${key}\nPos:${pos
																.toArray()
																.map(
																	(v) =>
																		`\n${v.toFixed(2)}`,
																)}`}
														</CameraFacingText>
													)}
													<Dummy />
												</>
											);
										case "HITBOX":
											return null; // Hitboxes are not rendered visually
										default:
											return <Cube />;
									}
								})()}
							</group>

							{/* Debug text - NOT scaled */}
							{preferences.debugText &&
								!["SEAT", "HITBOX"].includes(
									attachment.type,
								) && (
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
										{`${key}\npos:${pos.toArray().map((v) => v.toFixed(2))}\nrot:${rot
											.toArray()
											.filter(
												(v): v is number =>
													typeof v === "number",
											)
											.map((v) =>
												v.toFixed(2),
											)}\nscale:${scale.toArray().map((v) => v.toFixed(2))}`}
									</CameraFacingText>
								)}

							{/* Recurse down */}
							{attachment.attachments && (
								<AttachmentRender attachments={attachment} />
							)}
						</group>
					);
				},
			)}
		</>
	);
}

function CameraFacingText(props: TextProps & { children: React.ReactNode }) {
	const ref = useRef<Object3D>(null);
	const { camera } = useThree();

	useFrame(() => {
		if (!ref.current) return;

		const textPos = ref.current.getWorldPosition(new Vector3());
		const camPos = camera.position.clone();
		camPos.y = textPos.y;

		const dir = camPos.sub(textPos).normalize();
		let angle = Math.atan2(dir.x, dir.z);

		if (ref.current.parent) {
			const parentQuat = new Quaternion();
			ref.current.parent.getWorldQuaternion(parentQuat);

			const parentEuler = new Euler().setFromQuaternion(
				parentQuat,
				"YXZ",
			);
			const parentRotationY = parentEuler.y;

			angle = angle - parentRotationY + Math.PI;
		} else {
			angle += Math.PI;
		}

		ref.current.rotation.set(0, angle + degreeToRadian(180), 0);
	});

	return (
		<Text ref={ref} {...props}>
			{props.children}
		</Text>
	);
}

export default CartRender;
