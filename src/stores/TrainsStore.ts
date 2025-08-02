/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import {
	validateSavedTrainProperties,
	type SavedTrain,
	type SavedTrainProperties,
} from "@/schemas/SavedTrainPropertiesSchema";

import { create } from "zustand";
import { parse } from "yaml";

interface TrainStore {
	trains: SavedTrainProperties;
	currentTrain?: SavedTrain;

	parseErrors?: string[];

	setTrains: (trains: SavedTrainProperties) => void;
	setTrainsFromYml: (ymlString: string) => void;

	setCurrentTrain: (train: SavedTrain) => void;
	clearCurrentTrain: () => void;
}

export const useTrainsStore = create<TrainStore>((set) => ({
	trains: {},
	currentTrain: undefined,

	setTrainsFromYml: (ymlString) => {
		try {
			const data = parse(ymlString);
			const valid = validateSavedTrainProperties(data);

			if (valid.valid) {
				set({ trains: data as SavedTrainProperties });
			} else {
				console.error("Invalid YAML data:", valid.errors);

				set({ trains: {}, parseErrors: valid.errors });
			}
		} catch (error) {
			console.error("Error parsing YAML:", error);
			set({ trains: {}, parseErrors: ["Failed to parse YAML.", String(error)] });
			return;
		}
	},

	setTrains: (trains) => set({ trains }),
	setCurrentTrain: (train) => set({ currentTrain: train }),
	clearCurrentTrain: () => set({ currentTrain: undefined }),
}));
