/** Transient staging barrel — past-v5.8 chars being gated before promotion. NOT globbed by the vitest
 * suites (they glob characters/*.ts); the gate's _port-entry.ts merges this for resolution, so a staged
 * char resolves for gating without triggering the every-char golden suite. Promote to characters/ (+
 * generate fixtures) once the gate validates it. (Flins promoted in sub-project D; Lauma + Columbina in
 * the KP-L lockstep — see tools/port/LIVE-CHARS.md.)
 *
 * Currently STAGING: prune (9th GO-gated; anemo catalyst; VV/Swirl support — gates her converted-element
 * Clang + A1 Oathhammer per swirl-element variant). Promoted so far: nefer (2026-06-17) and durin + jahoda +
 * zibai + illuga + varka + linnea + nicole (2026-06-18). The remaining v6 chars (Lohen — blocked, no GO
 * sheet; see tools/port/live-chars.json) stage here as they're gated. */
export { prune } from "./prune.js";
