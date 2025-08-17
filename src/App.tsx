/** @format */

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Suspense, useEffect } from "react";

import Editor from "@monaco-editor/react";
import Preview from "@/components/Preview";
import { Skeleton } from "@/components/ui/skeleton";
import Wave from "@/components/Wave";
import { useProjectStore } from "@/stores/ProjectStore";

function App() {
	const projectStore = useProjectStore();

	useEffect(() => {
		// Register some keybinds

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "s" && (event.ctrlKey || event.metaKey) && projectStore.cart) {
				event.preventDefault();
				projectStore.saveProject();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [projectStore]);

	return (
		<div className="h-screen w-screen">
			<ResizablePanelGroup direction="vertical" autoSaveId="tca-project" autoSave="true">
				<ResizablePanel>
					<ResizablePanelGroup direction="horizontal" autoSaveId="tca-preview" autoSave="true">
						<ResizablePanel minSize={5} defaultSize={20} className="bg-card flex flex-col gap-4 p-4">
							{projectStore.metadata.projectName}

							<Suspense fallback={<Skeleton className="h-full w-full" />}>
								<Editor
									language="json"
									theme="vs-dark"
									value={JSON.stringify(projectStore.cart, null, 2)}
									options={{
										minimap: { enabled: true },
										scrollbar: { alwaysConsumeMouseWheel: false },
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
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel minSize={5}>
							<Preview />
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel minSize={5} defaultSize={40} className="bg-card p-4">
					Timeline
					<Wave />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

export default App;
