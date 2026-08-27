import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"
import { cookies } from "next/headers"

const OFFICE_FILE = path.join(process.cwd(), "public", "offices.txt")

const OFFICE_COOKIE = "ss_awards_office"

/**
 * Server-side copy of the office list. The client-side apply form still
 * fetches /offices.txt directly, but votes and entries have to be validated
 * against the list on the server — a select element is trivially editable.
 *
 * `public/offices.txt` stays the single editable source of truth. It is pulled
 * into the serverless bundle via `outputFileTracingIncludes` in next.config.
 */
export async function loadOffices(): Promise<string[]> {
  try {
    const text = await readFile(OFFICE_FILE, "utf8")
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
  } catch (error) {
    console.log("[v0] Failed to read office list:", error)
    return []
  }
}

/**
 * Resolves a submitted office name to its canonical spelling, or undefined if
 * it isn't a real office. Matching is case- and space-insensitive so a browser
 * autofill quirk doesn't reject a legitimate vote.
 */
export async function resolveOffice(
  submitted: string | undefined | null,
): Promise<string | undefined> {
  if (!submitted) return undefined
  const wanted = submitted.trim().toLowerCase()
  const offices = await loadOffices()
  return offices.find((office) => office.toLowerCase() === wanted)
}

/**
 * Stores the voter's office after a successful vote. This is a convenience
 * only — it is never trusted as identity. Every vote re-validates the office
 * against the list, and the vote itself is keyed by office in DynamoDB, so
 * clearing this cookie cannot buy an office a second vote.
 */
export async function rememberOffice(office: string): Promise<void> {
  const store = await cookies()
  store.set(OFFICE_COOKIE, office, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 120,
  })
}

/** Reads the remembered office, re-validating it against the current list. */
export async function getRememberedOffice(): Promise<string | undefined> {
  const store = await cookies()
  return resolveOffice(store.get(OFFICE_COOKIE)?.value)
}
