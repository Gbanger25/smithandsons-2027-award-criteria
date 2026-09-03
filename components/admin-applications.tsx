"use client"

import { useState, useTransition } from "react"
import { ChevronDown, Loader2, Trash2 } from "lucide-react"

import { removeApplication } from "@/lib/admin-actions"
import type { Application } from "@/lib/entries"

function formatDate(iso: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function ApplicationRow({
  application,
  awardSlug,
}: {
  application: Application
  awardSlug: string
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function destroy() {
    if (
      !window.confirm(
        `Delete the application from ${application.office}? This also removes its photos and can't be undone.`,
      )
    ) {
      return
    }
    setError(null)
    setBusy(true)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("awardSlug", awardSlug)
      formData.set("sk", application.sk)
      const result = await removeApplication(formData)
      setBusy(false)
      if (!result.ok) setError(result.error ?? "Something went wrong.")
    })
  }

  return (
    <li
      className="flex flex-col border px-4 py-4"
      style={{
        borderColor: "var(--aw-criteria-glass-border)",
        borderRadius: "var(--aw-radius)",
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className="aw-font-heading text-sm font-bold uppercase tracking-wide"
            style={{ color: "var(--aw-criteria-title)" }}
          >
            {application.office}
          </span>
          <span className="text-xs" style={{ color: "var(--aw-body)" }}>
            {application.state} · {application.images.length}{" "}
            {application.images.length === 1 ? "photo" : "photos"}
            {formatDate(application.createdAt)
              ? ` · ${formatDate(application.createdAt)}`
              : ""}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="aw-font-heading inline-flex items-center gap-1.5 border px-3.5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em]"
            style={{
              borderColor: "var(--aw-criteria-glass-border)",
              color: "var(--aw-body)",
              borderRadius: "var(--aw-button-radius)",
            }}
          >
            <ChevronDown
              className="size-3 shrink-0 transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
              aria-hidden="true"
            />
            {open ? "Hide" : "View"}
          </button>

          {busy ? (
            <Loader2
              className="size-4 animate-spin"
              style={{ color: "var(--aw-criteria-eyebrow)" }}
              aria-label="Saving"
            />
          ) : null}

          <button
            type="button"
            onClick={destroy}
            disabled={busy}
            aria-label={`Delete application from ${application.office}`}
            className="inline-flex items-center justify-center border p-2 disabled:opacity-60"
            style={{
              borderColor: "var(--aw-note-border)",
              color: "var(--aw-note-text)",
              borderRadius: "var(--aw-button-radius)",
            }}
          >
            <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 border-l-4 py-2 pl-4 text-sm font-semibold"
          style={{
            borderColor: "var(--aw-note-border)",
            color: "var(--aw-note-text)",
          }}
        >
          {error}
        </p>
      ) : null}

      {open ? (
        <div className="mt-4 flex flex-col gap-4">
          <p
            className="aw-font-body max-w-[70ch] whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: "var(--aw-body)" }}
          >
            {application.details}
          </p>

          {application.images.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {application.images.map((image) => (
                <a
                  key={image.url}
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.name}
                    className="h-24 w-32 object-cover"
                    style={{ borderRadius: "var(--aw-radius)" }}
                  />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export function AdminApplications({
  awardSlug,
  title,
  applications,
}: {
  awardSlug: string
  title: string
  applications: Application[]
}) {
  return (
    <section
      className="border px-6 py-6 backdrop-blur-xl"
      style={{
        backgroundColor: "var(--aw-criteria-glass)",
        borderColor: "var(--aw-criteria-glass-border)",
        borderRadius: "var(--aw-radius)",
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          className="aw-font-heading text-base font-bold uppercase leading-snug tracking-wide"
          style={{ color: "var(--aw-criteria-title)" }}
        >
          {title}
        </h2>
        <p
          className="aw-font-heading text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--aw-criteria-eyebrow)" }}
        >
          {applications.length}{" "}
          {applications.length === 1 ? "application" : "applications"}
        </p>
      </div>

      {applications.length === 0 ? (
        <p className="mt-4 text-sm italic" style={{ color: "var(--aw-body)" }}>
          No applications submitted yet.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {applications.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              awardSlug={awardSlug}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
