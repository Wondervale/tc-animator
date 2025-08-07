/** @format */

import "./index.css";

import App from "./App.tsx";
import CheckBrowserSupport from "./components/CheckBrowserSupport.tsx";
import ProjectDialog from "@/components/ProjectDialog.tsx";
import { StrictMode } from "react";
import { Toaster } from "sonner";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<CheckBrowserSupport />
		<ProjectDialog />

		<App />

		<Toaster position="top-center" />
	</StrictMode>
);
