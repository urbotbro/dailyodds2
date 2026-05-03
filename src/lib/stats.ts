import { prisma } from "./prisma";
import type { PickStatus } from "@/types";

export interface PublicStats {
  totalPlays: number; won: number; lost: number; void: number;
  halfWon: number; halfLost: number; cancelled: number; pending: number;
  deletedPicks: number; winRate: number; roi: number;
  profitLoss: number; averageOdds: number; transparencyScore: number;
  // legacy alias
  totalPicks: number;
}

function calcPL(odds: number, stake: number, status: PickStatus): number {
  if (status === "WON")       return (odds - 1) * stake;
  if (status === "LOST")      return -stake;
  if (status === "HALF_WON")  return ((odds - 1) * stake) / 2;
  if (status === "HALF_LOST") return -stake / 2;
  return 0;
}

export async function getPublicStats(fromDate?: Date, toDate?: Date): Promise<PublicStats> {
  const dateWhere = fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : {};

  // Fetch all picks with slip info
  const picks = await prisma.pick.findMany({
    where: dateWhere,
    select: {
      id: true, status: true, odds: true, stakeUnit: true, slipId: true, legNumber: true,
      auditLogs: { where: { action: "EDITED" }, select: { id: true } },
    },
  });

  // Fetch settled slips to count combo as 1 play each
  // A combo slip: take first leg's status as the slip status
  // Single picks (slipId=null) count individually
  const slipSeen = new Set<string>();

  let won=0, lost=0, v=0, hw=0, hl=0, cancelled=0, pending=0;
  let totalStaked=0, totalPL=0, totalOdds=0, settledCount=0, editCount=0;

  for (const p of picks) {
    editCount += p.auditLogs.length;

    // For combo legs, only count the first leg (legNumber=1) as the play
    if (p.slipId !== null) {
      if (p.legNumber !== 1) continue; // skip legs 2,3,4,5 — counted via leg 1
      if (slipSeen.has(p.slipId)) continue;
      slipSeen.add(p.slipId);
    }

    const s = p.status as PickStatus;
    if (s === "WON") won++;
    else if (s === "LOST") lost++;
    else if (s === "VOID") v++;
    else if (s === "HALF_WON") hw++;
    else if (s === "HALF_LOST") hl++;
    else if (s === "CANCELLED_BEFORE_START") cancelled++;
    else pending++;

    if (["WON","LOST","HALF_WON","HALF_LOST"].includes(s)) {
      totalStaked += p.stakeUnit;
      totalPL += calcPL(p.odds, p.stakeUnit, s);
      totalOdds += p.odds;
      settledCount++;
    }
  }

  const totalPlays = won + lost + v + hw + hl + cancelled + pending;
  const decided = won + lost + hw + hl;
  const winRate = decided > 0 ? ((won + hw * 0.5) / decided) * 100 : 0;
  const roi = totalStaked > 0 ? (totalPL / totalStaked) * 100 : 0;
  const transparencyScore = Math.max(0, 100 - editCount * 2 - cancelled * 5);

  return {
    totalPlays,
    totalPicks: totalPlays, // legacy alias for existing pages
    won, lost, void: v, halfWon: hw, halfLost: hl,
    cancelled, pending, deletedPicks: 0,
    winRate: Math.round(winRate * 10) / 10,
    roi: Math.round(roi * 100) / 100,
    profitLoss: Math.round(totalPL * 100) / 100,
    averageOdds: settledCount > 0 ? Math.round((totalOdds / settledCount) * 100) / 100 : 0,
    transparencyScore: Math.round(transparencyScore),
  };
}

export async function getMonthlyStats(year: number, month: number) {
  return getPublicStats(new Date(year, month - 1, 1), new Date(year, month, 0, 23, 59, 59));
}
