/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Input } from "@/components/ui/input";
import WavesurferPlayer from "@wavesurfer/react";
import { useState } from "react";

function Wave() {
	const [audioFile, setAudioFile] = useState<File | null>(null);

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

			<WavesurferPlayer url={audioFile ? URL.createObjectURL(audioFile) : ""} waveColor={"#3a81f6"} />
		</div>
	);
}

export default Wave;
