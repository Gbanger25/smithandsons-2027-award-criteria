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
  deleteEntry,
  getCategoryData,
  setEntryStatus,
} from "@/lib/entries"
import { isVotingCategory } from "@/lib/voting"

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
