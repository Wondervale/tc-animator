/** @format */

import "./index.css";

import App from "./App.tsx";
import CheckBrowserSupport from "./components/CheckBrowserSupport.tsx";
import { PostHogProvider } from "posthog-js/react";
import ProjectDialog from "@/components/ProjectDialog.tsx";
import { StrictMode } from "react";
import { Toaster } from "sonner";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<PostHogProvider
			apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
			options={{
				api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
				defaults: "2025-05-24",
				capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
				debug: import.meta.env.MODE === "development",
			}}>
			<CheckBrowserSupport />
			<ProjectDialog />

			<App />

			<Toaster position="top-center" />
		</PostHogProvider>
	</StrictMode>
);
