import { NextResponse } from "next/server";
import { cloudClient, neonClient, isUsingNeon } from "@/lib/cloud";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isUsingNeon()) {
    const sql = neonClient();
    if (!sql) {
      return NextResponse.json({ ok: false, database: "neon-missing-url" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    try {
      const rows = await sql`SELECT id FROM artique_state LIMIT 1;`;
      return NextResponse.json({
        ok: true,
        database: "neon",
        status: "connected",
        checkedAt: new Date().toISOString()
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (err: unknown) {
      return NextResponse.json({
        ok: false,
        database: "neon-error",
        error: err instanceof Error ? err.message : "unreachable"
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  }

  const client = cloudClient();
  if (!client) {
    return NextResponse.json({ ok: true, database: "not-configured" }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { error } = await client.from("artique_state").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false, database: "supabase-error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: true, database: "supabase", checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, database: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
