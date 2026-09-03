import { AWARDS, getAward } from "@/lib/awards"

/**
 * The nine "People's Choice" categories that the network votes on. Everything
 * else in AWARDS is judged internally and never appears under /vote.
 *
 * Slugs match the existing /awards/[slug] pages so a category has exactly one
 * criteria page and one vote page.
 */
export const VOTING_CATEGORY_SLUGS = [
  "australian-kitchen-of-the-year",
  "australian-bathroom-of-the-year",
  "australian-outdoor-project-of-the-year",
  "australian-metro-renovation-of-the-year",
  "australian-regional-renovation-of-the-year",
  "nz-kitchen-of-the-year",
  "nz-bathroom-of-the-year",
  "nz-outdoor-project-of-the-year",
  "nz-renovation-of-the-year",
] as const

export type VotingCategorySlug = (typeof VOTING_CATEGORY_SLUGS)[number]

/**
 * Which region a category belongs to. Used only to group the vote hub — the
 * ballot itself is open to every office regardless of region.
 */
export type VotingRegion = "Australia" | "New Zealand"

export type VotingCategory = {
  slug: VotingCategorySlug
  /** Full award title, from the criteria content file. */
  title: string
  /** Title with the region prefix stripped, for use inside a region group. */
  shortTitle: string
  region: VotingRegion
  heroImage: string
  heroImagePosition?: string
}

function shortenTitle(title: string): string {
  return title
    .replace(/^australian\s+/i, "")
    .replace(/^new zealand\s+/i, "")
    .replace(/^nz\s+/i, "")
}

export const VOTING_CATEGORIES: VotingCategory[] = VOTING_CATEGORY_SLUGS.map(
  (slug) => {
    const award = getAward(slug)
    if (!award) {
      // A typo in the slug list would otherwise surface as an empty hub.
      throw new Error(`Voting category "${slug}" has no award content entry.`)
    }
    return {
      slug,
      title: award.title,
      shortTitle: shortenTitle(award.title),
      region: slug.startsWith("nz-") ? "New Zealand" : "Australia",
      heroImage: award.heroImage,
      heroImagePosition: award.heroImagePosition,
    }
  },
)

export function isVotingCategory(slug: string): slug is VotingCategorySlug {
  return (VOTING_CATEGORY_SLUGS as readonly string[]).includes(slug)
}

export function getVotingCategory(slug: string): VotingCategory | undefined {
  return VOTING_CATEGORIES.find((category) => category.slug === slug)
}

export const VOTING_REGIONS: VotingRegion[] = ["Australia", "New Zealand"]

/* ------------------------------------------------------------------ *
 * Application awards
 *
 * Everything that shows a form but isn't one of the nine People's Choice
 * categories is an internally-judged award. These collect written
 * applications (stored, but never voted on) rather than ballot entries.
 * ------------------------------------------------------------------ */

export type ApplicationAward = {
  slug: string
  title: string
}

export const APPLICATION_AWARDS: ApplicationAward[] = AWARDS.filter(
  (award) => award.needsForm && !isVotingCategory(award.slug),
).map((award) => ({ slug: award.slug, title: award.title }))

export function isApplicationAward(slug: string): boolean {
  return APPLICATION_AWARDS.some((award) => award.slug === slug)
}

/* ------------------------------------------------------------------ *
 * Phase
 * ------------------------------------------------------------------ */

/**
 * Where the awards cycle currently sits. Flip this one constant to move the
 * whole site between phases — no dates, no database flag.
 *
 *   "entries" — offices submit projects; the ballot is not open yet.
 *   "voting"  — entries are locked; the network casts votes.
 *   "closed"  — voting has finished; winners are announced at conference.
 */
export type VotingPhase = "entries" | "voting" | "closed"

/*
 * Typed as the full union (not the literal) so every phase comparison across
 * the app stays valid when this value is edited. Without the cast TypeScript
 * narrows to "voting" and flags the other branches as unreachable.
 */
export const VOTING_PHASE = "voting" as VotingPhase

type PhaseCopy = {
  /** Short status chip, e.g. on the hub cards. */
  badge: string
  /** Headline shown above the nominee list. */
  heading: string
  /** Headline for the /vote hub, which covers all nine categories at once. */
  hubHeading: string
  /** One-line explanation of what a visitor can do right now. */
  body: string
}

const PHASE_COPY: Record<VotingPhase, PhaseCopy> = {
  entries: {
    // The ballot URL is only shared once voting is live, so this pre-launch
    // state must never announce that voting is closed or "not open yet".
    // Keep it neutral — just present the nominees.
    badge: "People's Choice",
    heading: "Meet the nominees",
    hubHeading: "People's Choice Awards",
    body: "Take a look at the projects nominated in this category.",
  },
  voting: {
    badge: "Voting open",
    heading: "Cast your vote",
    hubHeading: "Voting is now open",
    body: "Pick your office, then choose the project you believe should take the award. One vote per office.",
  },
  closed: {
    badge: "Voting closed",
    heading: "Voting has closed",
    hubHeading: "Voting has closed",
    body: "Thanks to everyone who voted. Winners are announced at the conference.",
  },
}

export function phaseCopy(phase: VotingPhase = VOTING_PHASE): PhaseCopy {
  return PHASE_COPY[phase]
}

export const ENTRIES_OPEN = VOTING_PHASE === "entries"
export const VOTING_OPEN = VOTING_PHASE === "voting"
