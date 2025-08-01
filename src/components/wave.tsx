/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Input } from "@/components/ui/input";
import type WaveSurfer from "wavesurfer.js";
import WavesurferPlayer from "@wavesurfer/react";
import { useState } from "react";

function Wave() {
	const [audioFile, setAudioFile] = useState<File | null>(null);

	const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const onReady = (ws: WaveSurfer) => {
		setWavesurfer(ws);
		setIsPlaying(false);
	};

	const onPlayPause = () => {
		if (wavesurfer) {
			wavesurfer.playPause();
		}
	};

	return (
		<div>
			<Input
				type="file"
				accept="audio/*"
				onChange={(e) => {
					if (e.target.files && e.target.files.length > 0) {
						const file = e.target.files[0];
						setAudioFile(file);
					}
				}}
			/>

			<WavesurferPlayer
				url={audioFile ? URL.createObjectURL(audioFile) : ""}
				waveColor={"#3a81f6"}
				onReady={onReady}
				onPlay={() => setIsPlaying(true)}
				onPause={() => setIsPlaying(false)}
			/>
			<button onClick={onPlayPause}>{isPlaying ? "Pause" : "Play"}</button>
		</div>
	);
}

export default Wave;
