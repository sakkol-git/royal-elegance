import { NextResponse } from "next/server"

// Minimal /api/health endpoint used by build and monitoring checks.
// Keep this lightweight and avoid heavy runtime dependencies so the build
// can always import and execute the module.
export async function GET() {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      status: "ok",
      message: "Minimal health check - Supabase checks omitted in build-safe mode",
    }
    return NextResponse.json(payload, { status: 200 })
  } catch (err) {
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 })
  }
}

