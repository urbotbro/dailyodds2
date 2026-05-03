import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProofId } from "@/lib/proof";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { legs, stakeUnit = 1, note } = await req.json();
    if (!Array.isArray(legs) || legs.length === 0)
      return NextResponse.json({ error: "At least 1 leg required" }, { status: 400 });

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      if (!leg.sport || !leg.matchName || !leg.selection || !leg.odds || !leg.eventStartTime)
        return NextResponse.json({ error: `Leg ${i + 1}: missing required fields` }, { status: 400 });
    }

    // Get next sequence
    const last = await prisma.pick.findFirst({ orderBy: { proofSeq: "desc" }, select: { proofSeq: true } });
    let nextSeq = (last?.proofSeq ?? 0) + 1;

    // Create slip
    const slipCount = await prisma.slip.count();
    const slipId = `SLIP-${new Date().getFullYear()}-${String(slipCount + 1).padStart(6, "0")}`;
    const slip = await prisma.slip.create({
      data: { slipId, title: note || (legs.length > 1 ? `Daily ${legs.length} Odds` : "Single Pick"), note },
    });

    // Create picks
    const picks = [];
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const proofId = generateProofId(nextSeq);
      const pick = await prisma.pick.create({
        data: {
          proofId, proofSeq: nextSeq,
          slipId: slip.id, legNumber: i + 1,
          sport: leg.sport, league: leg.league || null,
          matchName: leg.matchName,
          pickType: leg.pickType || "Match Winner",
          selection: leg.selection,
          odds: parseFloat(leg.odds),
          stakeUnit: parseFloat(stakeUnit) || 1,
          riskLevel: leg.riskLevel || "MEDIUM",
          reasoning: leg.reasoning || null,
          eventStartTime: new Date(leg.eventStartTime),
          status: "PENDING",
          auditLogs: {
            create: { action: "CREATED", changedBy: "admin", note: `Leg ${i + 1} of ${slipId}` },
          },
        },
      });
      picks.push({ ...pick, proofUrl: `/proof/${pick.proofId}` });
      nextSeq++;
    }

    return NextResponse.json({ slip, picks, message: `Created ${picks.length} pick(s)` }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
