/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import "@testing-library/jest-dom";

Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
	configurable: true,
	value: () => {},
});
Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
	configurable: true,
	value: () => {},
});
