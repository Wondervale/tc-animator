import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MeshOutline({
	selection,
	color = 0xffa500,
	scaleFactor = 1.05,
}: {
	selection: THREE.Object3D | null;
	color?: number;
	scaleFactor?: number;
}) {
	const { scene } = useThree();
	const meshRef = useRef<THREE.LineSegments>(null);
	const box = useRef(new THREE.Box3());
	const size = useRef(new THREE.Vector3());
	const center = useRef(new THREE.Vector3());

	// Geometry for a unit cube wireframe
	const geometry = useRef(
		new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
	);
	const material = useRef(new THREE.LineBasicMaterial({ color }));

	useEffect(() => {
		if (!selection) return;

		if (!meshRef.current) {
			const lines = new THREE.LineSegments(
				geometry.current,
				material.current,
			);
			meshRef.current = lines;
			scene.add(meshRef.current);
		}

		return () => {
			if (meshRef.current) {
				scene.remove(meshRef.current);
				meshRef.current = null;
			}
		};
	}, [selection, scene]);

	useFrame(() => {
		if (!meshRef.current || !selection) return;

		// Compute bounding box in world space
		box.current.setFromObject(selection);
		box.current.getSize(size.current);
		box.current.getCenter(center.current);

		// Slightly enlarge box
		size.current.multiplyScalar(scaleFactor);

		// Apply position, rotation, and scale
		meshRef.current.position.copy(center.current);
		meshRef.current.quaternion.copy(
			selection.getWorldQuaternion(new THREE.Quaternion()),
		);
		meshRef.current.scale.set(
			size.current.x,
			size.current.y,
			size.current.z,
		);
	});

	return null;
}
