/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { createJSONStorage, persist } from "zustand/middleware";

import Color from "color";
import { create } from "zustand";

interface PreferencesStore {
	theme: "light" | "dark";
	saveInterval: number; // in seconds
	debugText: boolean;
	gridColor: string;
	SSAOEnabled: boolean;
	DOFEnabled: boolean;
	antialiasing: "none" | "FXAA" | "SMAA";
	controlDamping: boolean;

	setTheme: (theme: "light" | "dark") => void;
	setSaveInterval: (interval: number) => void;
	setDebugText: (enabled: boolean) => void;
	setGridColor: (color: string) => void;
	setSSAOEnabled: (enabled: boolean) => void;
	setDOFEnabled: (enabled: boolean) => void;
	setAntialiasing: (mode: "none" | "FXAA" | "SMAA") => void;
	setControlDamping: (enabled: boolean) => void;

	getComplementaryGridColor: () => string;
}

export const usePreferences = create<PreferencesStore>()(
	persist(
		(set, get) => ({
			theme: "dark",
			saveInterval: 300, // 5 minutes
			debugText: false,
			gridColor: "#92a3bb",
			SSAOEnabled: true,
			DOFEnabled: true,
			antialiasing: "SMAA",
			controlDamping: false,

			setTheme: (theme) => set({ theme }),
			setSaveInterval: (interval) => set({ saveInterval: interval }),
			setDebugText: (enabled) => set({ debugText: enabled }),
			setGridColor: (color) => set({ gridColor: color }),
			setSSAOEnabled: (enabled) => set({ SSAOEnabled: enabled }),
			setDOFEnabled: (enabled) => set({ DOFEnabled: enabled }),
			setAntialiasing: (mode) => set({ antialiasing: mode }),
			setControlDamping: (enabled) => set({ controlDamping: enabled }),

			getComplementaryGridColor: () => {
				const color = Color(get().gridColor);
				return color.darken(0.5).hex();
			},
		}),
		{
			version: 0,
			name: "preferences",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
