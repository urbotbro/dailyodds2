// GET /api/stats — public stats
// GET /api/stats?year=2026&month=1 — monthly stats

import { NextRequest, NextResponse } from "next/server";
import { getPublicStats, getMonthlyStats } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  try {
    const stats =
      year && month
        ? await getMonthlyStats(parseInt(year), parseInt(month))
        : await getPublicStats();

    return NextResponse.json({ stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
