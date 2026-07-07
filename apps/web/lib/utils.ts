import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function humanizeSlug(slug: string): string {
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function humanizePascal(key: string): string {
  return key
    // Split a leading/standalone single capital from a following capitalized word: "ALeisurely" → "A Leisurely".
    .replace(/\b([A-Z])([A-Z][a-z])/g, '$1 $2')
    // Split lowercase/digit → uppercase boundaries (existing behavior).
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}
