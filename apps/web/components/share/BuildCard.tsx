"use client";

import { forwardRef } from "react";
import { useResults } from "@/lib/useResults";
import { useBuildStore } from "@/lib/store";
import { ALL_CHARACTERS } from "@genshin/data";
import { humanizeSlug } from "@/lib/utils";
import { splashSources } from "@/lib/enkaArt";

const ELEMENT_LABEL: Record<string, string> = {
  pyro: "Pyro",
  hydro: "Hydro",
  electro: "Electro",
  cryo: "Cryo",
  anemo: "Anemo",
  geo: "Geo",
  dendro: "Dendro",
  physical: "Physical",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number | undefined) => `${((n ?? 0) * 100).toFixed(1)}%`;

/**
 * Cinematic export card — rendered off-screen, rasterized to PNG via html-to-image.
 *
 * The splash art <img> carries crossOrigin="anonymous" so browsers fetch it with
 * CORS headers. If the CDN returns them the canvas will be clean; if not,
 * ShareControls catches the tainted-canvas error and retries filtering out <img>
 * elements so the art-gradient background shows through instead.
 */
export const BuildCard = forwardRef<HTMLDivElement>(function BuildCard(_, ref) {
  const result = useResults();
  const form = useBuildStore((s) => s.form);
  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const element = char?.element ?? "physical";
  const stats = result.stats ?? {};

  const headline = result.features.length
    ? [...result.features].sort((a, b) => b.triple[2] - a.triple[2])[0]
    : null;

  const splashUrl = splashSources(form.characterKey)[0];

  return (
    <div
      ref={ref}
      style={{
        width: 800,
        height: 450,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        background: "var(--ck-bg)",
        color: "var(--ck-text)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Splash art — right 55%, absolutely positioned */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          left: "35%",
          background: "var(--ck-art-gradient)",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={splashUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 22%",
          }}
        />
      </div>

      {/* Left-to-right scrim: heavier on left for text legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, var(--ck-bg) 0%, var(--ck-bg) 30%, rgba(11,8,9,0.88) 48%, rgba(11,8,9,0.3) 68%, rgba(11,8,9,0) 100%)",
        }}
      />

      {/* Radial accent glow */}
      <div
        style={{
          position: "absolute",
          left: "4%",
          top: "38%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--ck-accent) 20%, transparent), transparent 68%)",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      {/* Content panel */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "56%",
          padding: "32px 36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top: identity */}
        <div>
          {/* Element pill + stars + level */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 11px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.2,
                border: "1px solid color-mix(in srgb, var(--ck-accent) 34%, transparent)",
                background: "color-mix(in srgb, var(--ck-accent) 13%, transparent)",
                color: "var(--ck-accent2)",
              }}
            >
              {ELEMENT_LABEL[element].toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: "var(--ck-accent2)", letterSpacing: 2 }}>
              {"★".repeat(char?.rarity ?? 5)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ck-muted)" }}>
              Lv {form.charLevel}
            </span>
          </div>

          {/* Character name */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: -1.5,
              lineHeight: 0.92,
              marginBottom: 6,
            }}
          >
            {humanizeSlug(form.characterKey)}
          </div>

          {/* Weapon · refine · constellation */}
          <div
            style={{
              fontSize: 13,
              color: "var(--ck-muted)",
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            <span style={{ color: "var(--ck-text)", fontWeight: 700 }}>
              {humanizeSlug(form.weaponKey)}
            </span>{" "}
            · R{form.weaponRefine} · C{form.constellation}
          </div>

          {/* Headline triple */}
          {headline ? (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: "var(--ck-accent2)",
                  marginBottom: 2,
                }}
              >
                {headline.label}
              </div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "#fff",
                  fontVariantNumeric: "tabular-nums",
                  textShadow: "0 0 34px var(--ck-glow)",
                }}
              >
                {fmt(headline.triple[2])}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: "var(--ck-faint)",
                    }}
                  >
                    Non-crit
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(headline.triple[0])}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: "var(--ck-faint)",
                    }}
                  >
                    Crit
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--ck-accent2)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmt(headline.triple[1])}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--ck-muted)", fontSize: 13, marginBottom: 16 }}>
              {result.error ?? "No results"}
            </div>
          )}
        </div>

        {/* Bottom: stat chips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {[
            { label: "Crit Rate", value: pct(stats.crit_rate_total), hot: true },
            { label: "Crit DMG", value: pct(stats.crit_dmg_total), hot: true },
            { label: "ATK", value: fmt(stats.atk_total ?? 0), hot: false },
            { label: "HP", value: fmt(stats.hp_total ?? 0), hot: false },
            { label: "Elem. Mastery", value: fmt(stats.elemental_mastery_total ?? stats.elemental_mastery ?? 0), hot: false },
            {
              label: `${ELEMENT_LABEL[element]} DMG`,
              value: pct(stats[`dmg_${element}`]),
              hot: true,
            },
          ].map(({ label, value, hot }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                padding: "7px 10px",
                borderRadius: 9,
                border: "1px solid var(--ck-border)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--ck-faint)",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: hot ? "var(--ck-accent2)" : "var(--ck-text)",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Branding watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 18,
          zIndex: 20,
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(245,236,231,0.35)",
          letterSpacing: 0.5,
        }}
      >
        NAME·calc
      </div>
    </div>
  );
});
