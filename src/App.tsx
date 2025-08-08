/** @format */

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import Editor from "@monaco-editor/react";
import Preview from "@/components/Preview";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import Wave from "@/components/Wave";
import { useProjectStore } from "@/stores/ProjectStore";
import { useTrainsStore } from "@/stores/TrainsStore";

function App() {
	const projectStore = useProjectStore();

	const trainsStore = useTrainsStore();

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
									value={JSON.stringify(trainsStore.trains || trainsStore.parseErrors, null, 2)}
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
