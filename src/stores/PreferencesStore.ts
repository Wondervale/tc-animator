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
	FXAAEnabled: boolean;

	setTheme: (theme: "light" | "dark") => void;
	setSaveInterval: (interval: number) => void;
	setDebugText: (enabled: boolean) => void;
	setGridColor: (color: string) => void;
	setSSAOEnabled: (enabled: boolean) => void;
	setFXAAEnabled: (enabled: boolean) => void;

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
			FXAAEnabled: true,

			setTheme: (theme) => set({ theme }),
			setSaveInterval: (interval) => set({ saveInterval: interval }),
			setDebugText: (enabled) => set({ debugText: enabled }),
			setGridColor: (color) => set({ gridColor: color }),
			setSSAOEnabled: (enabled) => set({ SSAOEnabled: enabled }),
			setFXAAEnabled: (enabled) => set({ FXAAEnabled: enabled }),

			getComplementaryGridColor: () => {
				const color = Color(get().gridColor);
				return color.darken(0.5).hex();
			},
		}),
		{
			version: 0,
			name: "preferences",
			storage: createJSONStorage(() => localStorage),
		}
	)
);
