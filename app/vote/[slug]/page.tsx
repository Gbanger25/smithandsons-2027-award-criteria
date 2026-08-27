import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText } from "lucide-react"

import { Ballot } from "@/components/ballot"
import { FlakeDecor } from "@/components/flake-decor"
import { Snowfall } from "@/components/snowfall"
import { approvedEntries, getCategoryData, voteForOffice } from "@/lib/entries"
import { getRememberedOffice, loadOffices } from "@/lib/offices"
import { ACTIVE_THEME, themeVars } from "@/lib/theme"
import {
  VOTING_CATEGORY_SLUGS,
  VOTING_OPEN,
  getVotingCategory,
  phaseCopy,
} from "@/lib/voting"

// Votes are cast and read continuously, so this page must never be cached.
export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return VOTING_CATEGORY_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = getVotingCategory(slug)
  if (!category) return { title: "Vote | Smith & Sons Awards" }
  return {
    title: `Vote — ${category.title} | Smith & Sons Awards`,
    description: `Cast your office's vote for ${category.title}.`,
  }
}

export default async function VoteCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = getVotingCategory(slug)
  if (!category) notFound()

  const theme = ACTIVE_THEME
  const copy = phaseCopy()

  const [data, offices, rememberedOffice] = await Promise.all([
    getCategoryData(category.slug),
    loadOffices(),
    getRememberedOffice(),
  ])

  const nominees = approvedEntries(data).map((entry) => ({
    id: entry.id,
    office: entry.office,
    state: entry.state,
    projectTitle: entry.projectTitle,
    details: entry.details,
    images: entry.images,
  }))

  // If this office already voted here, show that on load rather than making
  // them re-pick and risk voting twice by accident.
  const existingVote = voteForOffice(data, rememberedOffice)

  return (
    <div
      className="aw-font-body flex min-h-screen flex-col"
      style={themeVars(theme)}
    >
      <header className="relative isolate flex h-[380px] items-center overflow-hidden md:h-[440px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover"
          style={{
            backgroundImage: `url(/images/${category.heroImage})`,
            backgroundPosition: category.heroImagePosition ?? "center",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(90deg, var(--aw-hero-overlay) 0%, color-mix(in srgb, var(--aw-hero-overlay) 55%, transparent) 45%, color-mix(in srgb, var(--aw-hero-overlay) 15%, transparent) 100%)",
          }}
        />
        {theme.snow ? (
          <Snowfall count={theme.snow.hero} seed={61} className="-z-10" />
        ) : null}

        <div className="mx-auto flex w-full max-w-[1080px] flex-col items-start px-6 md:px-12">
          <div
            className={
              theme.heroGlassPanel
                ? "flex max-w-lg flex-col border px-6 py-6 backdrop-blur-md md:px-7"
                : "flex max-w-lg flex-col"
            }
            style={
              theme.heroGlassPanel
                ? {
                    backgroundColor: "var(--aw-glass)",
                    borderColor: "var(--aw-glass-border)",
                    borderRadius: "var(--aw-radius)",
                  }
                : undefined
            }
          >
            <p
              className="aw-font-heading text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: "var(--aw-eyebrow)" }}
            >
              {copy.badge}
            </p>
            <h1
              className="aw-font-heading mt-3 text-2xl font-extrabold uppercase leading-[1.12] tracking-tight text-balance md:text-[2rem]"
              style={{
                color: "var(--aw-hero-heading)",
                textShadow: "0 2px 18px rgba(7, 23, 39, 0.45)",
              }}
            >
              {category.title}
            </h1>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/vote"
              className="group inline-flex w-fit items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-colors hover:brightness-110"
              style={{
                color: "var(--aw-eyebrow)",
                borderColor: "var(--aw-glass-border)",
                backgroundColor: "var(--aw-glass)",
                borderRadius: "var(--aw-radius)",
              }}
            >
              <ArrowLeft
                className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              All Categories
            </Link>
            <Link
              href={`/awards/${category.slug}`}
              className="inline-flex w-fit items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-colors hover:brightness-110"
              style={{
                color: "var(--aw-eyebrow)",
                borderColor: "var(--aw-glass-border)",
                backgroundColor: "var(--aw-glass)",
                borderRadius: "var(--aw-radius)",
              }}
            >
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              View Criteria
            </Link>
          </div>
        </div>
      </header>

      <main
        className="relative isolate flex-1 overflow-hidden py-16 md:py-20"
        style={{ backgroundColor: "var(--aw-criteria-bg)" }}
      >
        {theme.criteriaDecor ? <FlakeDecor /> : null}
        {theme.snow ? (
          <Snowfall count={theme.snow.criteria} seed={67} tone="dark" />
        ) : null}

        <div className="relative mx-auto w-full max-w-[1080px] px-6">
          <p
            className="aw-font-heading text-sm font-bold uppercase tracking-[0.25em]"
            style={{ color: "var(--aw-criteria-eyebrow)" }}
          >
            {nominees.length} {nominees.length === 1 ? "Nominee" : "Nominees"}
          </p>
          <h2
            className="aw-font-heading mt-3 text-3xl font-extrabold uppercase leading-[1.05] tracking-tight md:text-5xl"
            style={{ color: "var(--aw-criteria-title)" }}
          >
            {copy.heading}
          </h2>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed"
            style={{ color: "var(--aw-body)" }}
          >
            {copy.body}
          </p>

          <div className="mt-10">
            {nominees.length === 0 ? (
              <p
                className="max-w-2xl border-l-4 py-2 pl-5 text-lg font-semibold leading-relaxed"
                style={{
                  borderColor: "var(--aw-note-border)",
                  color: "var(--aw-note-text)",
                }}
              >
                No entries have been published for this category yet. Check back
                soon.
              </p>
            ) : (
              <Ballot
                categorySlug={category.slug}
                nominees={nominees}
                offices={offices}
                votingOpen={VOTING_OPEN}
                initialOffice={rememberedOffice ?? ""}
                initialVotedFor={existingVote?.entryId ?? null}
              />
            )}
          </div>
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
