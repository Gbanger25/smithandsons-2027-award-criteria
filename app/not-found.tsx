import { FlakeDecor } from "@/components/flake-decor"
import { Snowfall } from "@/components/snowfall"
import { ACTIVE_THEME, themeVars } from "@/lib/theme"

/**
 * Also serves requests the proxy blocks for being on the wrong domain. It
 * deliberately doesn't name or link the other site, since the two are
 * distributed separately.
 */
export default function NotFound() {
  const theme = ACTIVE_THEME

  return (
    <div
      className="aw-font-body flex min-h-screen flex-col"
      style={themeVars(theme)}
    >
      <main
        className="relative isolate flex flex-1 items-center overflow-hidden py-20"
        style={{ backgroundColor: "var(--aw-apply-bg)" }}
      >
        {theme.applyDecor ? (
          <FlakeDecor color="var(--aw-apply-decor)" intensity={0.35} mirror />
        ) : null}
        {theme.snow ? <Snowfall count={theme.snow.apply} seed={73} /> : null}

        <div className="relative mx-auto w-full max-w-[1080px] px-6">
          <p
            className="aw-font-heading text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--aw-apply-eyebrow)" }}
          >
            404
          </p>
          <h1
            className="aw-font-heading mt-4 text-3xl font-extrabold uppercase tracking-[0.12em] text-balance md:text-5xl"
            style={{ color: "var(--aw-apply-heading)" }}
          >
            Page Not Found
          </h1>
          <p
            className="mt-5 max-w-xl text-[0.975rem] leading-relaxed text-pretty"
            style={{ color: "var(--aw-apply-body)" }}
          >
            This page isn&apos;t available at this address. Please check the link
            you were sent.
          </p>
        </div>
      </main>
    </div>
  )
}
