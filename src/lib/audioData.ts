/*
 *   Copyright (c) 2026 Foxxite | Articca
 *   All rights reserved.
 */

export function buildWaveformPoints(
	audioBuffer: AudioBuffer,
	timeScale: number,
	height: number,
) {
	const channelData = audioBuffer.getChannelData(0); // mono
	// const sampleRate = audioBuffer.sampleRate;
	const durationMs = audioBuffer.duration * 1000;

	const width = Math.floor(durationMs * timeScale);
	const samplesPerPixel = channelData.length / width;

	const points = [];

	for (let x = 0; x < width; x++) {
		const start = Math.floor(x * samplesPerPixel);
		const end = Math.floor(start + samplesPerPixel);

		let min = 1.0;
		let max = -1.0;

		for (let i = start; i < end; i++) {
			const v = channelData[i];
			if (v < min) min = v;
			if (v > max) max = v;
		}

		const yMin = ((1 - max) * height) / 2;
		const yMax = ((1 - min) * height) / 2;

		points.push(x, yMin, x, yMax);
	}

	return { points, width };
}
