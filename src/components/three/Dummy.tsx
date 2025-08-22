/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { degreeToRadian } from "@/lib/utils";
import { useGLTF } from "@react-three/drei";

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
	const dummyModel = clone(scene);

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
