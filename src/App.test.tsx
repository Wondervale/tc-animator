/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { render, screen } from "@testing-library/react";

import App from "./App";

test("renders the app root", () => {
	render(<App />);
	expect(screen.getByText(/Timeline/i)).toBeInTheDocument();
});
