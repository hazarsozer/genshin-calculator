"use client";
import { useEffect, useState } from "react";

/**
 * Returns true when the CSS media query matches.
 * SSR-safe: initialises to `false` until the browser runs the effect.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** True when viewport width is below the Tailwind `lg` breakpoint (< 1024 px). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
