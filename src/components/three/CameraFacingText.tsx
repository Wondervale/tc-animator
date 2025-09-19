/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { degreeToRadian } from "@/lib/utils";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

import { Box, Text, type TextProps } from "@react-three/drei";
import { Euler, Quaternion, Vector3, type Object3D } from "three";

export function CameraFacingText(
	props: TextProps & { children: React.ReactNode },
) {
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
		<>
			<Box
				args={[0.3, 0.3, 0.3]}
				position={(() => {
					let x = 0,
						y = 0,
						z = -0.1;
					const pos = props.position;
					if (Array.isArray(pos) && pos.length === 3) {
						x = pos[0] ?? 0;
						y = pos[1] ?? 0;
						z = (pos[2] ?? 0) - 0.1;
					} else if (
						pos &&
						typeof pos === "object" &&
						"x" in pos &&
						"y" in pos &&
						"z" in pos
					) {
						x = (pos as Vector3).x ?? 0;
						y = (pos as Vector3).y ?? 0;
						z = ((pos as Vector3).z ?? 0) - 0.1;
					} else if (typeof pos === "number") {
						x = pos;
					}
					return new Vector3(x, y, z);
				})()}
			/>
			<Text ref={ref} {...props} renderOrder={9999}>
				{props.children}
			</Text>
		</>
	);
}
