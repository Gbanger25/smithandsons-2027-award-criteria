import type { CSSProperties } from "react"

/**
 * ONE THEME PER CONFERENCE YEAR.
 *
 * The award pages are re-skinned every year to match that year's ATC
 * conference site. Nothing in the components is hard-coded to a colour —
 * every surface reads a `--aw-*` CSS variable that comes from the theme
 * below, so changing years is a one-line change to `ACTIVE_THEME`.
 *
 * To add next year's theme: copy a block, rename the key, drop in the new
 * palette, then point ACTIVE_THEME at it.
 */
export type AwardTheme = {
  key: string
  /** Shown in tooling / docs only. */
  label: string
  /** Font stacks — reference the next/font variables defined in app/layout.tsx. */
  fontHeading: string
  fontBody: string
  /** Corner rounding for cards and form fields. Use "0px" for hard edges. */
  radius: string
  /** Button rounding — "999px" for conference-style pills, "0px" for hard edges. */
  buttonRadius: string
  /** Blur applied to the hero photo (source photos have text baked in). */
  heroBlur: string
  /** Frosted glass panel behind the hero copy, like the conference hero card. */
  heroGlassPanel: boolean
  /** Boxes the criteria copy in a frosted card, like the conference hero. */
  criteriaGlassPanel: boolean
  /** Large decorative snowflake glyphs sitting flat on the criteria band. */
  criteriaDecor: boolean
  /** Same glyphs on the Apply Now band, mirrored and dialled right down. */
  applyDecor: boolean
  /**
   * Falling snow, as on the Queenstown conference site. Set `false` for a
   * theme with no weather; otherwise give a flake count per dark band.
   */
  snow: false | { hero: number; criteria: number; apply: number }
  colors: {
    heroOverlay: string
    heroWash: string
    eyebrow: string
    heroHeading: string
    glass: string
    glassBorder: string
    criteriaBg: string
    /** Colour of the large decorative snowflake glyphs. */
    criteriaDecorFlake: string
    criteriaGlass: string
    criteriaGlassBorder: string
    criteriaEyebrow: string
    /** Big band title, e.g. the conference site's "LOCATION". */
    criteriaTitle: string
    criteriaHeading: string
    body: string
    bullet: string
    noteBorder: string
    noteText: string
    applyBg: string
    /**
     * Scrim laid over the apply/hero photo to keep type legible. Kept separate
     * from applyBg so the wash can stay a neutral ink instead of tinting the
     * photo with the band's brand colour.
     */
    applyScrim: string
    /** Colour of the large decorative snowflake glyphs on the apply band. */
    applyDecorFlake: string
    applyEyebrow: string
    applyHeading: string
    applyBody: string
    applyLabel: string
    field: string
    fieldText: string
    fieldBorder: string
    fieldFocus: string
    /** File-picker chip — sits on a field surface, so it needs its own pair. */
    fileBg: string
    fileFg: string
    buttonBg: string
    buttonHover: string
    buttonFg: string
    footerBg: string
    footerFg: string
  }
}

/** Queenstown 2027 ATC — alpine winter: forest green, ice mint, deep navy, hi-vis yellow. */
export const queenstown2027: AwardTheme = {
  key: "queenstown-2027",
  label: "Queenstown 2027 ATC",
  fontHeading: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
  fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  radius: "1rem",
  buttonRadius: "999px",
  heroBlur: "9px",
  heroGlassPanel: true,
  criteriaGlassPanel: true,
  criteriaDecor: true,
  applyDecor: true,
  snow: { hero: 45, criteria: 40, apply: 55 },
  colors: {
    heroOverlay: "rgba(7, 23, 39, 0.6)",
    heroWash: "linear-gradient(180deg, rgba(0,68,121,0.45) 0%, rgba(18,68,59,0.5) 100%)",
    eyebrow: "#ffe000",
    heroHeading: "#ffffff",
    glass: "rgba(247, 251, 253, 0.14)",
    glassBorder: "rgba(255, 255, 255, 0.3)",
    // Lifted from the conference site's "LOCATION" band (section three):
    // ice mint ground with two depths of forest green for type.
    criteriaBg: "#a4e3dc",
    criteriaDecorFlake: "#ffffff",
    criteriaGlass: "rgba(255, 255, 255, 0.42)",
    criteriaGlassBorder: "rgba(255, 255, 255, 0.65)",
    criteriaEyebrow: "#0c5a4f",
    criteriaTitle: "#0a3b34",
    criteriaHeading: "#0c5a4f",
    body: "#0d4a41",
    bullet: "#12443b",
    noteBorder: "#0c5a4f",
    noteText: "#0a3b34",
    // Lifted from the conference site's "SAVE THE DATE" band (section two):
    // forest green ground, hi-vis yellow accents, white headline, white pill CTA.
    applyBg: "#12443b",
    // Deep navy ink rather than the band's forest green, so the photo reads
    // neutral-dark instead of green-washed.
    applyScrim: "#071727",
    applyDecorFlake: "#a4e3dc",
    applyEyebrow: "#ffe000",
    applyHeading: "#ffffff",
    applyBody: "rgba(255, 255, 255, 0.78)",
    applyLabel: "#ffe000",
    field: "#ffffff",
    fieldText: "#071727",
    fieldBorder: "rgba(255, 255, 255, 0.38)",
    fieldFocus: "#ffe000",
    fileBg: "#12443b",
    fileFg: "#ffffff",
    buttonBg: "#ffffff",
    buttonHover: "#ffe000",
    buttonFg: "#0c5a4f",
    // Footer continues the apply band above it, so the page ends on one colour.
    footerBg: "#12443b",
    footerFg: "rgba(255, 255, 255, 0.72)",
  },
}

/** Smith & Sons house brand — the evergreen fallback (no conference skin). */
export const smithClassic: AwardTheme = {
  key: "smith-classic",
  label: "Smith & Sons house brand",
  fontHeading: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontBody: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  radius: "0px",
  buttonRadius: "0px",
  heroBlur: "9px",
  heroGlassPanel: false,
  criteriaGlassPanel: false,
  criteriaDecor: false,
  applyDecor: false,
  snow: false,
  colors: {
    heroOverlay: "rgba(17, 17, 17, 0.55)",
    heroWash: "none",
    eyebrow: "#8cc63f",
    heroHeading: "#ffffff",
    glass: "transparent",
    glassBorder: "transparent",
    criteriaBg: "#ffffff",
    criteriaDecorFlake: "transparent",
    criteriaGlass: "transparent",
    criteriaGlassBorder: "transparent",
    criteriaEyebrow: "#8cc63f",
    criteriaTitle: "#111111",
    criteriaHeading: "#73a31b",
    body: "#2b2b2b",
    bullet: "#8fba1f",
    noteBorder: "#8fba1f",
    noteText: "#3f3f3f",
    applyBg: "#f2f2f2",
    applyScrim: "#f2f2f2",
    applyDecorFlake: "transparent",
    applyEyebrow: "#73a31b",
    applyHeading: "#111111",
    applyBody: "#3f3f3f",
    applyLabel: "#111111",
    field: "#ffffff",
    fieldText: "#111111",
    fieldBorder: "#d4d4d4",
    fieldFocus: "#8fba1f",
    fileBg: "#8fba1f",
    fileFg: "#ffffff",
    buttonBg: "#8fba1f",
    buttonHover: "#73a31b",
    buttonFg: "#ffffff",
    footerBg: "#f2f2f2",
    footerFg: "#737373",
  },
}

export const themes = {
  [queenstown2027.key]: queenstown2027,
  [smithClassic.key]: smithClassic,
} satisfies Record<string, AwardTheme>

/** ← CHANGE THIS EACH YEAR to re-skin all award pages at once. */
export const ACTIVE_THEME: AwardTheme = queenstown2027

/** Flattens a theme into the `--aw-*` custom properties the components consume. */
export function themeVars(theme: AwardTheme): CSSProperties {
  const { colors: c } = theme
  return {
    "--aw-font-heading": theme.fontHeading,
    "--aw-font-body": theme.fontBody,
    "--aw-radius": theme.radius,
    "--aw-button-radius": theme.buttonRadius,
    "--aw-hero-blur": theme.heroBlur,
    "--aw-hero-overlay": c.heroOverlay,
    "--aw-hero-wash": c.heroWash,
    "--aw-eyebrow": c.eyebrow,
    "--aw-hero-heading": c.heroHeading,
    "--aw-glass": c.glass,
    "--aw-glass-border": c.glassBorder,
    "--aw-criteria-bg": c.criteriaBg,
    "--aw-criteria-decor": c.criteriaDecorFlake,
    "--aw-criteria-glass": c.criteriaGlass,
    "--aw-criteria-glass-border": c.criteriaGlassBorder,
    "--aw-criteria-eyebrow": c.criteriaEyebrow,
    "--aw-criteria-title": c.criteriaTitle,
    "--aw-criteria-heading": c.criteriaHeading,
    "--aw-body": c.body,
    "--aw-bullet": c.bullet,
    "--aw-note-border": c.noteBorder,
    "--aw-note-text": c.noteText,
    "--aw-apply-bg": c.applyBg,
  "--aw-apply-scrim": c.applyScrim,
    "--aw-apply-decor": c.applyDecorFlake,
    "--aw-apply-eyebrow": c.applyEyebrow,
    "--aw-apply-heading": c.applyHeading,
    "--aw-apply-body": c.applyBody,
    "--aw-apply-label": c.applyLabel,
    "--aw-field": c.field,
    "--aw-field-text": c.fieldText,
    "--aw-field-border": c.fieldBorder,
    "--aw-field-focus": c.fieldFocus,
    "--aw-file-bg": c.fileBg,
    "--aw-file-fg": c.fileFg,
    "--aw-button-bg": c.buttonBg,
    "--aw-button-hover": c.buttonHover,
    "--aw-button-fg": c.buttonFg,
    "--aw-footer-bg": c.footerBg,
    "--aw-footer-fg": c.footerFg,
  } as CSSProperties
}
