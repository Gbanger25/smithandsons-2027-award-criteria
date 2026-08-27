import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { FlakeDecor } from "@/components/flake-decor"
import { Snowfall } from "@/components/snowfall"
import { ACTIVE_THEME, themeVars } from "@/lib/theme"
import {
  VOTING_CATEGORIES,
  VOTING_REGIONS,
  phaseCopy,
} from "@/lib/voting"

export const metadata: Metadata = {
  title: "Vote | Smith & Sons Awards",
  description:
    "Cast your office's vote in the Smith & Sons People's Choice award categories.",
}

export default function VoteHubPage() {
  const theme = ACTIVE_THEME
  const copy = phaseCopy()

  return (
    <div
      className="aw-font-body flex min-h-screen flex-col"
      style={themeVars(theme)}
    >
      <header
        className="relative isolate overflow-hidden py-16 md:py-24"
        style={{ backgroundColor: "var(--aw-apply-bg)" }}
      >
        {theme.applyDecor ? (
          <FlakeDecor color="var(--aw-apply-decor)" intensity={0.35} mirror />
        ) : null}
        {theme.snow ? <Snowfall count={theme.snow.apply} seed={41} /> : null}

        <div className="relative mx-auto w-full max-w-[1080px] px-6">
          <Link
            href="/"
            className="group inline-flex w-fit items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-colors hover:brightness-110"
            style={{
              color: "var(--aw-apply-eyebrow)",
              borderColor: "var(--aw-glass-border)",
              backgroundColor: "var(--aw-glass)",
              borderRadius: "var(--aw-radius)",
            }}
          >
            <ArrowLeft
              className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            Home
          </Link>

          <p
            className="aw-font-heading mt-8 text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--aw-apply-eyebrow)" }}
          >
            People&apos;s Choice
          </p>
          <h1
            className="aw-font-heading mt-4 text-3xl font-extrabold uppercase leading-[1.1] tracking-tight text-balance md:text-5xl"
            style={{ color: "var(--aw-apply-heading)" }}
          >
            {copy.hubHeading}
          </h1>
          <p
            className="mt-5 max-w-2xl text-[0.975rem] leading-relaxed"
            style={{ color: "var(--aw-apply-body)" }}
          >
            {copy.body} Choose a category below to see the projects nominated by
            offices across the network.
          </p>
        </div>
      </header>

      <main
        className="relative isolate flex-1 overflow-hidden py-16 md:py-20"
        style={{ backgroundColor: "var(--aw-criteria-bg)" }}
      >
        {theme.criteriaDecor ? <FlakeDecor /> : null}
        {theme.snow ? (
          <Snowfall count={theme.snow.criteria} seed={53} tone="dark" />
        ) : null}

        <div className="relative mx-auto w-full max-w-[1080px] px-6">
          {VOTING_REGIONS.map((region, index) => {
            const categories = VOTING_CATEGORIES.filter(
              (category) => category.region === region,
            )
            if (categories.length === 0) return null

            return (
              <section key={region} className={index > 0 ? "mt-14" : undefined}>
                <h2
                  className="aw-font-heading text-sm font-bold uppercase tracking-[0.25em]"
                  style={{ color: "var(--aw-criteria-eyebrow)" }}
                >
                  {region}
                </h2>

                <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/vote/${category.slug}`}
                        className="group flex h-full flex-col overflow-hidden border backdrop-blur-xl transition-transform hover:-translate-y-0.5"
                        style={{
                          backgroundColor: "var(--aw-criteria-glass)",
                          borderColor: "var(--aw-criteria-glass-border)",
                          borderRadius: "var(--aw-radius)",
                        }}
                      >
                        <div
                          aria-hidden="true"
                          className="h-36 w-full bg-cover"
                          style={{
                            backgroundImage: `url(/images/${category.heroImage})`,
                            backgroundPosition:
                              category.heroImagePosition ?? "center",
                          }}
                        />
                        <div className="flex flex-1 flex-col justify-between gap-4 px-6 py-5">
                          <span
                            className="aw-font-heading text-base font-bold uppercase leading-snug tracking-wide text-pretty"
                            style={{ color: "var(--aw-criteria-title)" }}
                          >
                            {category.shortTitle}
                          </span>
                          <span
                            className="aw-font-heading inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"
                            style={{ color: "var(--aw-criteria-eyebrow)" }}
                          >
                            {copy.badge}
                            <ArrowRight
                              className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
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
