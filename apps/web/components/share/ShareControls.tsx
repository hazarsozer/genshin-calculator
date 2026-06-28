"use client";

import { useState, type RefObject } from "react";
import { useBuildStore } from "@/lib/store";
import { encodeBuild } from "@/lib/url";

interface ShareControlsProps {
  /** Ref pointing to the BuildCard DOM node to be rasterized. */
  cardRef: RefObject<HTMLDivElement | null>;
}

/**
 * Compact action cluster: "Copy share link" + "Export build card".
 *
 * Copy: writes `<origin><pathname>#<encodeBuild(form)>` to clipboard.
 * Export: rasterizes the off-screen BuildCard via html-to-image, then downloads
 *   the PNG. If the splash art is CORS-blocked (canvas tainted), retries with
 *   <img> elements filtered out so the gradient background shows through.
 */
export function ShareControls({ cardRef }: ShareControlsProps) {
  const form = useBuildStore((s) => s.form);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  function handleCopyLink() {
    const hash = encodeBuild(form);
    const url = `${location.origin}${location.pathname}#${hash}`;

    if (!navigator.clipboard) {
      // Clipboard API unavailable (non-HTTPS or restricted). Show URL for manual copy.
      setFallbackUrl(url);
      return;
    }

    navigator.clipboard.writeText(url).then(() => {
      setFallbackUrl(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Permission denied — show URL for manual copy.
      setFallbackUrl(url);
    });
  }

  async function handleExport() {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    setExportError(null);

    try {
      // Lazy import — not needed at SSR build time.
      const { toPng } = await import("html-to-image");

      let dataUrl: string;
      try {
        // First attempt: include splash art (needs CDN CORS headers).
        dataUrl = await toPng(cardRef.current, { cacheBust: true });
      } catch {
        // Canvas tainted by cross-origin image — retry without <img> elements.
        // The art-gradient background on the image container shows through.
        dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          filter: (node) => !(node instanceof HTMLImageElement),
        });
      }

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${form.characterKey}-build.png`;
      a.click();
    } catch {
      setExportError("Export failed — try again or use a different browser.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ck-muted)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
      >
        {copied ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--ck-accent2)",
                boxShadow: "0 0 6px var(--ck-accent2)",
              }}
            />
            Copied!
          </>
        ) : (
          <>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Copy link
          </>
        )}
      </button>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ck-muted)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting ? (
          "Exporting…"
        ) : (
          <>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export card
          </>
        )}
      </button>

      {exportError && (
        <span className="text-[11px]" style={{ color: "var(--destructive)" }}>{exportError}</span>
      )}
      {fallbackUrl && (
        <input
          readOnly
          value={fallbackUrl}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          autoFocus
          className="ml-1 w-48 rounded border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-1 text-[11px] text-[var(--ck-text)] outline-none"
          title="Copy this link manually"
        />
      )}
    </div>
  );
}
