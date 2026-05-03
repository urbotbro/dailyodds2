import { prisma } from "./prisma";
import type { Sport, RiskLevel, PickStatus, AuditAction } from "@/types";

export function generateProofId(seq: number): string {
  return `D2O-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

export interface CreatePickInput {
  sport: Sport; league?: string; matchName: string;
  pickType: string; selection: string; odds: number;
  stakeUnit?: number; riskLevel?: RiskLevel;
  reasoning?: string; eventStartTime: Date;
}

export interface SettlePickInput {
  status: PickStatus; resultNote?: string;
  sourceLink?: string; settledBy: string;
}

export async function createPick(input: CreatePickInput, adminId: string) {
  const last = await prisma.pick.findFirst({ orderBy: { proofSeq: "desc" }, select: { proofSeq: true } });
  const nextSeq = (last?.proofSeq ?? 0) + 1;
  const proofId = generateProofId(nextSeq);
  return prisma.pick.create({
    data: {
      ...input, proofId, proofSeq: nextSeq,
      stakeUnit: input.stakeUnit ?? 1,
      riskLevel: input.riskLevel ?? "MEDIUM",
      status: "PENDING",
      auditLogs: { create: { action: "CREATED" as AuditAction, changedBy: adminId, note: `Created: ${proofId}` } },
    },
    include: { auditLogs: true },
  });
}

export async function settlePick(pickId: string, input: SettlePickInput) {
  const pick = await prisma.pick.findUniqueOrThrow({ where: { id: pickId } });
  if (pick.status !== "PENDING") throw new Error("Pick is already settled.");
  const valid: PickStatus[] = ["WON", "LOST", "VOID", "HALF_WON", "HALF_LOST"];
  if (!valid.includes(input.status)) throw new Error(`Invalid status: ${input.status}`);
  return prisma.pick.update({
    where: { id: pickId },
    data: {
      status: input.status, resultNote: input.resultNote,
      sourceLink: input.sourceLink, settledBy: input.settledBy,
      settledAt: new Date(), isLocked: true,
      auditLogs: {
        create: {
          action: "RESULT_SETTLED" as AuditAction,
          fieldName: "status", oldValue: pick.status, newValue: input.status,
          changedBy: input.settledBy, note: input.resultNote,
        },
      },
    },
    include: { auditLogs: { orderBy: { changedAt: "asc" } } },
  });
}

export async function autoLockExpiredPicks() {
  const r = await prisma.pick.updateMany({
    where: { isLocked: false, eventStartTime: { lte: new Date() } },
    data: { isLocked: true },
  });
  return r.count;
}

export async function getProofData(proofId: string) {
  const pick = await prisma.pick.findUnique({
    where: { proofId },
    include: {
      auditLogs: { orderBy: { changedAt: "asc" } },
      slip: { include: { picks: { orderBy: { legNumber: "asc" } } } },
    },
  });
  if (!pick) return null;
  if (!pick.isLocked && new Date() >= pick.eventStartTime) {
    await prisma.pick.update({ where: { id: pick.id }, data: { isLocked: true } });
    pick.isLocked = true;
  }
  return { ...pick, lockStatus: pick.isLocked ? "LOCKED" : "EDITABLE", proofUrl: `/proof/${pick.proofId}` };
}
