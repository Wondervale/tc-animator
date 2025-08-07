/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import type { Cart } from "@/schemas/SavedTrainPropertiesSchema";
import { create } from "zustand";

interface ProjectStore {
	projectName: string;

	cart: Cart | null;

	setProjectName: (name: string) => void;
	setCart: (cart: Cart | null) => void;
	clearCart: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
	projectName: "",
	cart: null,

	setProjectName: (name) => set({ projectName: name }),
	setCart: (cart) => set({ cart }),
	clearCart: () => set({ cart: null }),
}));
