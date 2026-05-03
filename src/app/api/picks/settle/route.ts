// POST /api/picks/settle — settle a pick result

import { NextRequest, NextResponse } from "next/server";
import { settlePick } from "@/lib/proof";

function isAdmin(req: NextRequest): boolean {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pickId, status, resultNote, sourceLink } = await req.json();

    if (!pickId || !status) {
      return NextResponse.json({ error: "pickId and status required" }, { status: 400 });
    }

    const pick = await settlePick(pickId, {
      status,
      resultNote,
      sourceLink,
      settledBy: "admin",
    });

    return NextResponse.json({ pick });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
