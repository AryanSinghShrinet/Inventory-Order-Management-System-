import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine class names with conflict resolution. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
