import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"

import { AdminCategory } from "@/components/admin-category"
import { AdminLogin } from "@/components/admin-login"
import { logout } from "@/lib/admin-actions"
import { adminConfigured, isAdmin } from "@/lib/admin-auth"
import { getCategoryData, rankedEntries } from "@/lib/entries"
import { ACTIVE_THEME, themeVars } from "@/lib/theme"
import { VOTING_CATEGORIES, VOTING_PHASE, phaseCopy } from "@/lib/voting"

export const metadata: Metadata = {
  title: "Awards Admin | Smith & Sons",
  robots: { index: false, follow: false },
}

// Tallies must always be live.
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const theme = ACTIVE_THEME
  const authed = await isAdmin()
  const configured = adminConfigured()

  const categories = authed
    ? await Promise.all(
        VOTING_CATEGORIES.map(async (category) => {
          const data = await getCategoryData(category.slug)
          return {
            category,
            entries: rankedEntries(data),
            totalVotes: data.votes.length,
          }
        }),
      )
    : []

  const totals = categories.reduce(
    (acc, item) => ({
      entries: acc.entries + item.entries.length,
      pending:
        acc.pending +
        item.entries.filter((entry) => entry.status === "pending").length,
      votes: acc.votes + item.totalVotes,
    }),
    { entries: 0, pending: 0, votes: 0 },
  )

  return (
    <div
      className="aw-font-body flex min-h-screen flex-col"
      style={themeVars(theme)}
    >
      <main
        className="flex flex-1 flex-col py-14 md:py-16"
        style={{ backgroundColor: "var(--aw-criteria-bg)" }}
      >
        <div className="mx-auto w-full max-w-[1080px] px-6">
          <Link
            href="/vote"
            className="group inline-flex w-fit items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:brightness-110"
            style={{
              color: "var(--aw-criteria-eyebrow)",
              borderColor: "var(--aw-criteria-glass-border)",
              borderRadius: "var(--aw-radius)",
            }}
          >
            <ArrowLeft
              className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            Back to Voting
          </Link>

          {!configured ? (
            <p
              className="mt-10 max-w-2xl border-l-4 py-2 pl-5 text-base font-semibold leading-relaxed"
              style={{
                borderColor: "var(--aw-note-border)",
                color: "var(--aw-note-text)",
              }}
            >
              Set the ADMIN_PASSCODE environment variable to enable this
              dashboard.
            </p>
          ) : !authed ? (
            <div className="mt-10 flex justify-center md:mt-16">
              <AdminLogin />
            </div>
          ) : (
            <>
              <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p
                    className="aw-font-heading text-xs font-bold uppercase tracking-[0.3em]"
                    style={{ color: "var(--aw-criteria-eyebrow)" }}
                  >
                    {phaseCopy().badge} · Phase &ldquo;{VOTING_PHASE}&rdquo;
                  </p>
                  <h1
                    className="aw-font-heading mt-3 text-3xl font-extrabold uppercase leading-[1.05] tracking-tight md:text-4xl"
                    style={{ color: "var(--aw-criteria-title)" }}
                  >
                    Entries &amp; Results
                  </h1>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: "var(--aw-body)" }}
                  >
                    {totals.entries} {totals.entries === 1 ? "entry" : "entries"}{" "}
                    across {VOTING_CATEGORIES.length} categories ·{" "}
                    {totals.pending} awaiting approval · {totals.votes}{" "}
                    {totals.votes === 1 ? "vote" : "votes"} cast.
                  </p>
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="aw-font-heading inline-flex items-center border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]"
                    style={{
                      borderColor: "var(--aw-criteria-glass-border)",
                      color: "var(--aw-body)",
                      borderRadius: "var(--aw-button-radius)",
                    }}
                  >
                    Sign Out
                  </button>
                </form>
              </div>

              <div className="mt-8 flex flex-col gap-5">
                {categories.map(({ category, entries, totalVotes }) => (
                  <AdminCategory
                    key={category.slug}
                    categorySlug={category.slug}
                    title={category.title}
                    entries={entries}
                    totalVotes={totalVotes}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <footer
        className="py-10"
        style={{ backgroundColor: "var(--aw-footer-bg)" }}
      >
        <p
          className="text-center text-xs tracking-wide"
          style={{ color: "var(--aw-footer-fg)" }}
        >
          &copy; Smith &amp; Sons Renovations &amp; Extensions Australia
        </p>
      </footer>
    </div>
  )
}
