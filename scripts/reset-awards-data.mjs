/**
 * Deletes every entry and vote for the nine People's Choice categories, plus
 * the entry photos in Blob storage.
 *
 * This is a hard reset with no confirmation prompt — use it to clear test data
 * before the real awards cycle opens, not while voting is live.
 *
 * Run with:
 *   node --env-file-if-exists=.env.development.local scripts/reset-awards-data.mjs
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { awsCredentialsProvider } from '@vercel/functions/oidc'
import { del } from '@vercel/blob'

const TABLE = process.env.DYNAMODB_TABLE_NAME
const PK = process.env.DYNAMODB_TABLE_PARTITION_KEY ?? 'PK'
const SK = process.env.DYNAMODB_TABLE_SORT_KEY ?? 'SK'

const CATEGORIES = [
  'australian-kitchen-of-the-year',
  'australian-bathroom-of-the-year',
  'australian-outdoor-project-of-the-year',
  'australian-metro-renovation-of-the-year',
  'australian-regional-renovation-of-the-year',
  'nz-kitchen-of-the-year',
  'nz-bathroom-of-the-year',
  'nz-outdoor-project-of-the-year',
  'nz-renovation-of-the-year',
]

const doc = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN,
      clientConfig: { region: process.env.AWS_REGION },
    }),
  }),
)

let deletedItems = 0
let deletedPhotos = 0

for (const slug of CATEGORIES) {
  const { Items = [] } = await doc.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': PK },
      ExpressionAttributeValues: { ':pk': `CATEGORY#${slug}` },
    }),
  )

  if (Items.length === 0) continue

  // Remove the photos first. If this throws we haven't yet dropped the rows
  // that point at them, so nothing is orphaned.
  // images is stored as { url, name } objects, so pull the url off each one.
  const urls = Items.flatMap((item) => item.images ?? []).map(
    (image) => image.url,
  )
  if (urls.length > 0) {
    try {
      await del(urls)
      deletedPhotos += urls.length
    } catch (error) {
      console.log(`[v0] Could not delete photos for ${slug}:`, error.message)
    }
  }

  // BatchWrite caps at 25 items per call.
  for (let i = 0; i < Items.length; i += 25) {
    const chunk = Items.slice(i, i + 25)
    await doc.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE]: chunk.map((item) => ({
            DeleteRequest: { Key: { [PK]: item[PK], [SK]: item[SK] } },
          })),
        },
      }),
    )
    deletedItems += chunk.length
  }

  console.log(`Cleared ${Items.length} rows from ${slug}`)
}

console.log(`\nDone. Removed ${deletedItems} rows and ${deletedPhotos} photos.`)
