/** @format */

import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";

import AppMenu from "@/components/AppMenu";
import PropertiesPanels from "@/components/properties/PropertiesPanels";
import Preview from "@/components/three/Preview";
import Timeline from "@/components/timeline/Timeline";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";
import { useEffect } from "react";

function App() {
	const preferences = usePreferences();

	const projectStore = useProjectStore();

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark");

		root.classList.add(preferences.theme);
	}, [preferences.theme]);

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
			<ResizablePanelGroup
				direction="vertical"
				autoSaveId="tca-project"
				autoSave="true"
			>
				<ResizablePanel minSize={5} defaultSize={80}>
					<ResizablePanelGroup
						direction="horizontal"
						autoSaveId="tca-preview"
						autoSave="true"
					>
						<ResizablePanel
							minSize={5}
							defaultSize={25}
							className="bg-card flex flex-col gap-4"
						>
							<AppMenu />

							<PropertiesPanels />
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel minSize={5} defaultSize={75}>
							<Preview />
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel
					minSize={5}
					defaultSize={20}
					className="bg-card p-4"
				>
					<Timeline />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

export default App;
