/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { floatAsFraction } from "@/lib/utils";
import { useState } from "react";

// import { Input } from "@/components/ui/input";

export default function DistanceSlider({
	value = 0,
	onChange,
}: {
	value?: number;
	onChange: (value: number) => void;
}) {
	// Your preset snapping values
	const presets: number[] = [0, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1];

	const [distance, setAngle] = useState<number>(value || 0);

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
				Distance Snap:
				<span className="inline-block" style={{ minWidth: "5ch" }}>
					{distance > 0 ? `${floatAsFraction(distance)}` : "Off"}
				</span>
			</Label>
			<Slider
				min={0}
				max={1}
				step={0.01}
				value={[distance]}
				onValueChange={(val) => {
					const snapped = snapToPreset(val[0]);
					setAngleAndNotify(snapped);
				}}
				className="w-full"
			/>
		</div>
	);
}
