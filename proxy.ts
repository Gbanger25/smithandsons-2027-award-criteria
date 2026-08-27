import { NextResponse, type NextRequest } from "next/server"

import { isVotingPath, sectionForHost } from "@/lib/domains"

/**
 * Keeps the two domains separate:
 *
 *   applications domain -> criteria + entry forms only
 *   voting domain       -> ballot hub at the root, plus /admin
 *
 * Anything belonging to the other section returns a 404 rather than
 * redirecting across domains, since the two sites are sent out separately and
 * shouldn't advertise each other.
 */
export default function proxy(request: NextRequest) {
  const section = sectionForHost(request.headers.get("host"))
  const { pathname } = request.nextUrl

  // Previews and localhost serve everything so the whole site stays testable.
  if (section === "both") return NextResponse.next()

  if (section === "voting") {
    // The bare voting domain opens the ballot hub, so the link sent to voters
    // is as short as possible. Rewritten, not redirected, to keep the root URL.
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/vote", request.url))
    }

    // /vote still works and collapses onto the root.
    if (pathname === "/vote") {
      return NextResponse.redirect(new URL("/", request.url), 308)
    }

    return isVotingPath(pathname) ? NextResponse.next() : blocked(request)
  }

  // Applications domain: no ballots, no admin.
  return isVotingPath(pathname) ? blocked(request) : NextResponse.next()
}

/** Renders the 404 page without leaking which other domain would serve this. */
function blocked(request: NextRequest) {
  return NextResponse.rewrite(new URL("/__not-found", request.url))
}

export const config = {
  // Skip Next internals, API routes and anything with a file extension.
  matcher: ["/((?!_next/|api/|.*\\.).*)"],
}
