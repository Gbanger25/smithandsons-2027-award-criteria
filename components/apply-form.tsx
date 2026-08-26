"use client"

import { useEffect, useState } from "react"
import { STATES } from "@/lib/awards"

const OFFICE_LIST_URL = "/offices.txt"

const fieldClass =
  "aw-font-body w-full appearance-none border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--aw-field-focus)] focus:ring-2 focus:ring-[var(--aw-field-focus)]/25"

const fieldStyle = {
  backgroundColor: "var(--aw-field)",
  borderColor: "var(--aw-field-border)",
  color: "var(--aw-field-text)",
  borderRadius: "var(--aw-radius)",
}

const labelClass =
  "aw-font-heading mb-2 block text-xs font-bold uppercase tracking-[0.14em]"

const labelStyle = { color: "var(--aw-apply-label)" }

export function ApplyForm({ awardTitle }: { awardTitle: string }) {
  const [offices, setOffices] = useState<string[]>([])
  const [officeStatus, setOfficeStatus] = useState<
    "loading" | "ready" | "error"
  >("loading")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadOffices() {
      try {
        const res = await fetch(OFFICE_LIST_URL, { cache: "no-store" })
        if (!res.ok) throw new Error(`Office list responded ${res.status}`)
        const text = await res.text()
        const list = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !line.startsWith("#"))
        if (cancelled) return
        setOffices(list)
        setOfficeStatus("ready")
      } catch (error) {
        console.log("[v0] Failed to load office list:", error)
        if (!cancelled) setOfficeStatus("error")
      }
    }

    loadOffices()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <form
      name="award-application"
      className="mt-10 flex flex-col gap-6"
      onSubmit={(event) => {
        // Submission handler is wired up when the hosting form backend is connected.
        event.preventDefault()
        setSubmitted(true)
      }}
    >
      <input type="hidden" name="award" value={awardTitle} />

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          <label className={labelClass} style={labelStyle} htmlFor="state">
            State / Country
          </label>
          <select
            id="state"
            name="state"
            required
            className={fieldClass}
            style={fieldStyle}
            defaultValue=""
          >
            <option value="" disabled>
              Select state or country
            </option>
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className={labelClass} style={labelStyle} htmlFor="office">
            Franchisee Office Name
          </label>
          <select
            id="office"
            name="office"
            required
            disabled={officeStatus !== "ready"}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-70`}
            style={fieldStyle}
            defaultValue=""
          >
            <option value="" disabled>
              {officeStatus === "loading"
                ? "Loading offices…"
                : officeStatus === "error"
                  ? "Office list unavailable"
                  : "Select your office"}
            </option>
            {offices.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} style={labelStyle} htmlFor="details">
          Application Details
        </label>
        <textarea
          id="details"
          name="details"
          rows={7}
          required
          className={`${fieldClass} resize-y leading-relaxed`}
          style={fieldStyle}
          placeholder="Tell us about the nomination against the criteria above."
        />
      </div>

      <div>
        <label className={labelClass} style={labelStyle} htmlFor="files">
          Supporting Images
        </label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
          className="aw-font-body w-full cursor-pointer border border-dashed px-4 py-3 text-sm file:mr-4 file:cursor-pointer file:rounded-[var(--aw-button-radius)] file:border-0 file:bg-[var(--aw-file-bg)] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-[var(--aw-file-fg)]"
          style={fieldStyle}
        />
        <p
          className="mt-2 text-xs"
          style={{ color: "var(--aw-apply-body)" }}
        >
          jpg, jpeg, png or gif. Maximum 15MB per file, 15 files total.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="aw-font-heading bg-[var(--aw-button-bg)] px-9 py-4 text-xs font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[var(--aw-button-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aw-button-bg)]"
          style={{
            color: "var(--aw-button-fg)",
            borderRadius: "var(--aw-button-radius)",
          }}
        >
          Submit Application
        </button>
        {submitted && (
          <p
            role="status"
            className="text-sm font-medium"
            style={{ color: "var(--aw-apply-heading)" }}
          >
            Thanks — your application has been recorded.
          </p>
        )}
      </div>
    </form>
  )
}
