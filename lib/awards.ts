import rawAwards from "@/data/award-pages-content.json"

export type CriteriaContent =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }

export type CriteriaBlock = {
  /**
   * Section title, e.g. "APPLICATION".
   * When `content` is empty this string is rendered as a standalone italic note.
   */
  heading: string
  content: CriteriaContent[]
}

export type AwardPage = {
  slug: string
  title: string
  /** Filename only — images live in /public/images/ */
  heroImage: string
  /** CSS background-position for the hero image. Defaults to "center". */
  heroImagePosition?: string
  /** Automatic / data-judged awards set this to false and show a note instead of the form. */
  needsForm: boolean
  criteria: CriteriaBlock[]
}

export const STATES = ["NSW", "QLD", "SA", "VIC", "WA", "NEW ZEALAND"] as const

/*
 * The content file is authored/exported with snake_case keys and positional
 * ["p", text] / ["ul", items] tuples. Rather than teach the component that
 * shape, we normalise once here so `AwardPage` stays the single contract.
 */

type RawContent = ["p", string] | ["ul", string[]]

type RawAward = {
  slug: string
  title: string
  hero_image: string
  needs_form: boolean
  criteria: { heading: string; content: RawContent[] }[]
}

/**
 * Per-slug hero background-position overrides. The "Franchisee of the Year"
 * photos are tall portrait shots of couples — centering crops their heads,
 * so these are shifted to favor the top of the image.
 */
const HERO_IMAGE_POSITION_OVERRIDES: Record<string, string> = {
  "international-franchisee-of-the-year": "center 15%",
  "franchisee-of-the-year-nsw": "center 15%",
  "franchisee-of-the-year-qld": "center 15%",
  "franchisee-of-the-year-sa": "center 15%",
  "franchisee-of-the-year-vic": "center 15%",
  "franchisee-of-the-year-wa": "center 15%",
  "franchisee-of-the-year-nz": "center 15%",
}

function toContent(raw: RawContent): CriteriaContent {
  return raw[0] === "ul"
    ? { type: "ul", items: raw[1] }
    : { type: "p", text: raw[1] }
}

function toAward(raw: RawAward): AwardPage {
  return {
    slug: raw.slug,
    title: raw.title,
    heroImage: raw.hero_image,
    heroImagePosition: HERO_IMAGE_POSITION_OVERRIDES[raw.slug],
    needsForm: raw.needs_form,
    criteria: raw.criteria.map((block) => ({
      heading: block.heading,
      content: block.content.map(toContent),
    })),
  }
}

export const AWARDS: AwardPage[] = (rawAwards as RawAward[]).map(toAward)

export function getAward(slug: string): AwardPage | undefined {
  return AWARDS.find((award) => award.slug === slug)
}

export function getAwardSlugs(): string[] {
  return AWARDS.map((award) => award.slug)
}
