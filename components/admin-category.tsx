"use client"

import { useState, useTransition } from "react"
import { Check, EyeOff, Loader2, Trash2 } from "lucide-react"

import { moderateEntry, removeEntry } from "@/lib/admin-actions"
import type { EntryStatus, Nominee } from "@/lib/entries"

const STATUS_LABEL: Record<EntryStatus, string> = {
  pending: "Pending",
  approved: "Live",
  hidden: "Hidden",
}

function StatusChip({ status }: { status: EntryStatus }) {
  return (
    <span
      className="aw-font-heading border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em]"
      style={{
        borderColor:
          status === "approved"
            ? "var(--aw-criteria-eyebrow)"
            : "var(--aw-criteria-glass-border)",
        color:
          status === "approved"
            ? "var(--aw-criteria-eyebrow)"
            : "var(--aw-body)",
        borderRadius: "var(--aw-radius)",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export function AdminCategory({
  categorySlug,
  title,
  entries,
  totalVotes,
}: {
  categorySlug: string
  title: string
  entries: Nominee[]
  totalVotes: number
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; error?: string }>, id: string) {
    setError(null)
    setBusy(id)
    startTransition(async () => {
      const result = await action()
      setBusy(null)
      if (!result.ok) setError(result.error ?? "Something went wrong.")
    })
  }

  function setStatus(entry: Nominee, status: EntryStatus) {
    run(async () => {
      const formData = new FormData()
      formData.set("categorySlug", categorySlug)
      formData.set("sk", entry.sk)
      formData.set("status", status)
      const result = await moderateEntry(formData)
      return result.ok ? { ok: true } : { ok: false, error: result.error }
    }, entry.id)
  }

  function destroy(entry: Nominee) {
    if (
      !window.confirm(
        `Delete "${entry.projectTitle}" from ${entry.office}? This also removes its photos and can't be undone.`,
      )
    ) {
      return
    }
    run(async () => {
      const formData = new FormData()
      formData.set("categorySlug", categorySlug)
      formData.set("sk", entry.sk)
      const result = await removeEntry(formData)
      return result.ok ? { ok: true } : { ok: false, error: result.error }
    }, entry.id)
  }

  const leaderVotes = entries[0]?.voteCount ?? 0

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
          {entries.length} {entries.length === 1 ? "entry" : "entries"} ·{" "}
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 border-l-4 py-2 pl-4 text-sm font-semibold"
          style={{
            borderColor: "var(--aw-note-border)",
            color: "var(--aw-note-text)",
          }}
        >
          {error}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-4 text-sm italic" style={{ color: "var(--aw-body)" }}>
          No entries submitted yet.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {entries.map((entry) => {
            const isBusy = busy === entry.id
            const share =
              totalVotes > 0 ? Math.round((entry.voteCount ?? 0) / totalVotes * 100) : 0

            return (
              <li
                key={entry.id}
                className="flex flex-col gap-3 border px-4 py-4 md:flex-row md:items-center"
                style={{
                  borderColor: "var(--aw-criteria-glass-border)",
                  borderRadius: "var(--aw-radius)",
                }}
              >
                {entry.images[0] ? (
                  <img
                    src={entry.images[0].url}
                    alt=""
                    className="h-16 w-24 shrink-0 object-cover"
                    style={{ borderRadius: "var(--aw-radius)" }}
                  />
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="aw-font-heading text-sm font-bold uppercase tracking-wide"
                      style={{ color: "var(--aw-criteria-title)" }}
                    >
                      {entry.projectTitle}
                    </span>
                    <StatusChip status={entry.status} />
                  </div>
                  <span className="text-xs" style={{ color: "var(--aw-body)" }}>
                    {entry.office} · {entry.state} · {entry.images.length}{" "}
                    {entry.images.length === 1 ? "photo" : "photos"}
                  </span>

                  {/* Tally bar — width is relative to the current leader. */}
                  <div className="mt-1 flex items-center gap-3">
                    <div
                      className="h-1.5 w-32 overflow-hidden"
                      style={{
                        backgroundColor: "var(--aw-field)",
                        borderRadius: "999px",
                      }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width:
                            leaderVotes > 0
                              ? `${((entry.voteCount ?? 0) / leaderVotes) * 100}%`
                              : "0%",
                          backgroundColor: "var(--aw-criteria-eyebrow)",
                        }}
                      />
                    </div>
                    <span
                      className="aw-font-heading text-xs font-bold uppercase tracking-[0.14em]"
                      style={{ color: "var(--aw-criteria-eyebrow)" }}
                    >
                      {entry.voteCount ?? 0} {share > 0 ? `(${share}%)` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isBusy ? (
                    <Loader2
                      className="size-4 animate-spin"
                      style={{ color: "var(--aw-criteria-eyebrow)" }}
                      aria-label="Saving"
                    />
                  ) : null}

                  {entry.status !== "approved" ? (
                    <button
                      type="button"
                      onClick={() => setStatus(entry, "approved")}
                      disabled={isBusy}
                      className="aw-font-heading inline-flex items-center gap-1.5 px-3.5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[var(--aw-button-hover)] disabled:opacity-60"
                      style={{
                        backgroundColor: "var(--aw-button-bg)",
                        color: "var(--aw-button-fg)",
                        borderRadius: "var(--aw-button-radius)",
                      }}
                    >
                      <Check className="size-3 shrink-0" aria-hidden="true" />
                      Approve
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatus(entry, "hidden")}
                      disabled={isBusy}
                      className="aw-font-heading inline-flex items-center gap-1.5 border px-3.5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
                      style={{
                        borderColor: "var(--aw-criteria-glass-border)",
                        color: "var(--aw-body)",
                        borderRadius: "var(--aw-button-radius)",
                      }}
                    >
                      <EyeOff className="size-3 shrink-0" aria-hidden="true" />
                      Hide
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => destroy(entry)}
                    disabled={isBusy}
                    aria-label={`Delete ${entry.projectTitle}`}
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
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
