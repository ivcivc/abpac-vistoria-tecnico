import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitário para mesclar classNames com suporte a Tailwind
 * Combina clsx e tailwind-merge para lidar com conflitos de classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
