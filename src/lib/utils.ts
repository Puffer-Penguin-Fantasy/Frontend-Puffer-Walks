import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Shadcn/UI Helper for combining CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility for generating secure, human-readable Join Codes for Puffer Walks.
 * Example: PW-7X9Y-3K3A
 */
export const generateJoinCode = (length: number = 6): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed O, 0, I, 1 for clarity
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 3 === 0 && length > 6) result += '-'; // Only add hyphens for longer codes
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result; // Returning pure 6-char code as requested
};

/**
 * Utility to hash strings (like Fitbit IDs or Join Codes) for on-chain privacy.
 * Uses SHA-256 for secure verification.
 */
export const hashString = async (input: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex}`;
};
