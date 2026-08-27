import "server-only"

import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb"

import {
  PARTITION_KEY,
  SORT_KEY,
  TABLE_NAME,
  getDocClient,
  isConfigured,
  key,
} from "@/lib/db"
import type { VotingCategorySlug } from "@/lib/voting"

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type EntryStatus = "pending" | "approved" | "hidden"

export type EntryImage = {
  url: string
  /** Original filename, shown as the gallery caption fallback. */
  name: string
}

export type Entry = {
  id: string
  categorySlug: string
  /** Franchisee office that submitted the project. */
  office: string
  state: string
  /** Short project name shown on the ballot card. */
  projectTitle: string
  /** Long-form submission text, shown in the expanded detail panel. */
  details: string
  images: EntryImage[]
  status: EntryStatus
  createdAt: string
  /** Sort key — needed to address the item for moderation. */
  sk: string
}

export type Vote = {
  /** Normalised office key, unique per category. */
  officeKey: string
  office: string
  entryId: string
  createdAt: string
}

/** An entry plus everything the ballot UI needs to render it. */
export type Nominee = Entry & {
  /** Only ever sent to the admin dashboard — voters never receive counts. */
  voteCount?: number
}

/* ------------------------------------------------------------------ *
 * Keys
 * ------------------------------------------------------------------ */

const ENTRY_PREFIX = "ENTRY#"
const VOTE_PREFIX = "VOTE#"

function categoryPk(slug: string): string {
  return `CATEGORY#${slug}`
}

/**
 * Offices are picked from a fixed list, but normalising guards against a
 * stray case or spacing difference creating a second ballot for one office.
 */
export function officeKey(office: string): string {
  return office.trim().toLowerCase().replace(/\s+/g, "-")
}

function entrySk(createdAt: string, id: string): string {
  return `${ENTRY_PREFIX}${createdAt}#${id}`
}

function voteSk(office: string): string {
  return `${VOTE_PREFIX}${officeKey(office)}`
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

type RawItem = Record<string, unknown>

function toEntry(item: RawItem): Entry {
  return {
    id: String(item.id ?? ""),
    categorySlug: String(item.categorySlug ?? ""),
    office: String(item.office ?? ""),
    state: String(item.state ?? ""),
    projectTitle: String(item.projectTitle ?? ""),
    details: String(item.details ?? ""),
    images: Array.isArray(item.images) ? (item.images as EntryImage[]) : [],
    status: (item.status as EntryStatus) ?? "pending",
    createdAt: String(item.createdAt ?? ""),
    sk: String(item[SORT_KEY] ?? ""),
  }
}

function toVote(item: RawItem): Vote {
  return {
    officeKey: String(item.officeKey ?? ""),
    office: String(item.office ?? ""),
    entryId: String(item.entryId ?? ""),
    createdAt: String(item.createdAt ?? ""),
  }
}

export type CategoryData = {
  entries: Entry[]
  votes: Vote[]
}

/**
 * One query returns every entry and every vote for a category. Tallies are
 * derived in memory rather than kept in a counter attribute, which keeps
 * concurrent votes from racing each other.
 */
export async function getCategoryData(
  slug: VotingCategorySlug | string,
): Promise<CategoryData> {
  if (!isConfigured()) {
    console.log("[v0] DynamoDB env vars missing — returning empty category.")
    return { entries: [], votes: [] }
  }

  const client = getDocClient()
  const entries: Entry[] = []
  const votes: Vote[] = []
  let startKey: Record<string, unknown> | undefined

  do {
    const result = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk",
        // Only the partition key is referenced by this expression. DynamoDB
        // rejects the request outright if ExpressionAttributeNames carries an
        // unused alias, so the sort key must not be included here.
        ExpressionAttributeNames: { "#pk": PARTITION_KEY },
        ExpressionAttributeValues: { ":pk": categoryPk(slug) },
        ExclusiveStartKey: startKey,
      }),
    )

    for (const item of result.Items ?? []) {
      const sk = String((item as RawItem)[SORT_KEY] ?? "")
      if (sk.startsWith(ENTRY_PREFIX)) entries.push(toEntry(item as RawItem))
      else if (sk.startsWith(VOTE_PREFIX)) votes.push(toVote(item as RawItem))
    }

    startKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (startKey)

  // Sort key already embeds createdAt, so entries arrive oldest-first.
  return { entries, votes }
}

/** Ballot view: approved entries only, with no vote counts attached. */
export function approvedEntries(data: CategoryData): Entry[] {
  return data.entries.filter((entry) => entry.status === "approved")
}

/** Which entry, if any, the given office has already backed. */
export function voteForOffice(
  data: CategoryData,
  office: string | undefined,
): Vote | undefined {
  if (!office) return undefined
  const wanted = officeKey(office)
  return data.votes.find((vote) => vote.officeKey === wanted)
}

export function tally(data: CategoryData): Map<string, number> {
  const counts = new Map<string, number>()
  for (const vote of data.votes) {
    counts.set(vote.entryId, (counts.get(vote.entryId) ?? 0) + 1)
  }
  return counts
}

/** Admin view: every entry regardless of status, ranked by votes received. */
export function rankedEntries(data: CategoryData): Nominee[] {
  const counts = tally(data)
  return data.entries
    .map((entry) => ({ ...entry, voteCount: counts.get(entry.id) ?? 0 }))
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount
      return a.projectTitle.localeCompare(b.projectTitle)
    })
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

export type CreateEntryInput = {
  categorySlug: string
  office: string
  state: string
  projectTitle: string
  details: string
  images: EntryImage[]
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  const createdAt = new Date().toISOString()
  const id = crypto.randomUUID()
  const sk = entrySk(createdAt, id)

  const item = {
    ...key(categoryPk(input.categorySlug), sk),
    type: "entry",
    id,
    categorySlug: input.categorySlug,
    office: input.office,
    state: input.state,
    projectTitle: input.projectTitle,
    details: input.details,
    images: input.images,
    // Entries stay off the ballot until an admin approves them.
    status: "pending" as EntryStatus,
    createdAt,
  }

  await getDocClient().send(
    new PutCommand({ TableName: TABLE_NAME, Item: item }),
  )

  return { ...item, sk }
}

/**
 * One item per office per category, so a re-vote overwrites the previous
 * choice instead of adding a second ballot.
 */
export async function castVote(params: {
  categorySlug: string
  office: string
  entryId: string
}): Promise<void> {
  await getDocClient().send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...key(categoryPk(params.categorySlug), voteSk(params.office)),
        type: "vote",
        officeKey: officeKey(params.office),
        office: params.office,
        entryId: params.entryId,
        createdAt: new Date().toISOString(),
      },
    }),
  )
}

export async function setEntryStatus(params: {
  categorySlug: string
  sk: string
  status: EntryStatus
}): Promise<void> {
  await getDocClient().send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key(categoryPk(params.categorySlug), params.sk),
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": params.status },
    }),
  )
}

export async function deleteEntry(params: {
  categorySlug: string
  sk: string
}): Promise<void> {
  await getDocClient().send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: key(categoryPk(params.categorySlug), params.sk),
    }),
  )
}
