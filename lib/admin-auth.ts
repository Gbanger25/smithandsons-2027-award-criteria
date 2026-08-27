import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE = "sns_admin"
const MAX_AGE_SECONDS = 60 * 60 * 8

function passcode(): string | undefined {
  const value = process.env.ADMIN_PASSCODE
  return value && value.length > 0 ? value : undefined
}

export function adminConfigured(): boolean {
  return Boolean(passcode())
}

/**
 * The cookie value is an HMAC of a fixed marker keyed by the passcode, so a
 * visitor can't forge a session without knowing the passcode, and rotating the
 * passcode invalidates every existing session.
 */
function sessionToken(secret: string): string {
  return createHmac("sha256", secret).update("admin-session-v1").digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function checkPasscode(submitted: string): boolean {
  const secret = passcode()
  if (!secret) return false
  return safeEqual(submitted, secret)
}

export async function startAdminSession(): Promise<void> {
  const secret = passcode()
  if (!secret) return
  const store = await cookies()
  store.set(COOKIE, sessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function isAdmin(): Promise<boolean> {
  const secret = passcode()
  if (!secret) return false
  const store = await cookies()
  const value = store.get(COOKIE)?.value
  if (!value) return false
  return safeEqual(value, sessionToken(secret))
}
