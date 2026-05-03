// POST /api/picks — create a pick
// GET  /api/picks — list picks (with optional filters)

import { NextRequest, NextResponse } from "next/server";
import { createPick, autoLockExpiredPicks } from "@/lib/proof";
import { prisma } from "@/lib/prisma";

// Simple admin auth check (replace with proper session in production)
function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  await autoLockExpiredPicks(); // auto-lock on every request

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const sport = searchParams.get("sport") ?? undefined;
  const date = searchParams.get("date"); // YYYY-MM-DD

  const picks = await prisma.pick.findMany({
    where: {
      ...(status ? { status: status as string as never } : {}),
      ...(sport ? { sport: sport as string as never } : {}),
      ...(date
        ? {
            eventStartTime: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lte: new Date(`${date}T23:59:59.999Z`),
            },
          }
        : {}),
    },
    include: { auditLogs: { orderBy: { changedAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ picks });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      sport, league, matchName, pickType, selection,
      odds, stakeUnit, riskLevel, reasoning, eventStartTime,
    } = body;

    if (!sport || !matchName || !pickType || !selection || !odds || !eventStartTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pick = await createPick(
      {
        sport,
        league,
        matchName,
        pickType,
        selection,
        odds: parseFloat(odds),
        stakeUnit: stakeUnit ? parseFloat(stakeUnit) : 1,
        riskLevel,
        reasoning,
        eventStartTime: new Date(eventStartTime),
      },
      "admin"
    );

    return NextResponse.json({ pick, proofUrl: `/proof/${pick.proofId}` }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
