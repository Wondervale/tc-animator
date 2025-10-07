/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

// import { Input } from "@/components/ui/input";

export default function AngleSlider({
	value = 0,
	onChange,
}: {
	value?: number;
	onChange: (value: number) => void;
}) {
	// Your preset snapping values
	const presets: number[] = [0, 1, 5, 11.25, 15, 22.5, 30, 45];

	const [angle, setAngle] = useState<number>(value || 0);

	// Notify parent of changes
	const setAngleAndNotify = (val: number) => {
		setAngle(val);
		onChange(val);
	};

	// Snap to closest preset
	const snapToPreset = (val: number): number => {
		return presets.reduce((prev, curr) =>
			Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
		);
	};

	return (
		<div className="flex w-sm flex-row items-center gap-2">
			<Label className="flex items-center gap-1 font-semibold whitespace-nowrap">
				Angle Snap:
				<span className="inline-block" style={{ minWidth: "5ch" }}>
					{angle > 0 ? `${angle}°` : "Off"}
				</span>
			</Label>
			<Slider
				min={0}
				max={45}
				step={0.1}
				value={[angle]}
				onValueChange={(val) => {
					const snapped = snapToPreset(val[0]);
					setAngleAndNotify(snapped);
				}}
				className="w-full"
			/>
		</div>
	);
}
