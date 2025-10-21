/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { createJSONStorage, persist } from "zustand/middleware";

import { makeColorDarker } from "@/lib/utils";
import { create } from "zustand";

interface PreferencesStore {
	theme: "light" | "dark";
	saveInterval: number; // in seconds
	debugText: boolean;
	gridColor: string;
	SSAOEnabled: boolean;
	DOFEnabled: boolean;
	controlDamping: boolean;

	angleSnap: number;
	distanceSnap: number;

	setTheme: (theme: "light" | "dark") => void;
	setSaveInterval: (interval: number) => void;
	setDebugText: (enabled: boolean) => void;
	setGridColor: (color: string) => void;
	setSSAOEnabled: (enabled: boolean) => void;
	setDOFEnabled: (enabled: boolean) => void;
	setControlDamping: (enabled: boolean) => void;

	setAngleSnap: (angle: number) => void;
	setDistanceSnap: (distance: number) => void;

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
			controlDamping: false,

			angleSnap: 11.25,
			distanceSnap: 1 / 16,

			setTheme: (theme) => set({ theme }),
			setSaveInterval: (interval) => set({ saveInterval: interval }),
			setDebugText: (enabled) => set({ debugText: enabled }),
			setGridColor: (color) => set({ gridColor: color }),
			setSSAOEnabled: (enabled) => set({ SSAOEnabled: enabled }),
			setDOFEnabled: (enabled) => set({ DOFEnabled: enabled }),
			setControlDamping: (enabled) => set({ controlDamping: enabled }),

			setAngleSnap: (angle) => set({ angleSnap: angle }),
			setDistanceSnap: (distance) => set({ distanceSnap: distance }),

			getComplementaryGridColor: () => {
				return makeColorDarker(get().gridColor, 0.5);
			},
		}),
		{
			version: 0,
			name: "preferences",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
