/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { type Guideline } from "@/schemas/GuidelineSchema";
import { create } from "zustand";

interface GuidelineStore {
	guidelines: Guideline[];

	addGuideline: (guideline: Guideline) => void;
	removeGuideline: (index: number) => void;
	updateGuideline: (
		index: number,
		updatedGuideline: Partial<Guideline>,
	) => void;
}

const useGuidelineStore = create<GuidelineStore>((set) => ({
	guidelines: [],

	addGuideline: (guideline: Guideline) =>
		set((state: GuidelineStore) => ({
			guidelines: [...state.guidelines, guideline],
		})),

	removeGuideline: (index: number) =>
		set((state: GuidelineStore) => ({
			guidelines: state.guidelines.filter(
				(_: Guideline, i: number) => i !== index,
			),
		})),

	updateGuideline: (index: number, updatedGuideline: Partial<Guideline>) =>
		set((state: GuidelineStore) => ({
			guidelines: state.guidelines.map(
				(guideline: Guideline, i: number) =>
					i === index
						? { ...guideline, ...updatedGuideline }
						: guideline,
			),
		})),
}));

export { useGuidelineStore };
