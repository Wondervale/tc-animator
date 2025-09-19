/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { degreeToRadian } from "@/lib/utils";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

import { Text, type TextProps } from "@react-three/drei";
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
		<Text ref={ref} {...props}>
			{props.children}
		</Text>
	);
}
