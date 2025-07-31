/** @format */

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import Editor from "@monaco-editor/react";
import { Input } from "@/components/ui/input";
import Preview from "@/components/preview";
import React from "react";
import Wave from "@/components/wave";
import { parse } from "yaml";

function App() {
	const [ymlString, setYmlString] = React.useState<string>("");
	const [ymlData, setYmlData] = React.useState<unknown>(null);

	return (
		<div className="h-screen w-screen">
			<ResizablePanelGroup direction="vertical">
				<ResizablePanel>
					<ResizablePanelGroup direction="horizontal">
						<ResizablePanel
							minSize={5}
							defaultSize={20}
							autoSave="tca-project"
							className="bg-card flex flex-col gap-4">
							Project
							<Input
								type="file"
								className="file-input file-input-bordered w-full max-w-xs"
								accept="*.yml, *.yaml"
								onChange={(e) => {
									if (e.target.files && e.target.files.length > 0) {
										const file = e.target.files[0];
										const reader = new FileReader();
										reader.onload = (event) => {
											if (event.target?.result) {
												setYmlString(event.target.result as string);
												try {
													const data = parse(event.target.result as string);
													setYmlData(data);
												} catch (error) {
													console.error("Error parsing YAML:", error);
												}
											}
										};
										reader.readAsText(file);
									}
								}}
							/>
							<Editor value={ymlString} language="yaml" theme="vs-dark" />
							<hr className="my-2" />
							<Editor language="json" theme="vs-dark" value={JSON.stringify(ymlData, null, 2)} />
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel minSize={5}>
							<Preview />
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel minSize={5} defaultSize={40} autoSave="tca-timeline" className="bg-card">
					Timeline

					<Wave />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

export default App;
