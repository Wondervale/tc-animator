/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { useGLTF } from "@react-three/drei";

function Dummy({ scale = 0.01, position = [0, 0, 0] }: { scale?: number; position?: [number, number, number] }) {
	const dummyModel = useGLTF(`${import.meta.env.BASE_URL}models/dummy.glb`);

	return (
		<primitive
			object={dummyModel.scene}
			scale={scale}
			position={position}
			castShadow
			receiveShadow
			dispose={null}
		/>
	);
}

export default Dummy;
