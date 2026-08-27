/**
 * Inserts a few sample entries so the ballot can be exercised before real
 * submissions arrive. Safe to re-run — each run creates new ids.
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-test-entries.mjs
 *
 * Delete the seeded entries from /admin when you're done.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { awsCredentialsProvider } from '@vercel/functions/oidc'

const TABLE = process.env.DYNAMODB_TABLE_NAME
const PK = process.env.DYNAMODB_TABLE_PARTITION_KEY
const SK = process.env.DYNAMODB_TABLE_SORT_KEY

if (!TABLE || !PK || !SK) {
  console.error('[v0] Missing DynamoDB env vars.')
  process.exit(1)
}

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN,
      clientConfig: { region: process.env.AWS_REGION },
    }),
  }),
  { marshallOptions: { removeUndefinedValues: true } },
)

const SAMPLES = [
  {
    categorySlug: 'australian-kitchen-of-the-year',
    office: 'Ashgrove',
    state: 'QLD',
    projectTitle: 'Ashgrove Queenslander Kitchen',
    details:
      'A full rebuild of the rear of a 1920s Queenslander. We removed the original galley layout and opened the kitchen into the new dining space, keeping the VJ walls and restoring the hoop pine floors. Custom cabinetry in a satin two-pack finish, a 3.2m island in honed granite, and a butlers pantry hidden behind a full-height sliding door. The client wanted the room to feel original to the house, so all new joinery was profiled to match the existing architraves.',
    status: 'approved',
  },
  {
    categorySlug: 'australian-kitchen-of-the-year',
    office: 'Albany',
    state: 'WA',
    projectTitle: 'Middleton Beach Coastal Kitchen',
    details:
      'This coastal renovation had to withstand salt exposure while staying bright through a long southern winter. Marine-grade stainless fittings throughout, engineered stone benchtops, and a full-width window splashback framing the dune line. The brief called for seating for eight without extending the footprint, which we solved with a cantilevered breakfast bar off the island.',
    status: 'approved',
  },
  {
    categorySlug: 'nz-bathroom-of-the-year',
    office: 'Ashburton',
    state: 'NEW ZEALAND',
    projectTitle: 'Ashburton Main Bathroom Retreat',
    details:
      'A compact 1970s bathroom reworked into a wet-room layout to gain usable floor space. Underfloor heating, a fully tiled niche, and a frameless glass screen. Tapware and fixtures were specified in brushed brass to warm up the large-format porcelain tiling.',
    status: 'pending',
  },
]

for (const sample of SAMPLES) {
  const createdAt = new Date().toISOString()
  const id = crypto.randomUUID()

  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        [PK]: `CATEGORY#${sample.categorySlug}`,
        [SK]: `ENTRY#${createdAt}#${id}`,
        type: 'entry',
        id,
        categorySlug: sample.categorySlug,
        office: sample.office,
        state: sample.state,
        projectTitle: sample.projectTitle,
        details: sample.details,
        images: [],
        status: sample.status,
        createdAt,
      },
    }),
  )

  console.log(`[v0] Seeded "${sample.projectTitle}" (${sample.status})`)
}

console.log('[v0] Done.')
