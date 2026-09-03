"use server"

import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"

import {
  type EntryImage,
  castVote,
  createApplication,
  createEntry,
  getCategoryData,
  officeKey,
} from "@/lib/entries"
import { rememberOffice, resolveOffice } from "@/lib/offices"
import { STATES, getAward } from "@/lib/awards"
import {
  ENTRIES_OPEN,
  VOTING_OPEN,
  isApplicationAward,
  isVotingCategory,
} from "@/lib/voting"

export type ActionResult = { ok: true; message: string } | {
  ok: false
  error: string
}

const MAX_FILES = 15
const MAX_FILE_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"]
const MAX_DETAILS = 8000

/* ------------------------------------------------------------------ *
 * Entry submission
 * ------------------------------------------------------------------ */

export async function submitEntry(
  formData: FormData,
): Promise<ActionResult> {
  const categorySlug = String(formData.get("categorySlug") ?? "")

  if (!isVotingCategory(categorySlug)) {
    return { ok: false, error: "This award doesn't accept online entries." }
  }

  if (!ENTRIES_OPEN) {
    return {
      ok: false,
      error: "Entries for this award are closed.",
    }
  }

  // Office is validated against public/offices.txt — a <select> is trivially
  // editable client-side, so never trust the submitted value.
  const office = await resolveOffice(String(formData.get("office") ?? ""))
  if (!office) {
    return { ok: false, error: "Please choose your office from the list." }
  }

  const state = String(formData.get("state") ?? "")
  if (!(STATES as readonly string[]).includes(state)) {
    return { ok: false, error: "Please choose a valid state or country." }
  }

  const projectTitle = String(formData.get("projectTitle") ?? "").trim()
  if (projectTitle.length < 3) {
    return { ok: false, error: "Please give the project a name." }
  }
  if (projectTitle.length > 120) {
    return { ok: false, error: "Project name must be under 120 characters." }
  }

  const details = String(formData.get("details") ?? "").trim()
  if (details.length < 20) {
    return {
      ok: false,
      error: "Please describe the project against the criteria above.",
    }
  }
  if (details.length > MAX_DETAILS) {
    return { ok: false, error: "Application details are too long." }
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (files.length > MAX_FILES) {
    return { ok: false, error: `Please attach no more than ${MAX_FILES} images.` }
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { ok: false, error: `"${file.name}" is not a jpg, png or gif.` }
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `"${file.name}" is larger than 15MB.` }
    }
  }

  let images: EntryImage[] = []

  try {
    images = await Promise.all(
      files.map(async (file) => {
        const blob = await put(
          `entries/${categorySlug}/${officeKey(office)}/${file.name}`,
          file,
          { access: "public", addRandomSuffix: true },
        )
        return { url: blob.url, name: file.name }
      }),
    )
  } catch (error) {
    console.log("[v0] Entry image upload failed:", error)
    return {
      ok: false,
      error: "We couldn't upload your images. Please try again.",
    }
  }

  try {
    await createEntry({
      categorySlug,
      office,
      state,
      projectTitle,
      details,
      images,
    })
  } catch (error) {
    console.log("[v0] Entry save failed:", error)
    return {
      ok: false,
      error: "We couldn't save your entry. Please try again.",
    }
  }

  revalidatePath(`/vote/${categorySlug}`)
  revalidatePath("/admin")

  return {
    ok: true,
    message:
      "Thanks — your entry has been submitted and will appear once it's approved.",
  }
}

/* ------------------------------------------------------------------ *
 * Application submission (internally-judged awards)
 * ------------------------------------------------------------------ */

export async function submitApplication(
  formData: FormData,
): Promise<ActionResult> {
  const awardSlug = String(formData.get("awardSlug") ?? "")

  if (!isApplicationAward(awardSlug)) {
    return { ok: false, error: "This award doesn't accept online applications." }
  }

  const award = getAward(awardSlug)
  if (!award) {
    return { ok: false, error: "Unknown award." }
  }

  // Office is validated against public/offices.txt — never trust the submitted
  // value since a <select> is trivially editable client-side.
  const office = await resolveOffice(String(formData.get("office") ?? ""))
  if (!office) {
    return { ok: false, error: "Please choose your office from the list." }
  }

  const state = String(formData.get("state") ?? "")
  if (!(STATES as readonly string[]).includes(state)) {
    return { ok: false, error: "Please choose a valid state or country." }
  }

  const details = String(formData.get("details") ?? "").trim()
  if (details.length < 20) {
    return {
      ok: false,
      error: "Please describe the nomination against the criteria above.",
    }
  }
  if (details.length > MAX_DETAILS) {
    return { ok: false, error: "Application details are too long." }
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (files.length > MAX_FILES) {
    return { ok: false, error: `Please attach no more than ${MAX_FILES} images.` }
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { ok: false, error: `"${file.name}" is not a jpg, png or gif.` }
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `"${file.name}" is larger than 15MB.` }
    }
  }

  let images: EntryImage[] = []

  try {
    images = await Promise.all(
      files.map(async (file) => {
        const blob = await put(
          `applications/${awardSlug}/${officeKey(office)}/${file.name}`,
          file,
          { access: "public", addRandomSuffix: true },
        )
        return { url: blob.url, name: file.name }
      }),
    )
  } catch (error) {
    console.log("[v0] Application image upload failed:", error)
    return {
      ok: false,
      error: "We couldn't upload your images. Please try again.",
    }
  }

  try {
    await createApplication({
      awardSlug,
      awardTitle: award.title,
      office,
      state,
      details,
      images,
    })
  } catch (error) {
    console.log("[v0] Application save failed:", error)
    return {
      ok: false,
      error: "We couldn't save your application. Please try again.",
    }
  }

  revalidatePath("/admin")

  return {
    ok: true,
    message: "Thanks — your application has been submitted to the judging panel.",
  }
}

/* ------------------------------------------------------------------ *
 * Voting
 * ------------------------------------------------------------------ */

export async function submitVote(
  formData: FormData,
): Promise<ActionResult> {
  const categorySlug = String(formData.get("categorySlug") ?? "")
  const entryId = String(formData.get("entryId") ?? "")

  if (!isVotingCategory(categorySlug)) {
    return { ok: false, error: "Unknown award category." }
  }

  if (!VOTING_OPEN) {
    return { ok: false, error: "Voting is not open for this award." }
  }

  const office = await resolveOffice(String(formData.get("office") ?? ""))
  if (!office) {
    return { ok: false, error: "Please choose your office before voting." }
  }

  let data
  try {
    data = await getCategoryData(categorySlug)
  } catch (error) {
    console.log("[v0] Vote lookup failed:", error)
    return { ok: false, error: "We couldn't record your vote. Please retry." }
  }

  const target = data.entries.find(
    (entry) => entry.id === entryId && entry.status === "approved",
  )
  if (!target) {
    return { ok: false, error: "That entry is no longer available to vote for." }
  }

  // An office can't back its own project.
  if (officeKey(target.office) === officeKey(office)) {
    return { ok: false, error: "You can't vote for your own office's entry." }
  }

  try {
    await castVote({ categorySlug, office, entryId })
  } catch (error) {
    console.log("[v0] Vote save failed:", error)
    return { ok: false, error: "We couldn't record your vote. Please retry." }
  }

  // Remember the office so returning voters see which projects they've already
  // backed, and don't have to re-pick their office on every category.
  await rememberOffice(office)

  revalidatePath(`/vote/${categorySlug}`)
  revalidatePath("/admin")

  return { ok: true, message: `Your vote has been recorded for ${office}.` }
}
