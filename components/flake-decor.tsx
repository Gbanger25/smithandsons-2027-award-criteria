import { Snowflake } from "lucide-react"

/**
 * Large static snowflake glyphs sitting flat on a band's background, as on
 * the conference site's mint panels. Purely decorative — the animated
 * weather lives in <Snowfall />.
 *
 * Percentage offsets keep the arrangement intact at any band height, and the
 * biggest flakes deliberately bleed off the edges so the pattern reads as a
 * crop of something larger rather than a row of centred icons.
 */
type Flake = {
  top?: string
  right?: string
  bottom?: string
  left?: string
  size: number
  opacity: number
}

const FLAKES: Flake[] = [
  { top: "-14%", left: "-4%", size: 300, opacity: 0.4 },
  { top: "8%", right: "6%", size: 64, opacity: 0.3 },
  { top: "46%", left: "3%", size: 52, opacity: 0.34 },
  { bottom: "-12%", right: "-3%", size: 210, opacity: 0.28 },
  { bottom: "18%", left: "38%", size: 40, opacity: 0.22 },
]

export function FlakeDecor({
  color = "var(--aw-criteria-decor)",
  intensity = 1,
  mirror = false,
}: {
  /** CSS colour (usually a theme var) for the glyph strokes. */
  color?: string
  /**
   * Multiplies every flake's opacity. Dark bands need a much lower value —
   * white strokes that read as subtle texture on mint are glaring on green.
   */
  intensity?: number
  /** Flips the arrangement horizontally so stacked bands don't look cloned. */
  mirror?: boolean
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {FLAKES.map((f, i) => (
        <Snowflake
          key={i}
          strokeWidth={1.4}
          className="absolute"
          style={{
            top: f.top,
            bottom: f.bottom,
            // Swapping the horizontal anchors mirrors the whole arrangement.
            left: mirror ? f.right : f.left,
            right: mirror ? f.left : f.right,
            width: f.size,
            height: f.size,
            opacity: f.opacity * intensity,
            color,
          }}
        />
      ))}
    </div>
  )
}
