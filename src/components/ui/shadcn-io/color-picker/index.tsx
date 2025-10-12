"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Color from "color";
import { PipetteIcon } from "lucide-react";
import { Slider } from "radix-ui";
import {
	type ComponentProps,
	createContext,
	type HTMLAttributes,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

interface ColorPickerContextValue {
	hue: number;
	saturation: number;
	lightness: number;
	alpha: number;
	mode: string;
	setHue: (hue: number) => void;
	setSaturation: (saturation: number) => void;
	setLightness: (lightness: number) => void;
	setAlpha: (alpha: number) => void;
	setMode: (mode: string) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
	undefined,
);

export const useColorPicker = () => {
	const context = useContext(ColorPickerContext);

	if (!context) {
		throw new Error(
			"useColorPicker must be used within a ColorPickerProvider",
		);
	}

	return context;
};

export type ColorPickerProps = HTMLAttributes<HTMLDivElement> & {
	value?: Parameters<typeof Color>[0];
	defaultValue?: Parameters<typeof Color>[0];
	onChange?: (value: Parameters<typeof Color.rgb>[0]) => void;
};

export const ColorPicker = ({
	value,
	defaultValue = "#000000",
	onChange,
	className,
	...props
}: ColorPickerProps) => {
	const selectedColor = Color(value);
	const defaultColor = Color(defaultValue);

	const [hue, setHue] = useState(
		selectedColor.hue() || defaultColor.hue() || 0,
	);
	const [saturation, setSaturation] = useState(
		selectedColor.saturationl() || defaultColor.saturationl() || 100,
	);
	const [lightness, setLightness] = useState(
		selectedColor.lightness() || defaultColor.lightness() || 50,
	);
	const [alpha, setAlpha] = useState(
		selectedColor.alpha() * 100 || defaultColor.alpha() * 100,
	);
	const [mode, setMode] = useState("hex");

	// Update color when controlled value changes
	useEffect(() => {
		if (value) {
			const color = Color.rgb(value).rgb().object();

			setHue(color.r);
			setSaturation(color.g);
			setLightness(color.b);
			setAlpha(color.a);
		}
	}, [value]);

	// Notify parent of changes
	useEffect(() => {
		if (onChange) {
			const color = Color.hsl(hue, saturation, lightness).alpha(
				alpha / 100,
			);
			const rgba = color.rgb().array();

			onChange([rgba[0], rgba[1], rgba[2], alpha / 100]);
		}
	}, [hue, saturation, lightness, alpha, onChange]);

	return (
		<ColorPickerContext.Provider
			value={{
				hue,
				saturation,
				lightness,
				alpha,
				mode,
				setHue,
				setSaturation,
				setLightness,
				setAlpha,
				setMode,
			}}
		>
			<div
				className={cn("flex size-full flex-col gap-4", className)}
				{...props}
			/>
		</ColorPickerContext.Provider>
	);
};

export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerSelection = memo(
	({ className, ...props }: ColorPickerSelectionProps) => {
		const containerRef = useRef<HTMLDivElement>(null);

		const { hue, saturation, lightness, setSaturation, setLightness } =
			useColorPicker();

		const [isDragging, setIsDragging] = useState(false);
		const [positionX, setPositionX] = useState(0);
		const [positionY, setPositionY] = useState(0);

		const backgroundGradient = useMemo(() => {
			return `linear-gradient(0deg, oklch(0 0 0), oklch(0 0 0 / 0%)),
			linear-gradient(90deg, oklch(1 0 0), oklch(1 0 0 / 0%)),
			hsl(${hue}, 100%, 50%)`;
		}, [hue]);

		// Update positionX/Y when saturation/lightness change
		useEffect(() => {
			// Map saturation (0-100) to X (0-1)
			const x = saturation / 100;

			// Map lightness (0-100) to Y (0-1) using the same formula as your click handler
			const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
			const y = 1 - lightness / topLightness;

			setPositionX(x);
			setPositionY(y);
		}, [saturation, lightness]);

		const updateColorFromPointer = useCallback(
			(
				event:
					| PointerEvent
					| React.PointerEvent
					| MouseEvent
					| React.MouseEvent,
			) => {
				if (!containerRef.current) return;
				const rect = containerRef.current.getBoundingClientRect();
				const x = Math.max(
					0,
					Math.min(1, (event.clientX - rect.left) / rect.width),
				);
				const y = Math.max(
					0,
					Math.min(1, (event.clientY - rect.top) / rect.height),
				);

				setPositionX(x);
				setPositionY(y);
				setSaturation(x * 100);

				const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
				const lightness = topLightness * (1 - y);
				setLightness(lightness);
			},
			[setSaturation, setLightness],
		);

		const handlePointerMove = useCallback(
			(event: PointerEvent) => {
				if (isDragging) {
					updateColorFromPointer(event);
				}
			},
			[isDragging, updateColorFromPointer],
		);

		useEffect(() => {
			const handlePointerUp = () => setIsDragging(false);

			if (isDragging) {
				window.addEventListener("pointermove", handlePointerMove);
				window.addEventListener("pointerup", handlePointerUp);
			}

			return () => {
				window.removeEventListener("pointermove", handlePointerMove);
				window.removeEventListener("pointerup", handlePointerUp);
			};
		}, [isDragging, handlePointerMove]);

		return (
			<div
				className={cn(
					"relative size-full cursor-crosshair rounded",
					className,
				)}
				onPointerDown={(e) => {
					e.preventDefault();
					setIsDragging(true);
					updateColorFromPointer(e);
				}}
				onClick={(e) => {
					// Also update on click (not just drag)
					updateColorFromPointer(e);
				}}
				ref={containerRef}
				style={{
					background: backgroundGradient,
				}}
				{...props}
			>
				<div
					className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
					style={{
						left: `${positionX * 100}%`,
						top: `${positionY * 100}%`,
						boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
					}}
				/>
			</div>
		);
	},
);

ColorPickerSelection.displayName = "ColorPickerSelection";

export type ColorPickerHueProps = ComponentProps<typeof Slider.Root>;

export const ColorPickerHue = ({
	className,
	...props
}: ColorPickerHueProps) => {
	const { hue, setHue } = useColorPicker();

	return (
		<Slider.Root
			className={cn("relative flex h-4 w-full touch-none", className)}
			max={360}
			onValueChange={([hue]) => setHue(hue)}
			step={1}
			value={[hue]}
			{...props}
		>
			<Slider.Track className="relative my-0.5 h-3 w-full grow rounded-full bg-[linear-gradient(90deg,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)]">
				<Slider.Range className="absolute h-full" />
			</Slider.Track>
			<Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
		</Slider.Root>
	);
};

export type ColorPickerAlphaProps = ComponentProps<typeof Slider.Root>;

export const ColorPickerAlpha = ({
	className,
	...props
}: ColorPickerAlphaProps) => {
	const { alpha, setAlpha } = useColorPicker();

	return (
		<Slider.Root
			className={cn("relative flex h-4 w-full touch-none", className)}
			max={100}
			onValueChange={([alpha]) => setAlpha(alpha)}
			step={1}
			value={[alpha]}
			{...props}
		>
			<Slider.Track
				className="relative my-0.5 h-3 w-full grow rounded-full"
				style={{
					backgroundImage:
						'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==") left center',
				}}
			>
				<div className="absolute inset-0 rounded-full bg-gradient-to-r from-black to-white" />
				<Slider.Range className="absolute h-full rounded-full bg-transparent" />
			</Slider.Track>
			<Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
		</Slider.Root>
	);
};

export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>;

export const ColorPickerEyeDropper = ({
	className,
	...props
}: ColorPickerEyeDropperProps) => {
	const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker();

	const handleEyeDropper = async () => {
		try {
			// @ts-expect-error - EyeDropper API is experimental
			const eyeDropper = new EyeDropper();
			const result = await eyeDropper.open();
			const color = Color(result.sRGBHex);
			const [h, s, l] = color.hsl().array();

			setHue(h);
			setSaturation(s);
			setLightness(l);
			setAlpha(100);
		} catch (error) {
			console.error("EyeDropper failed:", error);
		}
	};

	return (
		<Button
			className={cn("shrink-0 text-muted-foreground", className)}
			onClick={handleEyeDropper}
			size="icon"
			variant="outline"
			type="button"
			{...props}
		>
			<PipetteIcon size={16} />
		</Button>
	);
};

export type ColorPickerOutputProps = ComponentProps<typeof SelectTrigger>;

const formats = ["hex", "rgb", "css", "hsl"];

export const ColorPickerOutput = ({
	className,
	...props
}: ColorPickerOutputProps) => {
	const { mode, setMode } = useColorPicker();

	return (
		<Select onValueChange={setMode} value={mode}>
			<SelectTrigger className="h-8 w-20 shrink-0 text-xs" {...props}>
				<SelectValue placeholder="Mode" />
			</SelectTrigger>
			<SelectContent>
				{formats.map((format) => (
					<SelectItem className="text-xs" key={format} value={format}>
						{format.toUpperCase()}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

type PercentageInputProps = ComponentProps<typeof Input>;

const PercentageInput = ({ className, ...props }: PercentageInputProps) => {
	return (
		<div className="relative">
			<Input
				readOnly
				type="text"
				{...props}
				className={cn(
					"h-8 w-[3.25rem] rounded-l-none bg-secondary px-2 text-xs shadow-none",
					className,
				)}
			/>
			<span className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground text-xs">
				%
			</span>
		</div>
	);
};

export type ColorPickerFormatProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerFormat = ({
	className,
	...props
}: ColorPickerFormatProps) => {
	const {
		hue,
		saturation,
		lightness,
		alpha,
		mode,
		setHue,
		setSaturation,
		setLightness,
	} = useColorPicker();
	const color = Color.hsl(hue, saturation, lightness, alpha / 100);

	// Local state for hex input
	const [hexInput, setHexInput] = useState(color.hex());

	useEffect(() => {
		if (mode === "hex") {
			setHexInput(color.hex());
		}
	}, [color, mode]);

	const handleHexChange = (value: string) => {
		setHexInput(value);

		try {
			// Only update color if hex is valid
			const newColor = Color(value);
			const hsl = newColor.hsl();
			setHue(hsl.hue());
			setSaturation(hsl.saturationl());
			setLightness(hsl.lightness());
		} catch {
			// Invalid hex, do nothing for now
		}
	};

	const handleValueChange = (index: number, value: number) => {
		switch (mode) {
			case "rgb": {
				const rgb = color.rgb().array();
				rgb[index] = value;
				const newColor = Color.rgb(rgb).hsl();
				setHue(newColor.hue());
				setSaturation(newColor.saturationl());
				setLightness(newColor.lightness());
				break;
			}
			case "hsl": {
				const hsl = color.hsl().array();
				hsl[index] = value;
				setHue(hsl[0]);
				setSaturation(hsl[1]);
				setLightness(hsl[2]);
				break;
			}
		}
	};

	const renderInputs = (values: number[]) =>
		values.map((value, index) => (
			<Input
				key={index}
				className={cn(
					"h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none",
					index && "rounded-l-none",
					className,
				)}
				type="number"
				value={value}
				onChange={(e) =>
					handleValueChange(index, Number(e.target.value))
				}
			/>
		));

	if (mode === "hex") {
		return (
			<div
				className={cn(
					"-space-x-px relative flex w-full items-center rounded-md shadow-sm",
					className,
				)}
				{...props}
			>
				<Input
					className="h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none"
					type="text"
					value={hexInput}
					onChange={(e) => handleHexChange(e.target.value)}
				/>
				{/* <PercentageInput value={alpha} /> */}
			</div>
		);
	}

	if (mode === "rgb") {
		const rgb = color
			.rgb()
			.array()
			.map((v) => Math.round(v));
		return (
			<div
				className={cn(
					"-space-x-px flex items-center rounded-md shadow-sm",
					className,
				)}
				{...props}
			>
				{renderInputs(rgb)}
				{/* <PercentageInput value={alpha} /> */}
			</div>
		);
	}

	if (mode === "hsl") {
		const hsl = color
			.hsl()
			.array()
			.map((v) => Math.round(v));
		return (
			<div
				className={cn(
					"-space-x-px flex items-center rounded-md shadow-sm",
					className,
				)}
				{...props}
			>
				{renderInputs(hsl)}
				{/* <PercentageInput value={alpha} /> */}
			</div>
		);
	}

	if (mode === "css") {
		const rgb = color
			.rgb()
			.array()
			.map((v) => Math.round(v));
		return (
			<div
				className={cn("w-full rounded-md shadow-sm", className)}
				{...props}
			>
				<Input
					className="h-8 w-full bg-secondary px-2 text-xs shadow-none"
					readOnly
					type="text"
					value={`rgba(${rgb.join(", ")}, ${alpha}%)`}
				/>
			</div>
		);
	}

	return null;
};
