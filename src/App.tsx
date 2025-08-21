/** @format */

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Suspense, useEffect } from "react";

import AppMenu from "@/components/AppMenu";
import Editor from "@monaco-editor/react";
import Preview from "@/components/Preview";
import { Skeleton } from "@/components/ui/skeleton";
import Wave from "@/components/Wave";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";

function App() {
	const preferences = usePreferences();

	const projectStore = useProjectStore();

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark");

		root.classList.add(preferences.theme);
	}, [preferences.theme]);

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

	useEffect(() => {
		// Warn on unsaved changes
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (projectStore.saved || !projectStore.cart) return;

			event.preventDefault();
			event.returnValue = ""; // Chrome requires this to show the dialog
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [projectStore]);

	useEffect(() => {
		// Auto-save project every 5 minutes
		const interval = setInterval(() => {
			if (!projectStore.saved && projectStore.cart) {
				projectStore.saveProject().catch((error) => {
					console.error("Auto-save failed:", error);
				});
			}
		}, preferences.saveInterval * 1000);
		return () => {
			clearInterval(interval);
		};
	}, [projectStore, preferences.saveInterval]);

	return (
		<div className="h-screen w-screen">
			<ResizablePanelGroup direction="vertical" autoSaveId="tca-project" autoSave="true">
				<ResizablePanel>
					<ResizablePanelGroup direction="horizontal" autoSaveId="tca-preview" autoSave="true">
						<ResizablePanel minSize={5} defaultSize={20} className="bg-card flex flex-col gap-4 p-4">
							<AppMenu />
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
