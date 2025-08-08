/** @format */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type Vector3 = [number, number, number];

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function degreeToRadian(degree: number): number {
	return (degree * Math.PI) / 180;
}
export function radianToDegree(radian: number): number {
	return (radian * 180) / Math.PI;
}
