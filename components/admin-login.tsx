"use client"

import { useState, useTransition } from "react"
import { Loader2, Lock } from "lucide-react"

import { login } from "@/lib/admin-actions"

export function AdminLogin() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-5 border px-7 py-8 backdrop-blur-xl"
      style={{
        backgroundColor: "var(--aw-criteria-glass)",
        borderColor: "var(--aw-criteria-glass-border)",
        borderRadius: "var(--aw-radius)",
      }}
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        const formData = new FormData(event.currentTarget)
        startTransition(async () => {
          const result = await login(formData)
          if (!result.ok) setError(result.error)
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <Lock
          className="size-5"
          style={{ color: "var(--aw-criteria-eyebrow)" }}
          aria-hidden="true"
        />
        <h1
          className="aw-font-heading text-xl font-extrabold uppercase tracking-[0.12em]"
          style={{ color: "var(--aw-criteria-title)" }}
        >
          Awards Admin
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--aw-body)" }}>
          Enter the shared passcode to review entries and vote tallies.
        </p>
      </div>

      <div>
        <label
          className="aw-font-heading mb-2 block text-xs font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--aw-criteria-eyebrow)" }}
          htmlFor="passcode"
        >
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoComplete="current-password"
          className="aw-font-body w-full appearance-none border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--aw-field-focus)] focus:ring-2 focus:ring-[var(--aw-field-focus)]/25"
          style={{
            backgroundColor: "var(--aw-field)",
            borderColor: "var(--aw-field-border)",
            color: "var(--aw-field-text)",
            borderRadius: "var(--aw-radius)",
          }}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="text-sm font-semibold"
          style={{ color: "var(--aw-note-text)" }}
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="aw-font-heading inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[var(--aw-button-hover)] disabled:opacity-60"
        style={{
          backgroundColor: "var(--aw-button-bg)",
          color: "var(--aw-button-fg)",
          borderRadius: "var(--aw-button-radius)",
        }}
      >
        {isPending ? (
          <>
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
            Checking…
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  )
}
