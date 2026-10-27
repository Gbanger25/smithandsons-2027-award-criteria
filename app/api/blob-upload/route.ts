import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"

import { resolveOffice } from "@/lib/offices"
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  uploadFolder,
  type UploadKind,
} from "@/lib/upload-paths"
import {
  ENTRIES_OPEN,
  isApplicationAward,
  isVotingCategory,
} from "@/lib/voting"

async function assertUploadAllowed(
  pathname: string,
  clientPayload: string | null,
) {
  const segments = pathname.split("/")
  if (segments.length !== 4 || segments.some((s) => !s || s === "..")) {
    throw new Error("Invalid upload path.")
  }
  const [kind, slug] = segments as [UploadKind, string, string, string]

  if (kind === "entries") {
    if (!isVotingCategory(slug) || !ENTRIES_OPEN) {
      throw new Error("Entries for this award are closed.")
    }
  } else if (kind === "applications") {
    if (!isApplicationAward(slug)) {
      throw new Error("This award doesn't accept online applications.")
    }
  } else {
    throw new Error("Invalid upload path.")
  }

  let submittedOffice: unknown
  try {
    submittedOffice = JSON.parse(clientPayload ?? "{}").office
  } catch {
    throw new Error("Invalid upload request.")
  }
  const office = await resolveOffice(
    typeof submittedOffice === "string" ? submittedOffice : "",
  )
  if (!office || !pathname.startsWith(uploadFolder(kind, slug, office))) {
    throw new Error("Please choose your office from the list.")
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await assertUploadAllowed(pathname, clientPayload)
        return {
          allowedContentTypes: ALLOWED_UPLOAD_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload rejected." },
      { status: 400 },
    )
  }
}
