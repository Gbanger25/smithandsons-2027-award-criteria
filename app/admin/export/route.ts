import { NextResponse } from "next/server"

import { isAdmin } from "@/lib/admin-auth"
import { getCategoryData, rankedEntries } from "@/lib/entries"
import { VOTING_CATEGORIES } from "@/lib/voting"

// Tallies must always be live — never cache the export.
export const dynamic = "force-dynamic"

/** Wraps a CSV field in quotes if it needs escaping. */
function csvField(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toRow(values: (string | number)[]): string {
  return values.map(csvField).join(",")
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const rows: string[] = [
    toRow([
      "Category",
      "Project Title",
      "Office",
      "State",
      "Status",
      "Votes",
      "Vote Share %",
      "Entry ID",
      "Submitted At",
    ]),
  ]

  for (const category of VOTING_CATEGORIES) {
    const data = await getCategoryData(category.slug)
    const entries = rankedEntries(data)
    const totalVotes = data.votes.length

    for (const entry of entries) {
      const share =
        totalVotes > 0
          ? Math.round(((entry.voteCount ?? 0) / totalVotes) * 100)
          : 0

      rows.push(
        toRow([
          category.title,
          entry.projectTitle,
          entry.office,
          entry.state,
          entry.status,
          entry.voteCount ?? 0,
          share,
          entry.id,
          entry.createdAt,
        ]),
      )
    }
  }

  const csv = rows.join("\r\n")
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="voting-data-${date}.csv"`,
    },
  })
}
