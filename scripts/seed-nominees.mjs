/**
 * Seeds a handful of APPROVED nominees (with real Blob-hosted photos) across a
 * few People's Choice categories so the voting flow can be tested end to end.
 *
 * This writes the same item shape as lib/entries.ts::createEntry, except the
 * status is "approved" so entries appear on the ballot immediately without a
 * separate moderation step.
 *
 *   node --env-file-if-exists=.env.development.local scripts/seed-nominees.mjs
 *
 * Remove everything it created (and the votes cast against it) with:
 *   node --env-file-if-exists=.env.development.local scripts/reset-awards-data.mjs
 */
import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { put } from "@vercel/blob"

const TABLE = process.env.DYNAMODB_TABLE_NAME
const PK = process.env.DYNAMODB_TABLE_PARTITION_KEY
const SK = process.env.DYNAMODB_TABLE_SORT_KEY

const doc = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN,
      clientConfig: { region: process.env.AWS_REGION },
    }),
  }),
)

const here = dirname(fileURLToPath(import.meta.url))
const seedDir = join(here, "..", ".v0", "seed")

function officeKey(office) {
  return office.trim().toLowerCase().replace(/\s+/g, "-")
}

const NOMINEES = [
  {
    categorySlug: "australian-kitchen-of-the-year",
    office: "Brisbane City",
    state: "QLD",
    projectTitle: "Ascot Marble Entertainer",
    details:
      "A full gut renovation of a tired 1990s kitchen in a heritage Ascot home. We opened the wall to the dining room, installed a 3.2m Calacatta marble waterfall island, matte navy joinery and brass tapware, with fully integrated appliances. The brief was a hard-wearing family kitchen that still felt like a showpiece for entertaining.",
    file: "au-kitchen-1.png",
  },
  {
    categorySlug: "australian-kitchen-of-the-year",
    office: "Perth - Como",
    state: "WA",
    projectTitle: "Cottesloe Coastal Kitchen",
    details:
      "This coastal renovation reworked a dark, closed-in kitchen into a light-filled open-plan hub. White shaker cabinetry, a solid timber benchtop and a handmade subway splashback sit under three blown-glass pendants. Reconfiguring the layout gave the owners a walk-in scullery and a direct sightline to the pool.",
    file: "au-kitchen-2.png",
  },
  {
    categorySlug: "australian-kitchen-of-the-year",
    office: "North West Adelaide",
    state: "SA",
    projectTitle: "Prospect Nocturne Kitchen",
    details:
      "A bold, moody kitchen for a pair of keen cooks. Black honed-stone benchtops wrap charcoal cabinetry, with concealed strip lighting, a statement steel rangehood and a temperature-controlled wine display. Every appliance is commercial-grade and the island seats six for long dinners.",
    file: "au-kitchen-3.png",
  },
  {
    categorySlug: "australian-outdoor-project-of-the-year",
    office: "Brisbane City",
    state: "QLD",
    projectTitle: "Hamilton Alfresco & Pool",
    details:
      "A complete backyard transformation on a sloping Hamilton block. We built a covered alfresco with a full outdoor kitchen, spotted-gum decking that steps down to a new magnesium pool, and integrated lounge and dining zones. Landscape lighting makes the space usable well into the evening.",
    file: "au-outdoor-1.png",
  },
  {
    categorySlug: "australian-outdoor-project-of-the-year",
    office: "Perth South Metro",
    state: "WA",
    projectTitle: "Fremantle Deck & Pergola",
    details:
      "This project turned an unused side yard into the family's favourite room. A spotted-gum deck sits under an automated aluminium-slat pergola, with a built-in fire pit, weatherproof lounge and dense tropical planting for privacy from neighbours.",
    file: "au-outdoor-2.png",
  },
  {
    categorySlug: "australian-outdoor-project-of-the-year",
    office: "North West Adelaide",
    state: "SA",
    projectTitle: "Glenelg Resort Retreat",
    details:
      "A resort-style rear yard built around a new infinity-edge pool. Travertine paving, a cabana with a built-in lounge, an outdoor shower and frameless glass fencing create a holiday feel at home. The planting scheme was chosen to stay lush through the Adelaide summer.",
    file: "au-outdoor-3.png",
  },
  {
    categorySlug: "nz-bathroom-of-the-year",
    office: "Auckland Central",
    state: "NEW ZEALAND",
    projectTitle: "Remuera Marble Ensuite",
    details:
      "A luxury ensuite in a Remuera villa. A freestanding stone bath anchors the room against floor-to-ceiling marble, with brushed-brass fixtures, a frameless glass shower, a backlit mirror and underfloor heating throughout. Careful waterproofing detailing was critical given the villa's age.",
    file: "nz-bathroom-1.png",
  },
  {
    categorySlug: "nz-bathroom-of-the-year",
    office: "Christchurch West",
    state: "NEW ZEALAND",
    projectTitle: "Fendalton Nature Bathroom",
    details:
      "A calm, nature-led main bathroom. A custom timber vanity pairs with matte-black tapware and large-format grey tiles, while a walk-in rain shower and frosted window fill the room with soft light. Built-in planter niches soften the palette.",
    file: "nz-bathroom-2.png",
  },
  {
    categorySlug: "nz-bathroom-of-the-year",
    office: "Christchurch Port Hills",
    state: "NEW ZEALAND",
    projectTitle: "Cashmere Family Bathroom",
    details:
      "A bright, hard-working family bathroom. A double vanity with a terrazzo top, brushed-nickel fixtures and a freestanding bath under the window make it practical for kids and relaxing for parents. Herringbone floor tiles and a subway-tiled shrink lift the everyday space.",
    file: "nz-bathroom-3.png",
  },
]

async function main() {
  if (!TABLE || !PK || !SK) {
    throw new Error("DynamoDB env vars are missing.")
  }

  console.log(`Seeding ${NOMINEES.length} approved nominees...`)

  for (const nominee of NOMINEES) {
    const bytes = await readFile(join(seedDir, nominee.file))
    const blob = await put(
      `entries/${nominee.categorySlug}/${officeKey(nominee.office)}/${nominee.file}`,
      bytes,
      { access: "public", addRandomSuffix: true, contentType: "image/png" },
    )

    const createdAt = new Date().toISOString()
    const id = randomUUID()
    const sk = `ENTRY#${createdAt}#${id}`

    await doc.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          [PK]: `CATEGORY#${nominee.categorySlug}`,
          [SK]: sk,
          type: "entry",
          id,
          categorySlug: nominee.categorySlug,
          office: nominee.office,
          state: nominee.state,
          projectTitle: nominee.projectTitle,
          details: nominee.details,
          images: [{ url: blob.url, name: nominee.file }],
          status: "approved",
          createdAt,
        },
      }),
    )

    console.log(`  [${nominee.categorySlug}] ${nominee.projectTitle}`)
  }

  console.log("Done. Ballots now have nominees to vote on.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
