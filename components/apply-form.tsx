"use client"

import { useEffect, useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

import { submitApplication, submitEntry } from "@/lib/actions"
import { STATES } from "@/lib/awards"
import {
  type PreparedPhoto,
  formatMegabytes,
  preparePhoto,
} from "@/lib/resize-image"
import {
  MAX_UPLOAD_FILES,
  safeFileName,
  uploadFolder,
} from "@/lib/upload-paths"

const OFFICE_LIST_URL = "/offices.txt"
const UPLOAD_CONCURRENCY = 3

// Mirror the server-side limits in lib/actions.ts so bad input is caught
// before any photo is uploaded.
const MIN_TITLE = 3
const MAX_TITLE = 120
const MIN_DETAILS = 20
const MAX_DETAILS = 8000

type Progress = { done: number; total: number }

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

export function ApplyForm({
  awardTitle,
  /**
   * Set for the nine People's Choice categories. When present the form stores
   * the entry so it can appear on that category's ballot.
   */
  categorySlug,
  /**
   * Set for internally-judged awards. When present the form stores a written
   * application for the judging panel (no ballot, no public listing).
   */
  awardSlug,
}: {
  awardTitle: string
  categorySlug?: string
  awardSlug?: string
}) {
  const [offices, setOffices] = useState<string[]>([])
  const [officeStatus, setOfficeStatus] = useState<
    "loading" | "ready" | "error"
  >("loading")
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [photos, setPhotos] = useState<PreparedPhoto[]>([])
  const [optimising, setOptimising] = useState<Progress | null>(null)
  const [uploading, setUploading] = useState<Progress | null>(null)
  const [detailsLength, setDetailsLength] = useState(0)
  const optimiseRun = useRef(0)
  const formRef = useRef<HTMLFormElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  // On a phone the message lands below the fold, so bring it into view.
  useEffect(() => {
    if (!error && !submitted) return
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [error, submitted])

  const storesEntry = Boolean(categorySlug)
  const storesApplication = Boolean(awardSlug)
  // Both stored paths hit the server; only the truly backend-less awards
  // (none, currently) fall back to the local confirmation.
  const storesRemotely = storesEntry || storesApplication

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

  async function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.currentTarget.files ?? [])
    const runId = ++optimiseRun.current
    setError(null)
    setPhotos([])

    if (chosen.length === 0) {
      setOptimising(null)
      return
    }
    if (chosen.length > MAX_UPLOAD_FILES) {
      setOptimising(null)
      setError(`Please attach no more than ${MAX_UPLOAD_FILES} images.`)
      return
    }

    const prepared: PreparedPhoto[] = []
    setOptimising({ done: 0, total: chosen.length })
    // One at a time keeps peak memory low on phones.
    for (const file of chosen) {
      const photo = await preparePhoto(file)
      if (runId !== optimiseRun.current) return
      prepared.push(photo)
      setPhotos([...prepared])
      setOptimising({ done: prepared.length, total: chosen.length })
    }
    setOptimising(null)
  }

  async function uploadPhotos(office: string) {
    const kind = storesEntry ? "entries" : "applications"
    const slug = (storesEntry ? categorySlug : awardSlug) as string
    const folder = uploadFolder(kind, slug, office)
    const results: { url: string; name: string }[] = new Array(photos.length)
    let next = 0
    let done = 0
    setUploading({ done: 0, total: photos.length })

    async function worker() {
      while (next < photos.length) {
        const index = next++
        const { file, originalName } = photos[index]
        const blob = await upload(`${folder}${safeFileName(file.name)}`, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
          clientPayload: JSON.stringify({ office }),
          contentType: file.type,
        })
        results[index] = { url: blob.url, name: originalName }
        setUploading({ done: ++done, total: photos.length })
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, photos.length) }, worker),
    )
    return results
  }

  function validateFields(formData: FormData): string | null {
    const state = String(formData.get("state") ?? "")
    if (!(STATES as readonly string[]).includes(state)) {
      return "Please choose a valid state or country."
    }

    const office = String(formData.get("office") ?? "")
    if (!office || !offices.includes(office)) {
      return "Please choose your office from the list."
    }

    if (storesEntry) {
      const projectTitle = String(formData.get("projectTitle") ?? "").trim()
      if (projectTitle.length < MIN_TITLE) {
        return "Please give the project a name."
      }
      if (projectTitle.length > MAX_TITLE) {
        return "Project name must be under 120 characters."
      }
    }

    const details = String(formData.get("details") ?? "").trim()
    if (details.length < MIN_DETAILS) {
      return storesEntry
        ? "Please describe the project against the criteria above."
        : "Please describe the nomination against the criteria above."
    }
    if (details.length > MAX_DETAILS) {
      return "Application details are too long."
    }

    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    // Any award with no storage target keeps the original local confirmation.
    if (!storesRemotely) {
      setSubmitted(true)
      return
    }

    if (optimising) {
      setError("Please wait until your photos have finished optimising.")
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.delete("files")
    const office = String(formData.get("office") ?? "")

    const validationError = validateFields(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    try {
      try {
        const uploaded = await uploadPhotos(office)
        for (const image of uploaded) {
          formData.append("imageUrl", image.url)
          formData.append("imageName", image.name)
        }
      } catch (uploadError) {
        console.log("[v0] Photo upload failed:", uploadError)
        setError("We couldn't upload your images. Please try again.")
        return
      } finally {
        setUploading(null)
      }

      const result = storesEntry
        ? await submitEntry(formData)
        : await submitApplication(formData)
      if (result.ok) {
        setMessage(result.message)
        setSubmitted(true)
        form.reset()
        setPhotos([])
        setDetailsLength(0)
      } else {
        setError(result.error)
      }
    } catch (submitError) {
      console.log("[v0] Submission failed:", submitError)
      setError("We couldn't save your entry. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const totalBytes = photos.reduce((sum, photo) => sum + photo.file.size, 0)

  return (
    <form
      ref={formRef}
      name="award-application"
      className="mt-10 flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="award" value={awardTitle} />
      {categorySlug ? (
        <input type="hidden" name="categorySlug" value={categorySlug} />
      ) : null}
      {awardSlug ? (
        <input type="hidden" name="awardSlug" value={awardSlug} />
      ) : null}

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          <label className={labelClass} style={labelStyle} htmlFor="state">
            State / Country
          </label>
          <select
            id="state"
            name="state"
            required
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-70`}
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

      {storesEntry ? (
        <div>
          <label
            className={labelClass}
            style={labelStyle}
            htmlFor="projectTitle"
          >
            Project Name
          </label>
          <input
            id="projectTitle"
            name="projectTitle"
            type="text"
            required
            minLength={MIN_TITLE}
            maxLength={MAX_TITLE}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-70`}
            style={fieldStyle}
            placeholder="e.g. Hillside Kitchen Renovation"
          />
          <p className="mt-2 text-xs" style={{ color: "var(--aw-apply-body)" }}>
            This is the name voters will see on the ballot.
          </p>
        </div>
      ) : null}

      <div>
        <label className={labelClass} style={labelStyle} htmlFor="details">
          Application Details
        </label>
        <textarea
          id="details"
          name="details"
          rows={7}
          required
          minLength={MIN_DETAILS}
          maxLength={MAX_DETAILS}
          aria-describedby="details-count"
          onChange={(event) =>
            setDetailsLength(event.currentTarget.value.trim().length)
          }
          className={`${fieldClass} resize-y leading-relaxed disabled:cursor-not-allowed disabled:opacity-70`}
          style={fieldStyle}
          placeholder="Tell us about the nomination against the criteria above."
        />
        <p
          id="details-count"
          aria-live="polite"
          className="mt-2 text-xs"
          style={{ color: "var(--aw-apply-body)" }}
        >
          {detailsLength >= MIN_DETAILS
            ? `✓ ${MIN_DETAILS}+ characters`
            : `At least ${MIN_DETAILS} characters (${detailsLength} so far)`}
        </p>
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
          onChange={handleFilesChange}
          disabled={busy}
          aria-describedby="files-help files-status"
          className="aw-font-body w-full cursor-pointer border border-dashed px-4 py-3 text-sm file:mr-4 file:cursor-pointer file:rounded-[var(--aw-button-radius)] file:border-0 file:bg-[var(--aw-file-bg)] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-[var(--aw-file-fg)] disabled:cursor-not-allowed disabled:opacity-70"
          style={fieldStyle}
        />
        <p
          id="files-help"
          className="mt-2 text-xs"
          style={{ color: "var(--aw-apply-body)" }}
        >
          {
            "jpg, jpeg, png or gif. Up to 15 photos. Large photos are resized automatically before upload, so there's no need to shrink them first."
          }
          {storesEntry
            ? " The first image is used as the ballot cover photo."
            : ""}
        </p>
        <div
          id="files-status"
          aria-live="polite"
          className="aw-font-body mt-3 flex flex-col gap-1 text-xs"
          style={{ color: "var(--aw-apply-body)" }}
        >
          {optimising ? (
            <p className="flex items-center gap-2 font-semibold">
              <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" />
              {`Optimising photos… ${optimising.done} of ${optimising.total}`}
            </p>
          ) : null}
          {photos.length > 0 ? (
            <ul className="flex flex-col gap-0.5">
              {photos.map((photo, index) => (
                <li key={`${photo.originalName}-${index}`} className="break-all">
                  {photo.changed
                    ? `${photo.originalName}: ${formatMegabytes(photo.originalSize)} → ${formatMegabytes(photo.file.size)}`
                    : `${photo.originalName}: ${formatMegabytes(photo.originalSize)} (unchanged)`}
                </li>
              ))}
            </ul>
          ) : null}
          {!optimising && photos.length > 0 ? (
            <p className="font-semibold" style={{ color: "var(--aw-apply-heading)" }}>
              {`${photos.length} ${photos.length === 1 ? "photo" : "photos"} ready to upload: ${formatMegabytes(totalBytes)} in total`}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="aw-font-heading inline-flex items-center gap-2 bg-[var(--aw-button-bg)] px-9 py-4 text-xs font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[var(--aw-button-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aw-button-bg)] disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            color: "var(--aw-button-fg)",
            borderRadius: "var(--aw-button-radius)",
          }}
        >
          {busy ? (
            <>
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              {uploading
                ? `Uploading photos… ${uploading.done} of ${uploading.total}`
                : "Submitting…"}
            </>
          ) : (
            "Submit Application"
          )}
        </button>

        {submitted && !error ? (
          <div
            ref={feedbackRef}
            role="status"
            className="aw-font-body flex w-full scroll-mt-6 items-start gap-3 px-4 py-3 text-sm font-bold leading-relaxed"
            style={{
              backgroundColor: "#ffffff",
              color: "#0c5a4f",
              borderRadius: "var(--aw-radius)",
            }}
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 break-words">
              {message ?? "Thanks — your application has been recorded."}
            </p>
          </div>
        ) : null}

        {submitted && !error ? (
          <Link
            href="/"
            className="group inline-flex w-full items-center justify-center gap-2 border border-white bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-[var(--aw-button-hover)] hover:text-[var(--aw-button-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-fit"
            style={{ borderRadius: "var(--aw-button-radius)" }}
          >
            <ArrowLeft
              className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            Back to All Awards
          </Link>
        ) : null}

        {error ? (
          <div
            ref={feedbackRef}
            role="alert"
            className="aw-font-body flex w-full scroll-mt-6 items-start gap-3 px-4 py-3 text-sm font-bold leading-relaxed"
            style={{
              backgroundColor: "var(--aw-form-error-bg)",
              color: "var(--aw-form-error-text)",
              borderRadius: "var(--aw-radius)",
            }}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 break-words">{error}</p>
          </div>
        ) : null}
      </div>
    </form>
  )
}
