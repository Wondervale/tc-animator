/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { type ColorResult, type RGBColor, SketchPicker } from "react-color";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { debounce } from "@tanstack/react-pacer";

const defaultRGBColor: RGBColor = { r: 146, g: 163, b: 187, a: 1 };

interface ColorPickerProps {
	defaultColor?: RGBColor | string;
	onChangeComplete: (color: ColorResult) => void;
}

const stringToRGB = (color: string): RGBColor => {
	if (typeof color === "string") {
		const match = color.match(/^#([0-9a-f]{3,8})$/i);
		if (match) {
			const hex = match[1];
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			const a = hex.length > 6 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
			return { r, g, b, a };
		}
	}
	return defaultRGBColor;
};

const ColorPicker: React.FC<ColorPickerProps> = ({ defaultColor = defaultRGBColor, onChangeComplete }) => {
	const [displayColorPicker, setDisplayColorPicker] = useState(false);
	const [color, setColor] = useState<RGBColor>(
		typeof defaultColor === "string" ? stringToRGB(defaultColor) : defaultColor
	);

	const debouncedResult = debounce((colorResult: ColorResult) => onChangeComplete(colorResult), {
		wait: 500, // Wait 500ms after last keystroke
	});

	const handleClick = () => setDisplayColorPicker((prev) => !prev);
	const handleClose = () => setDisplayColorPicker(false);
	const handleChange = (colorResult: ColorResult) => {
		setColor(colorResult.rgb);

		debouncedResult(colorResult);
	};

	const colorStyle: React.CSSProperties = {
		width: "100%",
		height: "100%",
		background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
		borderRadius: "1px",
		border: "1px solid #ccc",
	};

	const popoverStyle: React.CSSProperties = {
		position: "absolute",
		zIndex: 2,
		left: "50%",
		transform: "translateX(-50%)",
	};

	const coverStyle: React.CSSProperties = {
		position: "fixed",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	};

	// Close if clicked outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (displayColorPicker && !(event.target as HTMLElement).closest(".color-picker")) {
				handleClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [displayColorPicker]);

	return (
		<div>
			<Button onClick={handleClick} variant="secondary" className="w-full">
				<div style={colorStyle} />
			</Button>
			{displayColorPicker && (
				<div style={popoverStyle} className="color-picker">
					<div style={coverStyle} onClick={handleClose} />
					<SketchPicker
						color={color}
						onChange={handleChange}
						presetColors={[
							"#92A3BB",
							"#B80000",
							"#DB3E00",
							"#FCCB00",
							"#008B02",
							"#006B76",
							"#1273DE",
							"#004DCF",
							"#5300EB",
							"#EB9694",
							"#FAD0C3",
							"#FEF3BD",
							"#C1E1C5",
							"#BEDADC",
							"#C4DEF6",
							"#BED3F3",
							"#D4C4FB",
						]}
						disableAlpha
					/>
				</div>
			)}
		</div>
	);
};

export default ColorPicker;
