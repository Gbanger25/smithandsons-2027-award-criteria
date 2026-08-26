/**
 * Falling snow overlay, matching the Queenstown 2027 ATC conference site.
 *
 * Flake positions are generated from a seeded PRNG rather than Math.random()
 * so the server and client produce identical markup (Math.random() here would
 * cause a hydration mismatch). Same seed + same count = same snowfall, which
 * also means the hero and apply bands can have distinct patterns by seed.
 */

/** mulberry32 — small, fast, deterministic. */
function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function Snowfall({
  count = 60,
  seed = 1,
  tone = "light",
  className = "",
}: {
  /** Number of flakes. The conference site runs 90 across the full viewport. */
  count?: number
  /** Changing the seed reshuffles the pattern deterministically. */
  seed?: number
  /**
   * "light" = white flakes for dark bands. "dark" = tinted flakes so snow
   * stays visible on a pale band like the ice-mint criteria section.
   */
  tone?: "light" | "dark"
  className?: string
}) {
  const rand = seededRandom(seed)

  const flakes = Array.from({ length: count }, (_, i) => {
    const size = 2 + rand() * 5
    return {
      key: i,
      left: rand() * 100,
      size,
      // Smaller flakes read as further away, so keep them fainter.
      opacity: 0.4 + rand() * 0.45,
      fallDuration: 10 + rand() * 9,
      fallDelay: -(rand() * 18),
      swayDuration: 2.2 + rand() * 3.4,
      swayDistance: 10 + rand() * 20,
    }
  })

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {flakes.map((f) => (
        <span
          key={f.key}
          className="aw-snow-flake"
          style={{
            left: `${f.left}%`,
            // Height comes from CSS (100% of the band); the dot is square.
            width: `${f.size}px`,
            opacity: f.opacity,
            animationDuration: `${f.fallDuration}s`,
            animationDelay: `${f.fallDelay}s`,
          }}
        >
          <span
            className={
              tone === "dark" ? "aw-snow-dot aw-snow-dot-dark" : "aw-snow-dot"
            }
            style={{
              animationDuration: `${f.swayDuration}s`,
              ["--aw-snow-sway" as string]: `${f.swayDistance}px`,
            }}
          />
        </span>
      ))}
    </div>
  )
}
