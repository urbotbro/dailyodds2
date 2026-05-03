import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:                { label: "Pending",   color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  WON:                    { label: "Won ✓",     color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  LOST:                   { label: "Lost ✗",    color: "#7f1d1d", bg: "#fee2e2", border: "#fca5a5" },
  VOID:                   { label: "Void",      color: "#374151", bg: "#f3f4f6", border: "#9ca3af" },
  HALF_WON:               { label: "Half Won",  color: "#064e3b", bg: "#ecfdf5", border: "#a7f3d0" },
  HALF_LOST:              { label: "Half Lost", color: "#7c2d12", bg: "#fff7ed", border: "#fdba74" },
  CANCELLED_BEFORE_START: { label: "Cancelled", color: "#374151", bg: "#f9fafb", border: "#d1d5db" },
};
const ICON: Record<string, string> = { CRICKET: "🏏", FOOTBALL: "⚽", TENNIS: "🎾", BASKETBALL: "🏀" };

export default async function HistoryPage() {
  const picks = await prisma.pick.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { slip: true },
  });

  // Group by date
  const grouped: Record<string, typeof picks> = {};
  for (const pick of picks) {
    const dateKey = new Date(pick.createdAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(pick);
  }

  const wonCount  = picks.filter((p: {status:string}) => p.status === "WON").length;
  const lostCount = picks.filter((p: {status:string}) => p.status === "LOST").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <nav style={{ borderBottom: "1px solid #1f1f1f", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "900px", margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: "18px", fontWeight: "800", background: "linear-gradient(135deg,#7c6aff,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>Daily2Odds</Link>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link href="/today"   style={{ color: "#888", textDecoration: "none", fontSize: "14px" }}>Today</Link>
          <Link href="/history" style={{ color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>History</Link>
          <Link href="/stats"   style={{ color: "#888", textDecoration: "none", fontSize: "14px" }}>Stats</Link>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "6px" }}>Pick history</h1>
        <p style={{ color: "#666", fontSize: "13px", marginBottom: "28px" }}>
          {picks.length} picks · {wonCount} won · {lostCount} lost · 0 deleted
        </p>

        {picks.length === 0 ? (
          <div style={{ border: "1px solid #1a1a1a", borderRadius: "14px", padding: "60px", textAlign: "center" }}>
            <p style={{ color: "#555" }}>No picks yet.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayPicks]) => (
            <div key={date} style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "11px", color: "#555", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #1a1a1a" }}>
                {date}
              </div>
              <div>
                {dayPicks.map((pick: {id:string;proofId:string;sport:string;matchName:string;selection:string;pickType:string;odds:number;status:string;slip:{slipId:string}|null;isLocked:boolean;eventStartTime:Date;stakeUnit:number;riskLevel:string;reasoning:string|null;createdAt:Date;legNumber:number|null}) => {
                  const b = BADGE[pick.status] ?? BADGE.PENDING;
                  return (
                    <Link key={pick.id} href={`/proof/${pick.proofId}`} style={{ textDecoration: "none" }}>
                      {/* Mobile-friendly: uses .hist-row CSS class */}
                      <div className="hist-row">
                        <div className="hist-left">
                          <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:"#1a1a2e", border:"1px solid #2a2a4e", padding:"2px 8px", borderRadius:"6px", fontSize:"12px", color:"#a78bfa", fontWeight:"600", flexShrink:0, whiteSpace:"nowrap" }}>
                            {ICON[pick.sport] ?? "🏅"} {pick.sport.charAt(0)+pick.sport.slice(1).toLowerCase()}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="hist-match">{pick.matchName}</div>
                            <div className="hist-sub">
                              {pick.selection} · {pick.pickType}
                              {pick.slip && <span style={{ color: "#a78bfa", marginLeft: "6px" }}>· Combo</span>}
                            </div>
                          </div>
                        </div>
                        <div className="hist-right">
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "#888" }}>@{pick.odds}</span>
                          <span className="badge" style={{ border: `1px solid ${b.border}`, background: b.bg, color: b.color }}>
                            {b.label}
                          </span>
                          <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#444" }}>{pick.proofId}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
