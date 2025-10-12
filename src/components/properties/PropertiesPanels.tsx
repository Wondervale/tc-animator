/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense, lazy, useMemo } from "react";

import ModelControl from "@/components/properties/ModelControl";
import ObjectControls from "@/components/properties/ObjectControls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectStore } from "@/stores/ProjectStore";

const Editor = lazy(() => import("@monaco-editor/react"));

function PropertiesPanels() {
	const projectStore = useProjectStore();

	const reducedProjectData = useMemo(() => {
		const rest = {
			...projectStore,
			cart: undefined,
			modelFiles: undefined,
			fileHandle: undefined,
		};

		return rest;
	}, [projectStore]);

	return (
		<Tabs defaultValue="object-controls" className="-mt-4 h-full w-full">
			<TabsList className="w-full rounded-none">
				<TabsTrigger value="object-controls">
					Object Controls
				</TabsTrigger>
				<TabsTrigger value="custom-models">Custom Models</TabsTrigger>
				<TabsTrigger value="cart-debug">Cart Debug</TabsTrigger>
				<TabsTrigger value="project-debug">Project Debug</TabsTrigger>
			</TabsList>

			<TabsContent value="object-controls">
				<ObjectControls />
			</TabsContent>

			<TabsContent value="custom-models" className="px-4">
				<ModelControl />
			</TabsContent>

			<TabsContent value="cart-debug">
				<Suspense fallback={<Skeleton className="h-full w-full" />}>
					<Editor
						language="json"
						theme="vs-dark"
						value={JSON.stringify(projectStore.cart, null, 2)}
						options={{
							minimap: { enabled: true },
							scrollbar: {
								alwaysConsumeMouseWheel: false,
							},
							wordWrap: "on",
							automaticLayout: true,
						}}
						onChange={(value) => {
							if (value) {
								try {
									const parsed = JSON.parse(value);
									projectStore.setCart(parsed);
								} catch (e) {
									console.error("Failed to parse JSON:", e);
								}
							}
						}}
					/>
				</Suspense>
			</TabsContent>

			<TabsContent value="project-debug">
				<Suspense fallback={<Skeleton className="h-full w-full" />}>
					<Button
						className="mb-2 block w-full"
						onClick={() => projectStore.logState()}
					>
						Log State to Console
					</Button>

					<Editor
						language="json"
						theme="vs-dark"
						value={JSON.stringify(reducedProjectData, null, 2)}
						options={{
							minimap: { enabled: false }, // Disable minimap for perf
							scrollbar: {
								alwaysConsumeMouseWheel: false,
							},
							wordWrap: "off", // Disable word wrap for perf
							automaticLayout: true,
							readOnly: true, // Make editor read-only for debug
						}}
					/>
				</Suspense>
			</TabsContent>
		</Tabs>
	);
}

export default PropertiesPanels;
