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
	id?: string;
	val: number;
	easeStart?: TimelineEase;
	easeEnd?: TimelineEase;
};

export type TimelineRow = {
	id?: string;
	title?: string;
	isAudio?: boolean;
	keyframes: Keyframe[];
};

export type TimelineRenderSettings = {
	rowNameWidth: number;
	rowHeight: number;

	timelinePadding: number;
	keyframeRadius: number;

	backgroundColor: string;
	primaryColor: string;
	textColor: string;
	keyframeColor: string;
	keyframeSelectedColor: string;
	keyframeHighlightedColor: string;
	gridColor: string;
};
