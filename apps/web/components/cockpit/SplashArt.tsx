"use client";

import { useEffect, useState } from "react";
import { splashSources, avatarIconSources } from "@/lib/enkaArt";

interface SplashArtProps {
  name: string;
  className?: string;
  objectPosition?: string;
}

/**
 * Character splash art from the public CDNs, with a fallback chain. On the final
 * failure it hides the <img>, leaving the element-gradient background visible —
 * a missing asset never breaks layout.
 */
export function SplashArt({ name, className, objectPosition = "center 22%" }: SplashArtProps) {
  const sources = [...splashSources(name), ...avatarIconSources(name)];
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  // Reset the fallback chain whenever the character changes.
  useEffect(() => {
    setIdx(0);
    setFailed(false);
  }, [name]);

  return (
    <div
      className={className}
      style={{ background: "var(--ck-art-gradient)", overflow: "hidden" }}
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sources[idx]}
          alt={name}
          className="h-full w-full object-cover"
          style={{ objectPosition }}
          onError={() => (idx + 1 < sources.length ? setIdx(idx + 1) : setFailed(true))}
        />
      )}
    </div>
  );
}
