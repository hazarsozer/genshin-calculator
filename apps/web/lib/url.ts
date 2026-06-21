import type { BuildForm } from "./types";
import { DEFAULT_FORM } from "./defaults";

/**
 * Encode a BuildForm to a URL-safe string (JSON → base64url).
 * Pure function — no side effects.
 */
export function encodeBuild(form: BuildForm): string {
  const json = JSON.stringify(form);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a URL-safe string back to a BuildForm.
 * Tolerant — returns DEFAULT_FORM on any parse error.
 * Pure function — no side effects.
 */
export function decodeBuild(s: string): BuildForm {
  try {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as BuildForm;
  } catch {
    return DEFAULT_FORM;
  }
}
