/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, FolderOpen, Import } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/ProjectStore";

function ProjectDialog() {
	const projectStore = useProjectStore();

	return (
		<AlertDialog open={!projectStore.cart}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Welcome to TC Animator!</AlertDialogTitle>

					<AlertDialogDescription asChild>
						<div className="flex flex-col items-center gap-4">
							<h3 className="text-lg">
								Please import a SavedTrainProperties YAML file or open an existing project to get
								started.
							</h3>

							<div className="grid grid-cols-2 gap-4">
								<Button className="aspect-square w-full h-auto flex flex-col" variant="outline">
									<Import className="block size-24 mx-auto" />
									Import SavedTrainProperties
								</Button>
								<Button className="aspect-square w-full h-auto flex flex-col" variant="outline">
									<FolderOpen className="block size-24 mx-auto" />
									Load TCAProject
								</Button>
							</div>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="text-sm text-muted-foreground">
					<a
						href="https://foxxite.com"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1">
						Made with ❤️ by Foxxite | Articca
						<ExternalLink className="inline-block size-4" />
					</a>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default ProjectDialog;
