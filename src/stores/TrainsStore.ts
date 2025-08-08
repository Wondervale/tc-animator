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
import { toast } from "sonner";

interface TrainStore {
	trains: SavedTrainProperties;
	currentTrain?: SavedTrain;

	parseErrors?: string[];

	setTrains: (trains: SavedTrainProperties) => void;
	setTrainsFromYml: (ymlString: string) => void;

	setCurrentTrain: (train: SavedTrain) => void;
	clearCurrentTrain: () => void;

	reset: () => void;
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
				toast.error(
					"We couldn't load your trains. Please check that you uploaded the SavedTrainProperties YAML file from TrainCarts. See the browser console for more details.",
					{
						duration: 10000,
					}
				);

				set({ trains: {}, parseErrors: valid.errors });
			}
		} catch (error) {
			console.error("Error parsing YAML:", error);
			toast.error(
				"We couldn't read your file. Please make sure it's a valid YAML and try again. See the browser console for more details.",
				{
					duration: 10000,
				}
			);

			set({ trains: {}, parseErrors: ["Failed to parse YAML.", String(error)] });
			return;
		}
	},

	setTrains: (trains) => set({ trains }),
	setCurrentTrain: (train) => set({ currentTrain: train }),
	clearCurrentTrain: () => set({ currentTrain: undefined }),

	reset: () =>
		set({
			trains: {},
			currentTrain: undefined,
			parseErrors: undefined,
		}),
}));
