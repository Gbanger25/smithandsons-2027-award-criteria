import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AwardPage } from "@/components/award-page"
import { getAward, getAwardSlugs } from "@/lib/awards"

// All 27 awards are known at build time, so prerender every one.
export function generateStaticParams() {
  return getAwardSlugs().map((slug) => ({ slug }))
}

// Anything not in the content file is a 404, not an empty page.
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const award = getAward(slug)

  if (!award) return {}

  return {
    title: `${award.title} | Smith & Sons Awards`,
    description: `Criteria and application details for the ${award.title} at the Smith & Sons Renovations & Extensions awards.`,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const award = getAward(slug)

  if (!award) notFound()

  return <AwardPage data={award} />
}
