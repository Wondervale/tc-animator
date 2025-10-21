/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import GuidelineControls from "@/components/properties/GuidelineControls";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";

// import { useProjectStore } from "@/stores/ProjectStore";

function ObjectControls() {
	// const projectStore = useProjectStore();

	return (
		<ResizablePanelGroup
			direction="vertical"
			autoSaveId="tca-object-controls"
			autoSave="true"
		>
			<ResizablePanel className="px-4 pb-2">
				<div className="h-full w-full overflow-auto">
					<h2 className="text-lg font-medium">
						Object Controls (to be implemented)
					</h2>
				</div>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel className="px-4 py-2">
				<GuidelineControls />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

export default ObjectControls;
