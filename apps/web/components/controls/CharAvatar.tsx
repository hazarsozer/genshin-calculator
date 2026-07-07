"use client";

import { useState, useEffect } from "react";
import { avatarIconSources } from "@/lib/enkaArt";

/**
 * Avatar icon with CDN fallback + gradient placeholder.
 * Mirrors SplashArt's approach but smaller (avatar icon, not gacha splash).
 */
export function CharAvatar({ name, className }: { name: string; className?: string }) {
  const sources = avatarIconSources(name);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

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
          onError={() =>
            idx + 1 < sources.length ? setIdx(idx + 1) : setFailed(true)
          }
        />
      )}
    </div>
  );
}
