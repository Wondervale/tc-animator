import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type MeshOutlineProps = {
	selection: THREE.Object3D | null;
	color?: number;
	scaleFactor?: number;
};

export default function MeshOutline({
	selection,
	color = 0xffa500,
	scaleFactor = 1.05,
}: MeshOutlineProps) {
	const { scene } = useThree();
	const meshRef = useRef<THREE.LineSegments | null>(null);

	// Memoize the bounding box size for each object
	const boundingSize = useMemo(() => {
		if (!selection) return new THREE.Vector3(1, 1, 1);

		// Clone the object to ignore rotation/scale
		const clone = selection.clone(true);
		clone.rotation.set(0, 0, 0);
		clone.updateWorldMatrix(true, true);

		const box = new THREE.Box3().setFromObject(clone);
		const size = box
			.getSize(new THREE.Vector3())
			.multiplyScalar(scaleFactor);

		clone.remove();

		return size;
	}, [selection, scaleFactor]);

	useEffect(() => {
		if (!selection) return;

		if (!meshRef.current) {
			const geometry = new THREE.EdgesGeometry(
				new THREE.BoxGeometry(
					boundingSize.x,
					boundingSize.y,
					boundingSize.z,
				),
			);
			const material = new THREE.LineBasicMaterial({ color });
			meshRef.current = new THREE.LineSegments(geometry, material);
			scene.add(meshRef.current);
		}

		return () => {
			if (meshRef.current) {
				scene.remove(meshRef.current);
				meshRef.current.geometry.dispose();
				meshRef.current = null;
			}
		};
	}, [selection, scene, color, boundingSize]);

	useFrame(() => {
		if (!meshRef.current || !selection) return;

		// Compute center in world space
		const center = new THREE.Box3()
			.setFromObject(selection)
			.getCenter(new THREE.Vector3());

		// Update geometry to match memoized size
		meshRef.current.geometry.dispose();
		meshRef.current.geometry = new THREE.EdgesGeometry(
			new THREE.BoxGeometry(
				boundingSize.x,
				boundingSize.y,
				boundingSize.z,
			),
		);

		// Set position and rotation to match selection in world space
		meshRef.current.position.copy(center);
		meshRef.current.quaternion.copy(
			selection.getWorldQuaternion(new THREE.Quaternion()),
		);
	});

	return null;
}
