"use server"

import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"

import type { ActionResult } from "@/lib/actions"
import {
  checkPasscode,
  endAdminSession,
  isAdmin,
  startAdminSession,
} from "@/lib/admin-auth"
import {
  type EntryStatus,
  deleteApplication,
  deleteEntry,
  deleteRows,
  getApplications,
  getCategoryData,
  loadAllAwardRows,
  setEntryStatus,
} from "@/lib/entries"
import {
  APPLICATION_AWARDS,
  VOTING_CATEGORY_SLUGS,
  isApplicationAward,
  isVotingCategory,
} from "@/lib/voting"

export async function login(formData: FormData): Promise<ActionResult> {
  const submitted = String(formData.get("passcode") ?? "")

  if (!checkPasscode(submitted)) {
    return { ok: false, error: "Incorrect passcode." }
  }

  await startAdminSession()
  revalidatePath("/admin")
  return { ok: true, message: "Signed in." }
}

export async function logout(): Promise<void> {
  await endAdminSession()
  revalidatePath("/admin")
}

const VALID_STATUSES: EntryStatus[] = ["pending", "approved", "hidden"]

export async function moderateEntry(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Not signed in." }
  }

  const categorySlug = String(formData.get("categorySlug") ?? "")
  const sk = String(formData.get("sk") ?? "")
  const status = String(formData.get("status") ?? "") as EntryStatus

  if (!isVotingCategory(categorySlug) || !sk) {
    return { ok: false, error: "Unknown entry." }
  }
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Unknown status." }
  }

  try {
    await setEntryStatus({ categorySlug, sk, status })
  } catch (error) {
    console.log("[v0] Moderation failed:", error)
    return { ok: false, error: "Couldn't update that entry." }
  }

  revalidatePath("/admin")
  revalidatePath(`/vote/${categorySlug}`)
  return { ok: true, message: `Entry marked ${status}.` }
}

export async function removeEntry(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Not signed in." }
  }

  const categorySlug = String(formData.get("categorySlug") ?? "")
  const sk = String(formData.get("sk") ?? "")

  if (!isVotingCategory(categorySlug) || !sk) {
    return { ok: false, error: "Unknown entry." }
  }

  try {
    // Clean up the uploaded photos so deleting an entry doesn't orphan blobs.
    const data = await getCategoryData(categorySlug)
    const entry = data.entries.find((item) => item.sk === sk)
    const urls = entry?.images.map((image) => image.url) ?? []
    if (urls.length > 0) {
      await del(urls).catch((error) => {
        console.log("[v0] Blob cleanup failed:", error)
      })
    }

    await deleteEntry({ categorySlug, sk })
  } catch (error) {
    console.log("[v0] Entry delete failed:", error)
    return { ok: false, error: "Couldn't delete that entry." }
  }

  revalidatePath("/admin")
  revalidatePath(`/vote/${categorySlug}`)
  return { ok: true, message: "Entry deleted." }
}

export async function removeApplication(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Not signed in." }
  }

  const awardSlug = String(formData.get("awardSlug") ?? "")
  const sk = String(formData.get("sk") ?? "")

  if (!isApplicationAward(awardSlug) || !sk) {
    return { ok: false, error: "Unknown application." }
  }

  try {
    // Clean up any uploaded photos so deleting doesn't orphan blobs.
    const applications = await getApplications(awardSlug)
    const application = applications.find((item) => item.sk === sk)
    const urls = application?.images.map((image) => image.url) ?? []
    if (urls.length > 0) {
      await del(urls).catch((error) => {
        console.log("[v0] Blob cleanup failed:", error)
      })
    }

    await deleteApplication({ awardSlug, sk })
  } catch (error) {
    console.log("[v0] Application delete failed:", error)
    return { ok: false, error: "Couldn't delete that application." }
  }

  revalidatePath("/admin")
  return { ok: true, message: "Application deleted." }
}

/**
 * Wipes every People's Choice entry and vote, every judged-award application,
 * and all their Blob photos. Intended to clear seed/test data once, before the
 * real cycle — the typed "DELETE" is re-checked here, not just in the UI.
 */
export async function resetAllData(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Not signed in." }
  }

  if (String(formData.get("confirm") ?? "") !== "DELETE") {
    return { ok: false, error: 'Type DELETE to confirm the reset.' }
  }

  let removedRows = 0
  let removedPhotos = 0

  try {
    const { rows, imageUrls } = await loadAllAwardRows({
      categorySlugs: VOTING_CATEGORY_SLUGS,
      awardSlugs: APPLICATION_AWARDS.map((award) => award.slug),
    })

    // Photos first: if Blob fails we stop before dropping the rows that point
    // at them, so nothing is orphaned and the reset can simply be retried.
    for (let i = 0; i < imageUrls.length; i += 100) {
      const batch = imageUrls.slice(i, i + 100)
      await del(batch)
      removedPhotos += batch.length
    }

    removedRows = await deleteRows(rows)
  } catch (error) {
    console.log("[v0] Reset failed:", error)
    return {
      ok: false,
      error: `Reset stopped partway (${removedPhotos} photos, ${removedRows} rows removed). Try again to finish.`,
    }
  }

  revalidatePath("/admin")
  revalidatePath("/vote", "layout")
  return {
    ok: true,
    message: `Reset complete. Removed ${removedRows} rows and ${removedPhotos} photos.`,
  }
}
