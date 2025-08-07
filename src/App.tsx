/** @format */

import React, { Suspense } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import Preview from "@/components/Preview";
import { Skeleton } from "@/components/ui/skeleton";
import Wave from "@/components/Wave";
import { fileOpen } from "browser-fs-access";
import { useTrainsStore } from "@/stores/TrainsStore";

function App() {
	const [ymlString, setYmlString] = React.useState<string>("");

	const trainsStore = useTrainsStore();

	return (
		<div className="h-screen w-screen">
			<ResizablePanelGroup direction="vertical" autoSaveId="tca-project" autoSave="true">
				<ResizablePanel>
					<ResizablePanelGroup direction="horizontal" autoSaveId="tca-preview" autoSave="true">
						<ResizablePanel minSize={5} defaultSize={20} className="bg-card flex flex-col gap-4 p-4">
							Project
							<Button
								variant="outline"
								className="w-full"
								onClick={async () => {
									const fileHandle = await fileOpen({
										description: "Select a YAML file",
										mimeTypes: ["application/x-yaml", "text/yaml"],
										extensions: [".yaml", ".yml"],
									});

									if (fileHandle) {
										const text = await fileHandle.text();
										trainsStore.setTrainsFromYml(text);
										setYmlString(text);
									}
								}}>
								Load SavedTrainProperties
							</Button>
							<Suspense fallback={<Skeleton className="h-full w-full" />}>
								<Editor value={ymlString} language="yaml" theme="vs-dark" />
							</Suspense>
							<hr className="my-2" />
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
