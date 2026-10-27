import Link from "next/link"
import { CalendarDays, ClipboardCheck, MapPin } from "lucide-react"

import { Snowfall } from "@/components/snowfall"
import { FlakeDecor } from "@/components/flake-decor"
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel"
import { AWARDS } from "@/lib/awards"
import { ACTIVE_THEME, themeVars } from "@/lib/theme"

const KEY_INFO = {
  awardsNight: "Friday 16th July 2027",
  location: "QT Hotel, Queenstown, New Zealand",
  dueDate: "31st of March 2027",
}

const KEY_INFO_ITEMS = [
  { icon: CalendarDays, label: "Awards Night", value: KEY_INFO.awardsNight },
  { icon: MapPin, label: "Awards Night Location", value: KEY_INFO.location },
  {
    icon: ClipboardCheck,
    label: "Applications Now Open",
    value: `Due date is the ${KEY_INFO.dueDate}`,
  },
]

const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/images/hero-awards-criteria-page-1.jpg",
    alt: "Smith & Sons team in olive polos kneeling on the grass holding The Smashes memorial trophy",
  },
  {
    src: "/images/hero-awards-criteria-page-6.jpg",
    alt: "Franchise owners gathered on stage with their glass awards at the presentation night",
  },
  {
    src: "/images/hero-awards-criteria-page-10.jpg",
    alt: "Team members in black-tie attire posing in front of the Smith & Sons media wall",
    position: "center 22%",
  },
  {
    src: "/images/hero-awards-criteria-page-5.jpg",
    alt: "Guests mingling with drinks at an outdoor evening function under festoon lights",
  },
  {
    src: "/images/hero-awards-criteria-page-8.jpg",
    alt: "Large group of team members and families laughing together on the blue carpet",
    position: "center 22%",
  },
  {
    src: "/images/hero-awards-criteria-page-2.jpg",
    alt: "Resort pool ringed by palm trees with attendees floating on green Smith & Sons inflatables",
    position: "center 70%",
  },
  {
    src: "/images/hero-awards-criteria-page-3.jpg",
    alt: "Five women laughing together in front of the branded Smith & Sons backdrop",
    position: "center 22%",
  },
  {
    src: "/images/hero-awards-criteria-page-11.jpg",
    alt: "Two attendees carrying green Smith & Sons pool mats through the tropical resort gardens",
  },
  {
    src: "/images/hero-awards-criteria-page-9.jpg",
    alt: "Young guests seated in the red leather booths of a heritage train carriage",
    position: "center 22%",
  },
  {
    src: "/images/hero-awards-criteria-page-4.jpg",
    alt: "Full conference group photographed in formal wear at the Smith & Sons backdrop",
    position: "center 22%",
  },
  {
    src: "/images/hero-awards-criteria-page-7.jpg",
    alt: "Three young boys posing at a lookout railing surrounded by lush greenery",
    position: "center 22%",
  },
]

const AWARD_GROUPS = [
  {
    label: "Application Required",
    awards: AWARDS.filter((award) => award.needsForm),
  },
  {
    label: "Automatic Entry",
    awards: AWARDS.filter((award) => !award.needsForm),
  },
].filter((group) => group.awards.length > 0)

export default function Page() {
  const theme = ACTIVE_THEME

  return (
    <div
      className="aw-font-body flex min-h-screen flex-col"
      style={themeVars(theme)}
    >
      <header
        className="relative isolate flex min-h-[420px] items-center overflow-hidden py-16 md:min-h-[560px] md:py-20"
        style={{ backgroundColor: "var(--aw-apply-bg)" }}
      >
        <HeroCarousel slides={HERO_SLIDES} />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--aw-apply-scrim) 80%, transparent) 0%, color-mix(in srgb, var(--aw-apply-scrim) 45%, transparent) 45%, color-mix(in srgb, var(--aw-apply-scrim) 12%, transparent) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: "color-mix(in srgb, var(--aw-apply-scrim) 18%, transparent)" }}
        />
        {theme.applyDecor ? (
          <FlakeDecor color="var(--aw-apply-decor)" intensity={0.35} mirror />
        ) : null}
        {theme.snow ? <Snowfall count={theme.snow.apply} seed={5} /> : null}

        <div className="relative mx-auto w-full max-w-[980px] px-6">
          <p
            className="aw-font-heading text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--aw-apply-eyebrow)" }}
          >
            Smith &amp; Sons
          </p>
          <h1
            className="aw-font-heading mt-4 text-3xl font-extrabold uppercase leading-[1.1] tracking-tight text-balance md:text-5xl"
            style={{ color: "var(--aw-apply-heading)" }}
          >
            Awards Criteria
          </h1>
          <p
            className="aw-font-heading mt-4 text-sm font-bold uppercase tracking-[0.15em]"
            style={{ color: "var(--aw-apply-eyebrow)" }}
          >
            The cut-off for award applications is the {KEY_INFO.dueDate}
          </p>
          <p
            className="mt-5 max-w-2xl text-[0.975rem] leading-relaxed"
            style={{ color: "var(--aw-apply-body)" }}
          >
            Select an award to view its judging criteria and submit an entry.
          </p>
        </div>
      </header>

      <main
        className="relative isolate flex-1 overflow-hidden py-16 md:py-20"
        style={{ backgroundColor: "var(--aw-criteria-bg)" }}
      >
        {theme.criteriaDecor ? <FlakeDecor /> : null}
        {theme.snow ? (
          <Snowfall count={theme.snow.criteria} seed={23} tone="dark" />
        ) : null}

        <div className="relative mx-auto w-full max-w-[980px] px-6">
          <section aria-labelledby="key-information-heading" className="mb-14">
            <h2
              id="key-information-heading"
              className="aw-font-heading text-2xl font-extrabold uppercase tracking-tight md:text-3xl"
              style={{ color: "var(--aw-criteria-title)" }}
            >
              2027 Award Entries
            </h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {KEY_INFO_ITEMS.map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex h-full flex-col gap-3 border px-6 py-5 backdrop-blur-xl"
                  style={{
                    backgroundColor: "var(--aw-criteria-glass)",
                    borderColor: "var(--aw-criteria-glass-border)",
                    borderRadius: "var(--aw-radius)",
                  }}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-6"
                    strokeWidth={1.5}
                    style={{ color: "var(--aw-criteria-eyebrow)" }}
                  />
                  <span
                    className="aw-font-heading text-xs font-bold uppercase tracking-[0.2em]"
                    style={{ color: "var(--aw-criteria-eyebrow)" }}
                  >
                    {label}
                  </span>
                  <span
                    className="text-base font-semibold leading-snug text-pretty"
                    style={{ color: "var(--aw-criteria-title)" }}
                  >
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {AWARD_GROUPS.map((group, index) => (
            <section
              key={group.label}
              className={index > 0 ? "mt-12" : undefined}
            >
              <h2
                className="aw-font-heading text-sm font-bold uppercase tracking-[0.25em]"
                style={{ color: "var(--aw-criteria-eyebrow)" }}
              >
                {group.label}
              </h2>
              <ul className="mt-5 grid gap-4 md:grid-cols-2">
                {group.awards.map((award) => (
                  <li key={award.slug}>
                    <Link
                      href={`/awards/${award.slug}`}
                      className="flex h-full flex-col justify-between gap-3 border px-6 py-5 backdrop-blur-xl transition-colors hover:brightness-105"
                      style={{
                        backgroundColor: "var(--aw-criteria-glass)",
                        borderColor: "var(--aw-criteria-glass-border)",
                        borderRadius: "var(--aw-radius)",
                      }}
                    >
                      <span
                        className="aw-font-heading text-base font-bold uppercase leading-snug tracking-wide text-pretty"
                        style={{ color: "var(--aw-criteria-title)" }}
                      >
                        {award.title}
                      </span>
                      <span
                        className="aw-font-heading text-xs font-bold uppercase tracking-[0.2em]"
                        style={{ color: "var(--aw-criteria-eyebrow)" }}
                      >
                        {award.needsForm ? "Application required" : "Automatic entry"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
