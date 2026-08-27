import "server-only"

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc"

/**
 * DynamoDB access for the awards voting data.
 *
 * Credentials come from Vercel's OIDC federation — there are no static AWS
 * keys in this project, so the SDK's default credential chain would typecheck
 * and then fail at runtime. Always go through `awsCredentialsProvider`.
 *
 * The table's key attribute *names* are supplied by the integration rather
 * than being hardcoded, so every read and write builds its key object from
 * `PARTITION_KEY` / `SORT_KEY` below.
 */

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME as string
export const PARTITION_KEY = process.env
  .DYNAMODB_TABLE_PARTITION_KEY as string
export const SORT_KEY = process.env.DYNAMODB_TABLE_SORT_KEY as string

let cached: DynamoDBDocumentClient | undefined

export function getDocClient(): DynamoDBDocumentClient {
  if (cached) return cached

  const base = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN as string,
      clientConfig: { region: process.env.AWS_REGION },
    }),
  })

  cached = DynamoDBDocumentClient.from(base, {
    marshallOptions: {
      // Empty strings are legal in DynamoDB now, but stripping undefined keeps
      // optional fields (project photos, notes) from erroring on write.
      removeUndefinedValues: true,
    },
  })

  return cached
}

/** Builds a primary key object using the integration-provided attribute names. */
export function key(pk: string, sk: string): Record<string, string> {
  return { [PARTITION_KEY]: pk, [SORT_KEY]: sk }
}

export function isConfigured(): boolean {
  return Boolean(TABLE_NAME && PARTITION_KEY && SORT_KEY)
}
