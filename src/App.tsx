/** @format */

import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";

import { rows } from "@/components/timeline/timelineTestData";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

const AppMenu = lazy(() => import("@/components/AppMenu"));
const FallbackRender = lazy(() => import("@/components/error/FallbackRender"));
const PropertiesPanels = lazy(
	() => import("@/components/properties/PropertiesPanels"),
);
const Preview = lazy(() => import("@/components/three/Preview"));
const CanvasTimeline = lazy(
	() => import("@/components/timeline/CanvasTimeline"),
);

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
							<Suspense
								fallback={<Skeleton className="h-12 w-full" />}
							>
								<AppMenu />
							</Suspense>

							<Suspense
								fallback={<Skeleton className="h-64 w-full" />}
							>
								<PropertiesPanels />
							</Suspense>
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel minSize={5} defaultSize={75}>
							<ErrorBoundary
								FallbackComponent={FallbackRender}
								//   onReset={(details) => {
								//     // Reset the state of your app so the error doesn't happen again
								//   }}
							>
								<Suspense
									fallback={
										<Skeleton className="h-full w-full" />
									}
								>
									<Preview />
								</Suspense>
							</ErrorBoundary>
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel minSize={5} defaultSize={20}>
					<ErrorBoundary
						FallbackComponent={FallbackRender}
						//   onReset={(details) => {
						//     // Reset the state of your app so the error doesn't happen again
						//   }}
					>
						<Suspense
							fallback={<Skeleton className="h-24 w-full" />}
						>
							<CanvasTimeline rows={rows} />
						</Suspense>
					</ErrorBoundary>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

export default App;
