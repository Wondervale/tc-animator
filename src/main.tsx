/** @format */

import "./index.css";

import App from "./App.tsx";
import CheckBrowserSupport from "./components/CheckBrowserSupport.tsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<CheckBrowserSupport />
		<App />
	</StrictMode>
);
