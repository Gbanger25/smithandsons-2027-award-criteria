import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ApplyForm } from "@/components/apply-form"
import { FlakeDecor } from "@/components/flake-decor"
import { Snowfall } from "@/components/snowfall"
import type { AwardPage as AwardPageData, CriteriaBlock } from "@/lib/awards"
import { ACTIVE_THEME, themeVars, type AwardTheme } from "@/lib/theme"

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-4">
          <span
            aria-hidden="true"
            className="mt-[0.5rem] size-2 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--aw-bullet)" }}
          />
          <span
            className="max-w-[60ch] text-base font-medium leading-relaxed text-pretty"
            style={{ color: "var(--aw-body)" }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

function CriteriaSection({ block }: { block: CriteriaBlock }) {
  // A block with no content is a standalone freeform note.
  if (block.content.length === 0) {
    return (
      <p
        className="aw-font-body max-w-[62ch] border-l-4 py-2 pl-5 text-base font-semibold italic leading-relaxed"
        style={{
          borderColor: "var(--aw-note-border)",
          color: "var(--aw-note-text)",
        }}
      >
        {block.heading}
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <h3
        className="aw-font-heading text-base font-bold uppercase tracking-[0.25em]"
        style={{ color: "var(--aw-criteria-heading)" }}
      >
        {block.heading}
      </h3>
      <div className="aw-font-body flex flex-col gap-4">
        {block.content.map((item, index) =>
          item.type === "p" ? (
            <p
              key={index}
              className="max-w-[62ch] text-base font-medium leading-relaxed text-pretty"
              style={{ color: "var(--aw-body)" }}
            >
              {item.text}
            </p>
          ) : (
            <Bullets key={index} items={item.items} />
          ),
        )}
      </div>
    </section>
  )
}

export function AwardPage({
  data,
  theme = ACTIVE_THEME,
}: {
  data: AwardPageData
  /** Defaults to the active conference-year theme in lib/theme.ts. */
  theme?: AwardTheme
}) {
  return (
    <div
      className="aw-font-body flex min-h-screen flex-col"
      style={themeVars(theme)}
    >
      <header className="relative isolate flex h-[520px] items-center overflow-hidden md:h-[640px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover"
          style={{
            backgroundImage: `url(/images/${data.heroImage})`,
            backgroundPosition: data.heroImagePosition ?? "center",
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
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: "color-mix(in srgb, var(--aw-hero-overlay) 25%, transparent)" }}
        />
        {theme.snow ? (
          <Snowfall count={theme.snow.hero} seed={11} className="-z-10" />
        ) : null}

        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start px-6 md:px-12">
          <div
            className={
              theme.heroGlassPanel
                ? "flex max-w-md flex-col border px-6 py-6 backdrop-blur-md md:px-7"
                : "flex max-w-md flex-col"
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
              Awards Criteria
            </p>
            <h1
              className="aw-font-heading mt-3 text-2xl font-extrabold uppercase leading-[1.12] tracking-tight text-balance md:text-[2rem]"
              style={{
                color: "var(--aw-hero-heading)",
                textShadow: "0 2px 18px rgba(7, 23, 39, 0.45)",
              }}
            >
              {data.title}
            </h1>
          </div>
          <Link
            href="/"
            className="group mt-5 inline-flex w-fit items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-colors hover:brightness-110"
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
            Back to All Awards
          </Link>
        </div>
      </header>

      <main>
        <div
          className="relative isolate overflow-hidden py-16 md:py-24"
          style={{ backgroundColor: "var(--aw-criteria-bg)" }}
        >
          {theme.criteriaDecor ? <FlakeDecor /> : null}

          {theme.snow ? (
            <Snowfall count={theme.snow.criteria} seed={17} tone="dark" />
          ) : null}

          <div className="relative mx-auto w-full max-w-[980px] px-6">
            <div
              className={
                theme.criteriaGlassPanel
                  ? "flex flex-col border px-7 py-12 shadow-[0_18px_60px_-20px_rgba(10,59,52,0.35)] backdrop-blur-xl md:px-14 md:py-16"
                  : "flex flex-col"
              }
              style={
                theme.criteriaGlassPanel
                  ? {
                      backgroundColor: "var(--aw-criteria-glass)",
                      borderColor: "var(--aw-criteria-glass-border)",
                      borderRadius: "var(--aw-radius)",
                    }
                  : undefined
              }
            >
              <div
                className={
                  theme.criteriaGlassPanel
                    ? "flex flex-col items-center text-center"
                    : "flex flex-col"
                }
              >
                <p
                  className="aw-font-heading text-sm font-bold uppercase tracking-[0.25em]"
                  style={{ color: "var(--aw-criteria-eyebrow)" }}
                >
                  What we&apos;re looking for
                </p>
                <h2
                  className="aw-font-heading mt-3 text-4xl font-extrabold uppercase leading-[1.02] tracking-tight md:text-6xl"
                  style={{ color: "var(--aw-criteria-title)" }}
                >
                  Criteria
                </h2>
              </div>

              {theme.criteriaGlassPanel ? (
                <div
                  aria-hidden="true"
                  className="mx-auto mt-10 h-px w-24"
                  style={{ backgroundColor: "var(--aw-criteria-glass-border)" }}
                />
              ) : null}

              {/* Blocks stay left-aligned — centred bullet lists are hard to read. */}
              <div className="mt-10 flex flex-col gap-12 md:mt-12">
                {data.criteria.map((block, index) => (
                  <CriteriaSection
                    key={`${block.heading}-${index}`}
                    block={block}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative isolate overflow-hidden py-16 md:py-20"
          style={{ backgroundColor: "var(--aw-apply-bg)" }}
        >
          {theme.applyDecor ? (
            <FlakeDecor
              color="var(--aw-apply-decor)"
              intensity={0.35}
              mirror
            />
          ) : null}

          {theme.snow ? <Snowfall count={theme.snow.apply} seed={29} /> : null}

          <div className="relative mx-auto w-full max-w-[900px] px-6">
            {data.needsForm ? (
              <>
                <p
                  className="aw-font-heading text-xs font-bold uppercase tracking-[0.3em]"
                  style={{ color: "var(--aw-apply-eyebrow)" }}
                >
                  Submit Your Entry
                </p>
                <h2
                  className="aw-font-heading mt-4 text-2xl font-extrabold uppercase tracking-[0.12em] md:text-3xl"
                  style={{ color: "var(--aw-apply-heading)" }}
                >
                  Apply Now
                </h2>
                <p
                  className="mt-4 max-w-2xl text-[0.975rem] leading-relaxed"
                  style={{ color: "var(--aw-apply-body)" }}
                >
                  Complete the form below to submit your application for this
                  award.
                </p>
                <ApplyForm awardTitle={data.title} />
              </>
            ) : (
              <p
                className="max-w-3xl border-l-4 py-2 pl-5 text-xl font-semibold leading-relaxed md:text-2xl"
                style={{
                  borderColor: "var(--aw-apply-eyebrow)",
                  color: "var(--aw-apply-heading)",
                }}
              >
                This award does not require an application — see the criteria
                above for how it&apos;s judged.
              </p>
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
