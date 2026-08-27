/**
 * The two award domains are served by this single project, so each request is
 * mapped to exactly one section. Without this, both domains would serve the
 * whole site and the applications domain would still expose the ballots.
 */

/** Awards Criteria: judging criteria and entry applications. */
export const APPLICATIONS_HOST = "smithandsons-atc-award-applications.com"

/** People's Choice: voting only. */
export const VOTING_HOST = "smithandsons-atc-award-voting.com"

export type SiteSection = "applications" | "voting" | "both"

/**
 * Resolves the section a hostname belongs to.
 *
 * Anything that isn't one of the two production domains — localhost, v0
 * previews, *.vercel.app deploy URLs — returns "both" so the full site stays
 * testable in one place.
 */
export function sectionForHost(host: string | null | undefined): SiteSection {
  if (!host) return "both"

  // Strip the port and any www. prefix so apex and www both resolve.
  const hostname = host.toLowerCase().split(":")[0].replace(/^www\./, "")

  if (hostname === APPLICATIONS_HOST) return "applications"
  if (hostname === VOTING_HOST) return "voting"

  return "both"
}

/** Paths that belong to the People's Choice voting site. */
export function isVotingPath(pathname: string): boolean {
  return (
    pathname === "/vote" ||
    pathname.startsWith("/vote/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  )
}
