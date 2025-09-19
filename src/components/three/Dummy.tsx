/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import Cube from "@/components/three/Cube";
import { degreeToRadian } from "@/lib/utils";
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Group, Mesh, Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const DUMMY_PATH = `${import.meta.env.BASE_URL}models/dummy.glb`;

useGLTF.preload(DUMMY_PATH);

function Dummy({
	scale = 1,
	position = new Vector3(0, 0, 0),
}: {
	scale?: number;
	position?: Vector3;
}) {
	const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/dummy.glb`);
	const dummyModel = useMemo(() => {
		if (!scene) return null;

		const cloned = clone(scene);
		cloned.updateWorldMatrix(true, true);

		// Compute bounding box of the entire model
		const box = new Box3().setFromObject(cloned);
		const center = new Vector3();
		box.getCenter(center);

		const size = new Vector3();
		box.getSize(size);

		// Bottom center: X and Z from center, Y at min
		const bottomCenter = new Vector3(center.x, box.min.y, center.z);

		const pivot = new Group();

		// Shift all meshes so bottom center aligns with origin
		cloned.traverse((child) => {
			if ((child as Mesh).isMesh) {
				(child as Mesh).position.sub(bottomCenter);
			}
		});

		pivot.add(cloned);

		return pivot;
	}, [scene]);

	if (!dummyModel) return <Cube />;

	return (
		<primitive
			object={dummyModel}
			scale={scale}
			position={position}
			castShadow
			receiveShadow
			rotation={[0, degreeToRadian(180), 0]}
		/>
	);
}

export default Dummy;
