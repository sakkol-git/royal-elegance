/**
 * Supabase Browser Client
 * Use this in Client Components (use client directive)
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    // Helpful runtime hint for developers — missing public env vars will break in the browser
    console.error(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
        'Set these in your .env.local (for local dev) or in your deployment platform environment variables.'
    )
    // Throw so callers immediately see a clear error instead of a generic "Failed to fetch"
    throw new Error('Supabase client not configured (missing NEXT_PUBLIC_SUPABASE_ env vars)')
  }

  // Detect mixed content issues which manifest as "Failed to fetch" in the browser
  if (typeof window !== 'undefined') {
    try {
      const pageIsHttps = window.location.protocol === 'https:'
      const supabaseIsHttp = url.startsWith('http://')
      if (pageIsHttps && supabaseIsHttp) {
        console.error(
          `[Supabase] Supabase URL is http:// while the page is served over HTTPS. This will be blocked by the browser (mixed content) and result in "Failed to fetch".`
        )
      }
    } catch (e) {
      // noop - defensive
    }
  }

  // On the browser, reuse a single client instance to avoid creating multiple
  // GoTrueClient instances (which warn: "Multiple GoTrueClient instances detected...")
  // Store the client on globalThis so React StrictMode or HMR won't create duplicates.
  if (typeof window !== 'undefined') {
    const g: any = globalThis
    if (!g.__supabase_client) {
      g.__supabase_client = createBrowserClient(url, anon)
    }
    return g.__supabase_client
  }

  // On the server, return a fresh client (server components or server routes).
  return createBrowserClient(url, anon)
}
