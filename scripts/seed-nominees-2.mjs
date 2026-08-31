/**
 * Seeds APPROVED nominees (with real Blob-hosted photos) across the SIX
 * People's Choice categories that seed-nominees.mjs did not cover, so all nine
 * ballots are testable end to end.
 *
 * Writes the same item shape as lib/entries.ts::createEntry, with status
 * "approved" so entries appear on the ballot immediately.
 *
 *   node --env-file-if-exists=.env.development.local scripts/seed-nominees-2.mjs
 *
 * Remove everything (across all seed scripts) with:
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
  // --- Australian Bathroom of the Year ---
  {
    categorySlug: "australian-bathroom-of-the-year",
    office: "Bendigo",
    state: "VIC",
    projectTitle: "Kew Freestanding Retreat",
    details:
      "A luxury ensuite renovation centred on a freestanding stone bath set against floor-to-ceiling stone tiles. Brushed brass tapware, a floating timber vanity, a frameless glass shower and a backlit mirror complete a hotel-quality space. Underfloor heating and rebuilt waterproofing bring the room up to a modern standard.",
    file: "au-bathroom-1.png",
  },
  {
    categorySlug: "australian-bathroom-of-the-year",
    office: "Geelong",
    state: "VIC",
    projectTitle: "Barwon Coastal Family Bath",
    details:
      "A bright, hard-working family bathroom finished in white subway tiles with a terrazzo-top double vanity. Matte black fixtures, a freestanding bath under a frosted window and herringbone floor tiles keep it practical for kids and relaxing for parents.",
    file: "au-bathroom-2.png",
  },
  {
    categorySlug: "australian-bathroom-of-the-year",
    office: "Toowoomba",
    state: "QLD",
    projectTitle: "Range Micro-Cement Ensuite",
    details:
      "A dramatic, spa-like ensuite wrapped in charcoal micro-cement. A black stone vanity, brushed gunmetal tapware and a generous walk-in rain shower sit beneath concealed lighting for a calm, moody atmosphere.",
    file: "au-bathroom-3.png",
  },
  // --- Australian Metro Renovation of the Year ---
  {
    categorySlug: "australian-metro-renovation-of-the-year",
    office: "Bentleigh",
    state: "VIC",
    projectTitle: "Fitzroy Terrace Transformation",
    details:
      "A full renovation of a narrow Melbourne terrace. We reworked the rear into an open-plan living, dining and kitchen zone with polished concrete floors and black steel-framed doors opening to a courtyard, while retaining the heritage front rooms.",
    file: "au-metro-1.png",
  },
  {
    categorySlug: "australian-metro-renovation-of-the-year",
    office: "Belrose - Warringah",
    state: "NSW",
    projectTitle: "Paddington Heritage Revival",
    details:
      "A period Sydney home restored and extended. Original cornices and high ceilings were preserved and paired with a modern open living space, herringbone floors and contemporary lighting for a seamless old-meets-new result.",
    file: "au-metro-2.png",
  },
  {
    categorySlug: "australian-metro-renovation-of-the-year",
    office: "Perth - Como",
    state: "WA",
    projectTitle: "Subiaco Double-Height Extension",
    details:
      "A two-storey rear extension built around a double-height void and sculptural staircase. Floor-to-ceiling glazing and a restrained white-and-timber palette connect the new living space to a landscaped garden.",
    file: "au-metro-3.png",
  },
  // --- Australian Regional Renovation of the Year ---
  {
    categorySlug: "australian-regional-renovation-of-the-year",
    office: "Ballarat",
    state: "VIC",
    projectTitle: "Buninyong Homestead Renewal",
    details:
      "A country homestead renovation that opened up the kitchen and living areas beneath exposed timber beams. A large island bench anchors the space, and French doors lead to a wide verandah with views over surrounding farmland.",
    file: "au-regional-1.png",
  },
  {
    categorySlug: "australian-regional-renovation-of-the-year",
    office: "Bargara & Coral Coast",
    state: "QLD",
    projectTitle: "Bargara Queenslander Reborn",
    details:
      "A classic Queenslander brought back to life. The timber weatherboard character was restored while the interior was opened into a light-filled, breezy living space with VJ panelling, timber floors and ceiling fans throughout.",
    file: "au-regional-2.png",
  },
  {
    categorySlug: "australian-regional-renovation-of-the-year",
    office: "Bunbury",
    state: "WA",
    projectTitle: "Ferguson Valley Barn Conversion",
    details:
      "A modern barn-style renovation with a cathedral ceiling and exposed black steel trusses. Polished concrete floors, a wood heater and large picture windows frame the countryside in a warm, minimalist interior.",
    file: "au-regional-3.png",
  },
  // --- NZ Kitchen of the Year ---
  {
    categorySlug: "nz-kitchen-of-the-year",
    office: "Auckland Central",
    state: "NEW ZEALAND",
    projectTitle: "Ponsonby Green Marble Kitchen",
    details:
      "A refined kitchen renovation featuring a stone waterfall island and deep green cabinetry. Brushed brass tapware, integrated appliances and oak flooring sit beneath large windows framing the garden.",
    file: "nz-kitchen-1.png",
  },
  {
    categorySlug: "nz-kitchen-of-the-year",
    office: "Christchurch West",
    state: "NEW ZEALAND",
    projectTitle: "Merivale Scullery Kitchen",
    details:
      "A classic white shaker kitchen with a timber benchtop and handmade subway splashback. Reconfiguring the layout added a walk-in scullery and opened the space to the living area, flooding it with light.",
    file: "nz-kitchen-2.png",
  },
  {
    categorySlug: "nz-kitchen-of-the-year",
    office: "Wellington",
    state: "NEW ZEALAND",
    projectTitle: "Thorndon Nocturne Kitchen",
    details:
      "A moody, contemporary kitchen with black honed-stone benchtops and charcoal timber-veneer cabinetry. A statement rangehood, concealed lighting and a wine display frame an island that seats six.",
    file: "nz-kitchen-3.png",
  },
  // --- NZ Outdoor Project of the Year ---
  {
    categorySlug: "nz-outdoor-project-of-the-year",
    office: "Auckland Central",
    state: "NEW ZEALAND",
    projectTitle: "Devonport Louvre Deck",
    details:
      "A covered cedar deck with a built-in outdoor kitchen and automated louvre roof, zoned for lounging and dining. Landscape lighting extends the space's use well into the evening.",
    file: "nz-outdoor-1.png",
  },
  {
    categorySlug: "nz-outdoor-project-of-the-year",
    office: "Blenheim",
    state: "NEW ZEALAND",
    projectTitle: "Marlborough Fireside Pergola",
    details:
      "An unused side yard transformed into the family's favourite room. A cedar deck sits under an aluminium slat pergola with a built-in gas fire pit and dense native planting for privacy.",
    file: "nz-outdoor-2.png",
  },
  {
    categorySlug: "nz-outdoor-project-of-the-year",
    office: "Christchurch Port Hills",
    state: "NEW ZEALAND",
    projectTitle: "Cashmere Infinity Retreat",
    details:
      "A resort-style rear yard built around an infinity-edge pool. Stone paving, a cabana lounge, an outdoor shower and frameless glass fencing create a holiday feel, softened by a lush subtropical garden.",
    file: "nz-outdoor-3.png",
  },
  // --- NZ Renovation of the Year ---
  {
    categorySlug: "nz-renovation-of-the-year",
    office: "Auckland Central",
    state: "NEW ZEALAND",
    projectTitle: "Grey Lynn Villa Reworked",
    details:
      "A whole-home villa renovation linking original character rooms to a modern rear extension. Timber floors, high ceilings and large glass doors to the garden create a bright, connected family home.",
    file: "nz-reno-1.png",
  },
  {
    categorySlug: "nz-renovation-of-the-year",
    office: "Christchurch West",
    state: "NEW ZEALAND",
    projectTitle: "Fendalton Bungalow Revival",
    details:
      "A 1920s bungalow restored and modernised. Panelled walls and timber flooring were retained while the living areas were opened into a warm, inviting contemporary family space.",
    file: "nz-reno-2.png",
  },
  {
    categorySlug: "nz-renovation-of-the-year",
    office: "Blenheim",
    state: "NEW ZEALAND",
    projectTitle: "Rarangi Coastal Renovation",
    details:
      "A coastal home renovation featuring a double-height living space with black steel-framed glazing and a timber ceiling. Polished concrete floors and sea views define a minimalist, warm interior.",
    file: "nz-reno-3.png",
  },
]

async function main() {
  if (!TABLE || !PK || !SK) {
    throw new Error("DynamoDB env vars are missing.")
  }

  console.log(`Seeding ${NOMINEES.length} approved nominees across 6 categories...`)

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

  console.log("Done. All nine ballots now have nominees to vote on.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
