import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useMemo, useState } from "react";

import {
	ColorPickerEyeDropper,
	ColorPickerFormat,
	ColorPickerHue,
	ColorPickerSelection,
	ColorPicker as ShadColorPicker,
} from "@/components/ui/shadcn-io/color-picker";
import type { ColorLike } from "color";
import Color from "color";
import { debounce } from "lodash";

function ColorPicker({
	defaultColor,
	onChangeComplete,
}: {
	defaultColor: string;
	onChangeComplete: (color: string) => void;
}) {
	const [color, setColor] = useState(defaultColor);

	// Memoize the debounced function so it doesn't recreate on every render
	const onColorChange = useMemo(
		() =>
			debounce((newColor: ColorLike) => {
				const hexColor = Color(newColor).hex();
				if (hexColor === color) return;

				setColor(hexColor);
				onChangeComplete(hexColor);
			}, 300),
		[color, onChangeComplete],
	);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="secondary">
					<div
						className="h-full w-full rounded-md"
						style={{ background: color }}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent asChild>
				<ShadColorPicker
					className="rounded-md border w-full"
					defaultValue={color}
					onChange={onColorChange}
				>
					<ColorPickerSelection className="aspect-square" />
					<div className="flex items-center gap-4">
						<ColorPickerHue />
					</div>
					<div className="flex items-baseline gap-2">
						{/* <ColorPickerOutput /> */}
						<ColorPickerEyeDropper />
						<ColorPickerFormat />
					</div>
				</ShadColorPicker>
			</PopoverContent>
		</Popover>
	);
}

export default ColorPicker;
