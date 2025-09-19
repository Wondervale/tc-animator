/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense, lazy } from "react";

import ModelControl from "@/components/properties/ModelControl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectStore } from "@/stores/ProjectStore";

const Editor = lazy(() => import("@monaco-editor/react"));

function PropertiesPanels() {
	const projectStore = useProjectStore();

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

			<TabsContent value="object-controls" className="px-4">
				W.I.P.
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
						value={JSON.stringify(
							{ ...projectStore, cart: undefined },
							null,
							2,
						)}
						options={{
							minimap: { enabled: true },
							scrollbar: {
								alwaysConsumeMouseWheel: false,
							},
							wordWrap: "on",
							automaticLayout: true,
						}}
					/>
				</Suspense>
			</TabsContent>
		</Tabs>
	);
}

export default PropertiesPanels;
