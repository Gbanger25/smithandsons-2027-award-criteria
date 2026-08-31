"use client"

import { useState, useTransition } from "react"
import { Check, ChevronDown, ImageOff, Loader2 } from "lucide-react"

import { submitVote } from "@/lib/actions"
import type { EntryImage } from "@/lib/entries"

export type BallotNominee = {
  id: string
  office: string
  state: string
  projectTitle: string
  details: string
  images: EntryImage[]
  /** True when this nominee belongs to the office the visitor selected. */
  isOwnOffice: boolean
}

const labelClass =
  "aw-font-heading mb-2 block text-xs font-bold uppercase tracking-[0.14em]"

const fieldClass =
  "aw-font-body w-full appearance-none border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--aw-field-focus)] focus:ring-2 focus:ring-[var(--aw-field-focus)]/25"

const fieldStyle = {
  backgroundColor: "var(--aw-field)",
  borderColor: "var(--aw-field-border)",
  color: "var(--aw-field-text)",
  borderRadius: "var(--aw-radius)",
}

export function Ballot({
  categorySlug,
  nominees,
  offices,
  votingOpen,
  initialOffice = "",
  initialVotedFor = null,
}: {
  categorySlug: string
  nominees: Omit<BallotNominee, "isOwnOffice">[]
  offices: string[]
  votingOpen: boolean
  /** Office remembered from a previous vote, resolved on the server. */
  initialOffice?: string
  /** Entry this office already voted for in this category, if any. */
  initialVotedFor?: string | null
}) {
  const [office, setOffice] = useState(initialOffice)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [votedFor, setVotedFor] = useState<string | null>(initialVotedFor)
  const [selectedEntry, setSelectedEntry] = useState<string>(
    initialVotedFor ?? "",
  )
  const [isVoting, setIsVoting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const normalise = (value: string) => value.trim().toLowerCase()

  // An office can't vote for its own entry, so those are excluded from the
  // dropdown. Recomputes whenever the selected office changes.
  const votableNominees = nominees.filter(
    (nominee) =>
      office.length > 0 && normalise(nominee.office) !== normalise(office),
  )

  function handleVote(entryId: string) {
    setError(null)
    setMessage(null)

    if (!office) {
      setError("Please select your office before voting.")
      return
    }

    if (!entryId) {
      setError("Please select the entry you are voting for.")
      return
    }

    const formData = new FormData()
    formData.set("categorySlug", categorySlug)
    formData.set("entryId", entryId)
    formData.set("office", office)

    setIsVoting(true)
    startTransition(async () => {
      const result = await submitVote(formData)
      setIsVoting(false)
      if (result.ok) {
        setVotedFor(entryId)
        setMessage(result.message)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        className="flex flex-col gap-5 border px-6 py-5 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--aw-criteria-glass)",
          borderColor: "var(--aw-criteria-glass-border)",
          borderRadius: "var(--aw-radius)",
        }}
      >
        <div>
          <label
            className={labelClass}
            style={{ color: "var(--aw-criteria-eyebrow)" }}
            htmlFor="voter-office"
          >
            Your Office
          </label>
          <select
            id="voter-office"
            className={fieldClass}
            style={fieldStyle}
            value={office}
            onChange={(event) => {
              setOffice(event.target.value)
              // Switching office invalidates the previous confirmation and the
              // entry selection, since own-office options differ per office.
              setVotedFor(null)
              setSelectedEntry("")
              setMessage(null)
              setError(null)
            }}
          >
            <option value="">Select your office…</option>
            {offices.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {votingOpen ? (
          <div>
            <label
              className={labelClass}
              style={{ color: "var(--aw-criteria-eyebrow)" }}
              htmlFor="voter-entry"
            >
              Select The Entry You Are Voting For Below:*
            </label>
            <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
              <select
                id="voter-entry"
                className={`${fieldClass} md:flex-1`}
                style={fieldStyle}
                value={selectedEntry}
                disabled={!office}
                onChange={(event) => {
                  setSelectedEntry(event.target.value)
                  setError(null)
                }}
              >
                <option value="">
                  {office
                    ? "Select an entry…"
                    : "Select your office first…"}
                </option>
                {votableNominees.map((nominee) => (
                  <option key={nominee.id} value={nominee.id}>
                    {nominee.projectTitle} — {nominee.office}, {nominee.state}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleVote(selectedEntry)}
                disabled={isVoting || !office || !selectedEntry}
                className="aw-font-heading inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[var(--aw-button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: "var(--aw-button-bg)",
                  color: "var(--aw-button-fg)",
                  borderRadius: "var(--aw-button-radius)",
                }}
              >
                {isVoting ? (
                  <>
                    <Loader2
                      className="size-3.5 shrink-0 animate-spin"
                      aria-hidden="true"
                    />
                    Recording…
                  </>
                ) : votedFor ? (
                  "Update Vote"
                ) : (
                  "Submit Vote"
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {message ? (
        <p
          role="status"
          className="aw-font-heading border-l-4 py-2 pl-5 text-sm font-bold uppercase tracking-[0.12em]"
          style={{
            borderColor: "var(--aw-criteria-eyebrow)",
            color: "var(--aw-criteria-title)",
          }}
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="border-l-4 py-2 pl-5 text-sm font-semibold"
          style={{
            borderColor: "var(--aw-note-border)",
            color: "var(--aw-note-text)",
          }}
        >
          {error}
        </p>
      ) : null}

      <ul className="grid gap-5 md:grid-cols-2">
        {nominees.map((nominee) => {
          const isOwnOffice =
            office.length > 0 &&
            normalise(nominee.office) === normalise(office)
          const isOpen = expanded === nominee.id
          const isVoted = votedFor === nominee.id
          const cover = nominee.images[0]

          return (
            <li
              key={nominee.id}
              className="flex flex-col overflow-hidden border backdrop-blur-xl"
              style={{
                backgroundColor: "var(--aw-criteria-glass)",
                borderColor: isVoted
                  ? "var(--aw-criteria-eyebrow)"
                  : "var(--aw-criteria-glass-border)",
                borderRadius: "var(--aw-radius)",
                borderWidth: isVoted ? 2 : 1,
              }}
            >
              {cover ? (
                <img
                  src={cover.url}
                  alt={`${nominee.projectTitle} — submitted by ${nominee.office}`}
                  className="h-52 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                // Entries submitted without photos still need a deliberate
                // header — an empty block reads as a broken image.
                <div
                  className="flex h-20 w-full items-center justify-center gap-2 border-b"
                  style={{
                    backgroundColor: "var(--aw-field)",
                    borderColor: "var(--aw-criteria-glass-border)",
                  }}
                >
                  <ImageOff
                    className="size-4 shrink-0 opacity-60"
                    aria-hidden="true"
                    style={{ color: "var(--aw-criteria-eyebrow)" }}
                  />
                  <span
                    className="aw-font-heading text-[0.7rem] font-bold uppercase tracking-[0.18em] opacity-70"
                    style={{ color: "var(--aw-criteria-eyebrow)" }}
                  >
                    No photos supplied
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col gap-4 px-6 py-5">
                <div className="flex flex-col gap-1">
                  <h3
                    className="aw-font-heading text-base font-bold uppercase leading-snug tracking-wide text-pretty"
                    style={{ color: "var(--aw-criteria-title)" }}
                  >
                    {nominee.projectTitle}
                  </h3>
                  <p
                    className="aw-font-heading text-xs font-bold uppercase tracking-[0.18em]"
                    style={{ color: "var(--aw-criteria-eyebrow)" }}
                  >
                    {nominee.office} · {nominee.state}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : nominee.id)}
                  aria-expanded={isOpen}
                  aria-controls={`detail-${nominee.id}`}
                  className="aw-font-heading inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] underline-offset-4 hover:underline"
                  style={{ color: "var(--aw-criteria-heading)" }}
                >
                  {isOpen ? "Hide details" : "View full entry"}
                  <ChevronDown
                    className={`size-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen ? (
                  <div
                    id={`detail-${nominee.id}`}
                    className="flex flex-col gap-4 border-t pt-4"
                    style={{ borderColor: "var(--aw-criteria-glass-border)" }}
                  >
                    <p
                      className="whitespace-pre-line text-sm leading-relaxed"
                      style={{ color: "var(--aw-body)" }}
                    >
                      {nominee.details}
                    </p>

                    {nominee.images.length > 1 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {nominee.images.slice(1).map((image) => (
                          <img
                            key={image.url}
                            src={image.url}
                            alt={`${nominee.projectTitle} — ${image.name}`}
                            className="h-20 w-full object-cover"
                            style={{ borderRadius: "var(--aw-radius)" }}
                            loading="lazy"
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {votingOpen && (isVoted || isOwnOffice) ? (
                  <div className="mt-auto pt-2">
                    {isVoted ? (
                      <p
                        className="aw-font-heading inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]"
                        style={{ color: "var(--aw-criteria-eyebrow)" }}
                      >
                        <Check className="size-3.5 shrink-0" aria-hidden="true" />
                        Your vote
                      </p>
                    ) : (
                      <p
                        className="text-xs font-semibold italic"
                        style={{ color: "var(--aw-note-text)" }}
                      >
                        This is your office&apos;s entry — you can&apos;t vote
                        for it.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
