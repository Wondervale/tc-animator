/** @format */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
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
