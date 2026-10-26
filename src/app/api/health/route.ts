import { NextResponse } from "next/server";
import { cloudClient } from "@/lib/cloud";

export const dynamic = "force-dynamic";

// Lightweight keep-alive endpoint. A daily GitHub Action calls it so the Supabase
// free-tier project never reaches 7 days of inactivity (which pauses it).
export async function GET() {
  const client = cloudClient();
  if (!client) {
    return NextResponse.json({ ok: true, database: "not-configured" }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { error } = await client.from("artique_state").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false, database: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: true, database: "up", checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, database: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
