"use server"

import { revalidatePath } from "next/cache"

import {
  type EntryImage,
  castVote,
  createApplication,
  createEntry,
  getCategoryData,
  officeKey,
} from "@/lib/entries"
import { rememberOffice, resolveOffice } from "@/lib/offices"
import {
  MAX_UPLOAD_FILES,
  type UploadKind,
  uploadFolder,
} from "@/lib/upload-paths"
import { STATES, getAward } from "@/lib/awards"
import {
  ENTRIES_OPEN,
  BALLOT_OPEN,
  isApplicationAward,
  isVotingCategory,
} from "@/lib/voting"

export type ActionResult = { ok: true; message: string } | {
  ok: false
  error: string
}

const MAX_DETAILS = 8000

function blobStoreHost(): string | null {
  // Read-write tokens look like vercel_blob_rw_<storeId>_<secret>.
  const match = /^vercel_blob_rw_([a-z0-9]+)_/i.exec(
    process.env.BLOB_READ_WRITE_TOKEN ?? "",
  )
  return match ? `${match[1].toLowerCase()}.public.blob.vercel-storage.com` : null
}

/**
 * Photos are uploaded straight from the browser to Vercel Blob, so the action
 * only receives URLs. Accept them only if they point at this store and at the
 * folder for this award and office.
 */
function readUploadedImages(
  formData: FormData,
  kind: UploadKind,
  slug: string,
  office: string,
): { ok: true; images: EntryImage[] } | { ok: false; error: string } {
  const urls = formData.getAll("imageUrl").map(String)
  const names = formData.getAll("imageName").map(String)

  if (urls.length > MAX_UPLOAD_FILES) {
    return {
      ok: false,
      error: `Please attach no more than ${MAX_UPLOAD_FILES} images.`,
    }
  }
  if (names.length !== urls.length) {
    console.log(
      "[v0] Image check failed:",
      `name/url count mismatch (${names.length} names, ${urls.length} urls)`,
      urls.join(", "),
    )
    return {
      ok: false,
      error: `Your image details were incomplete (${names.length} names for ${urls.length} images). Please try again.`,
    }
  }

  const host = blobStoreHost()
  if (!host) {
    console.log("[v0] Image check failed:", "blob store host not configured", "")
    return {
      ok: false,
      error: "Image storage isn't configured on the server, so your images couldn't be checked. Please contact the awards team.",
    }
  }

  const folder = `/${uploadFolder(kind, slug, office)}`
  const images: EntryImage[] = []

  for (let index = 0; index < urls.length; index++) {
    const position = `image ${index + 1} of ${urls.length}`
    const reject = (reason: string, detail: string) => {
      console.log("[v0] Image check failed:", reason, urls[index])
      return {
        ok: false as const,
        error: `One of your images didn't upload correctly (${position}): ${detail}. Please try again.`,
      }
    }

    let url: URL
    let pathname: string
    try {
      url = new URL(urls[index])
      pathname = decodeURIComponent(url.pathname)
    } catch {
      return reject("unparseable url", "the upload address was invalid")
    }
    if (url.protocol !== "https:") {
      return reject("not https", "the upload address wasn't secure")
    }
    if (url.hostname !== host) {
      return reject(
        `wrong host (expected ${host}, got ${url.hostname})`,
        "it was stored in the wrong place",
      )
    }
    if (url.search || url.hash) {
      return reject("url has query or hash", "the upload address was altered")
    }
    if (pathname.includes("..")) {
      return reject("path contains ..", "the file path was invalid")
    }
    if (!pathname.startsWith(folder)) {
      return reject(
        `outside folder (expected ${folder}, got ${pathname})`,
        "it was filed under a different award or office",
      )
    }
    if (pathname.slice(folder.length).includes("/")) {
      return reject(
        `nested path under ${folder} (got ${pathname})`,
        "the file path was invalid",
      )
    }
    const name = names[index].trim().slice(0, 200) || "photo"
    images.push({ url: url.toString(), name })
  }

  return { ok: true, images }
}

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

  const uploaded = readUploadedImages(formData, "entries", categorySlug, office)
  if (!uploaded.ok) {
    return { ok: false, error: uploaded.error }
  }
  const images = uploaded.images

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
      error:
        "Your images uploaded, but we couldn't save your entry to the database. Please try again.",
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

  const uploaded = readUploadedImages(formData, "applications", awardSlug, office)
  if (!uploaded.ok) {
    return { ok: false, error: uploaded.error }
  }
  const images = uploaded.images

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
      error:
        "Your images uploaded, but we couldn't save your application to the database. Please try again.",
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

  if (!BALLOT_OPEN) {
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
