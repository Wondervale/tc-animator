/** @format */

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import Preview from "@/components/preview";
import React from "react";

function App() {
	return (
		<div className="h-screen w-screen">
			<ResizablePanelGroup direction="vertical">
				<ResizablePanel>
					<ResizablePanelGroup direction="horizontal">
						<ResizablePanel minSize={5} defaultSize={20} autoSave="tca-project" className="bg-card">
							Project
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
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

export default App;
