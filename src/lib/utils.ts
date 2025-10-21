/** @format */

import { clsx, type ClassValue } from "clsx";
import Color, { type ColorInstance } from "color";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function makeColorDarker(
	hexColor: string | ColorInstance,
	amount: number = 0.5,
): string {
	const color = Color(hexColor);
	return color.darken(amount).hex();
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function degreeToRadian(degree: number): number {
	return -degree * (Math.PI / 180);
}
export function radianToDegree(radian: number): number {
	return -radian * (180 / Math.PI);
}

export function toPureArrayBuffer(
	sab: SharedArrayBuffer | ArrayBufferLike,
): ArrayBuffer {
	const buffer = new ArrayBuffer(sab.byteLength);
	const view = new Uint8Array(buffer);
	view.set(new Uint8Array(sab));
	return buffer;
}

export function floatAsFraction(value: number): string {
	if (value === 0) return "0";
	const tolerance = 1.0e-6;
	let h1 = 1;
	let h2 = 0;
	let k1 = 0;
	let k2 = 1;
	let b = value;
	do {
		const a = Math.floor(b);
		let aux = h1;
		h1 = a * h1 + h2;
		h2 = aux;
		aux = k1;
		k1 = a * k1 + k2;
		k2 = aux;
		b = 1 / (b - a);
	} while (Math.abs(value - h1 / k1) > value * tolerance);
	return `${h1}/${k1}`;
}

export function isPowerOfTwo(value: number): boolean {
	return (value & (value - 1)) === 0 && value !== 0;
}

export function planeToRotation(
	plane: "XY" | "XZ" | "YZ",
): [number, number, number] {
	switch (plane) {
		case "XZ":
			// No rotation needed: XZ plane (Y is up)
			return [0, 0, 0];
		case "XY":
			// Rotate -Math.PI / 2 around X to make Y up (XY plane)
			return [-Math.PI / 2, 0, 0];
		case "YZ":
			// Rotate Math.PI / 2 around Z to make Y up (YZ plane)
			return [0, 0, Math.PI / 2];
		default:
			return [0, 0, 0];
	}
}
