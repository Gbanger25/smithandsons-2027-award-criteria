"use client"

import { useState, useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { resetAllData } from "@/lib/admin-actions"

const CONFIRM_WORD = "DELETE"

export function AdminReset() {
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const confirmed = confirm === CONFIRM_WORD

  return (
    <form
      className="flex flex-col gap-4 border px-6 py-5"
      style={{
        backgroundColor: "var(--aw-criteria-glass)",
        borderColor: "var(--aw-note-border)",
        borderRadius: "var(--aw-radius)",
      }}
      onSubmit={(event) => {
        event.preventDefault()
        if (!confirmed) return
        setError(null)
        setMessage(null)
        const formData = new FormData(event.currentTarget)
        startTransition(async () => {
          const result = await resetAllData(formData)
          if (result.ok) {
            setMessage(result.message)
            setConfirm("")
          } else {
            setError(result.error)
          }
        })
      }}
    >
      <div>
        <h2
          className="aw-font-heading text-lg font-extrabold uppercase tracking-[0.16em]"
          style={{ color: "var(--aw-criteria-title)" }}
        >
          Reset All Entries &amp; Votes
        </h2>
        <p
          className="mt-2 max-w-2xl text-sm leading-relaxed"
          style={{ color: "var(--aw-body)" }}
        >
          Permanently deletes every People&apos;s Choice entry, every vote, every
          award application, and all of their uploaded photos. This cannot be
          undone. Type <strong>{CONFIRM_WORD}</strong> to confirm.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <label
            className="aw-font-heading mb-2 block text-xs font-bold uppercase tracking-[0.14em]"
            style={{ color: "var(--aw-criteria-eyebrow)" }}
            htmlFor="reset-confirm"
          >
            Confirmation
          </label>
          <input
            id="reset-confirm"
            name="confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={CONFIRM_WORD}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="aw-font-body w-full appearance-none border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--aw-field-focus)] focus:ring-2 focus:ring-[var(--aw-field-focus)]/25"
            style={{
              backgroundColor: "var(--aw-field)",
              borderColor: "var(--aw-field-border)",
              color: "var(--aw-field-text)",
              borderRadius: "var(--aw-radius)",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!confirmed || isPending}
          className="aw-font-heading inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: "var(--aw-note-border)",
            color: "#ffffff",
            borderRadius: "var(--aw-button-radius)",
          }}
        >
          {isPending ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          {isPending ? "Resetting…" : "Reset All Entries and Votes"}
        </button>
      </div>

      {message ? (
        <p
          role="status"
          className="text-sm font-semibold"
          style={{ color: "var(--aw-criteria-title)" }}
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="text-sm font-semibold"
          style={{ color: "var(--aw-note-text)" }}
        >
          {error}
        </p>
      ) : null}
    </form>
  )
}
