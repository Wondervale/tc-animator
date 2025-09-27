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
import { Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import DUMMY_PATH from "/src/assets/models/dummy.glb?url";

useGLTF.preload(DUMMY_PATH);

function Dummy({
	scale = 1,
	position = new Vector3(0, 0, 0),
}: {
	scale?: number;
	position?: Vector3;
}) {
	const { scene } = useGLTF(DUMMY_PATH);
	const dummyModel = useMemo(() => {
		if (!scene) return null;

		return clone(scene);
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
