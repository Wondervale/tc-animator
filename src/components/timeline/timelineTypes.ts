/*
 *   Copyright (c) 2026 Foxxite | Articca
 *   All rights reserved.
 */

export type TimelineEase =
	| "linear"
	| "ease"
	| "quad"
	| "cubic"
	| "quart"
	| "quint"
	| "sine"
	| "expo"
	| "circ"
	| "back"
	| "elastic"
	| "bounce";

export type Keyframe = {
	val: number;
	easeStart?: TimelineEase;
	easeEnd?: TimelineEase;
};

export type TimelineRow = {
	title?: string;
	keyframes: Keyframe[];
};

export type TimelineRenderSettings = {
	rowNameWidth: number;
	rowHeight: number;

	timelinePadding: number;
	keyframeRadius: number;

	primaryColor: string;
	textColor: string;
	keyframeColor: string;
	gridColor: string;
};
