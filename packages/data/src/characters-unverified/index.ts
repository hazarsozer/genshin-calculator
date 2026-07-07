/** Transient staging barrel — past-v5.8 chars being gated before promotion. NOT globbed by the vitest
 * suites (they glob characters/*.ts); the gate's _port-entry.ts merges this for resolution, so a staged
 * char resolves for gating without triggering the every-char golden suite. Promote to characters/ (+
 * generate fixtures) once the gate validates it. (Flins promoted in sub-project D; Lauma + Columbina in
 * the KP-L lockstep — see tools/port/LIVE-CHARS.md.)
 *
 * Currently EMPTY: lohen (10th GO-gated; cryo polearm, 5★, Mondstadt 6.6) was promoted to characters/
 * on 2026-06-19, joining nefer (2026-06-17) and durin + jahoda + zibai + illuga + varka + linnea +
 * nicole + prune (2026-06-18). New chars stage here as they're gated. */
export {};
