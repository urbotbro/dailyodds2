import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TG_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/daily2oddss_bot";

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

export default async function TodayPage() {
  // PART 1 fix: show all PENDING picks, not just today's date
  const picks = await prisma.pick.findMany({
    where: { status: "PENDING" },
    include: { slip: true },
    orderBy: { eventStartTime: "asc" },
  });

  // Group: slips together, singles separate
  const slipMap = new Map<string, typeof picks>();
  const singles: typeof picks = [];
  for (const p of picks) {
    if (p.slip) {
      const key = p.slip.slipId;
      if (!slipMap.has(key)) slipMap.set(key, []);
      slipMap.get(key)!.push(p);
    } else {
      singles.push(p);
    }
  }

  const totalCards = slipMap.size + singles.length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <nav style={{ borderBottom: "1px solid #1f1f1f", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "900px", margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: "18px", fontWeight: "800", background: "linear-gradient(135deg,#7c6aff,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>Daily2Odds</Link>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link href="/today"   style={{ color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>Today</Link>
          <Link href="/history" style={{ color: "#888", textDecoration: "none", fontSize: "14px" }}>History</Link>
          <Link href="/stats"   style={{ color: "#888", textDecoration: "none", fontSize: "14px" }}>Stats</Link>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px" }}>Active picks</h1>
          <p style={{ color: "#666", fontSize: "14px" }}>{totalCards} active · all PENDING picks with locked proof</p>
        </div>

        {totalCards === 0 ? (
          <div style={{ border: "1px solid #1a1a1a", borderRadius: "14px", padding: "60px 24px", textAlign: "center", background: "#0d0d0d" }}>
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>⏳</div>
            <p style={{ color: "#555", fontSize: "15px", marginBottom: "6px" }}>No active picks right now.</p>
            <p style={{ color: "#444", fontSize: "13px", marginBottom: "20px" }}>Follow our Telegram channel for updates.</p>
            <a href={TG_URL} target="_blank" style={{ display: "inline-block", background: "#5865f2", color: "#fff", padding: "10px 22px", borderRadius: "9px", fontWeight: "600", fontSize: "14px", textDecoration: "none" }}>
              Join Telegram Channel →
            </a>
          </div>
        ) : (
          <div>
            {/* Combo slips */}
            {Array.from(slipMap.entries()).map(([slipId, legs]) => {
              const combinedOdds = legs.reduce((a:number,l:{odds:number})=>a*l.odds,1);
              return (
                <div key={slipId} className="slip-card">
                  <div className="slip-header">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", background: "#2a2440", color: "#a78bfa", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>COMBO SLIP</span>
                        <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#555" }}>{slipId}</span>
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: "600" }}>{legs.length} legs · Combined @{combinedOdds.toFixed(2)}</div>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>{legs[0].stakeUnit} unit · {legs[0].riskLevel}</div>
                    </div>
                    <span className="badge" style={{ border: "1px solid #fcd34d", background: "#fef3c7", color: "#92400e" }}>Pending</span>
                  </div>
                  <div className="slip-legs">
                    {legs.map((leg:{id:string;proofId:string;sport:string;matchName:string;pickType:string;selection:string;odds:number;stakeUnit:number;riskLevel:string;reasoning:string|null;eventStartTime:Date;isLocked:boolean},i:number)=> (
                      <div key={leg.id} className="slip-leg">
                        <div className="leg-num">{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          {/* Sport badge + match name */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#1a1a2e", border: "1px solid #2a2a4e", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", color: "#a78bfa", fontWeight: "600" }}>
                              {ICON[leg.sport] ?? "🏅"} {leg.sport.charAt(0) + leg.sport.slice(1).toLowerCase()}
                            </span>
                            <span style={{ color: "#6b7280", fontSize: "12px" }}>{leg.matchName}</span>
                          </div>
                          {/* Winner + Odds — large and clear */}
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <span style={{ color: "#ffffff", fontSize: "17px", fontWeight: "700" }}>{leg.selection}</span>
                            <span style={{ color: "#a78bfa", fontSize: "17px", fontWeight: "800" }}>@{leg.odds}</span>
                          </div>
                          {/* Pick type + time */}
                          <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>
                            {leg.pickType} · {new Date(leg.eventStartTime).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })} UTC
                          </div>
                          {leg.reasoning && <div style={{ color: "#555", fontSize: "12px", marginTop: "3px", fontStyle: "italic" }}>{leg.reasoning}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "0 18px 14px", display: "flex", gap: "12px", alignItems: "center" }}>
                    <Link href={`/proof/${legs[0].proofId}`} style={{ fontSize: "13px", color: "#7c6aff", textDecoration: "none" }}>
                      🔒 View proof page →
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Single picks */}
            {singles.map((pick:{id:string;proofId:string;sport:string;matchName:string;pickType:string;selection:string;odds:number;status:string;isLocked:boolean;stakeUnit:number;riskLevel:string;reasoning:string|null;eventStartTime:Date})=> {
              const b = BADGE[pick.status] ?? BADGE.PENDING;
              return (
                <Link key={pick.id} href={`/proof/${pick.proofId}`} style={{ textDecoration: "none", display: "block" }}>
                  <div className="pick-card">
                    <div className="pick-card-left">
                      <div className="pick-meta">
                        <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:"#1a1a2e", border:"1px solid #2a2a4e", padding:"2px 8px", borderRadius:"6px", fontSize:"12px", color:"#a78bfa", fontWeight:"600" }}>
                          {ICON[pick.sport] ?? "🏅"} {pick.sport.charAt(0)+pick.sport.slice(1).toLowerCase()}
                        </span>
                        <span className="proof-chip">{pick.proofId}</span>
                        {pick.isLocked && <span style={{ fontSize: "10px", color: "#f87171" }}>🔒</span>}
                      </div>
                      <div className="pick-match">{pick.matchName}</div>
                      <div className="pick-sel">{pick.pickType} · <strong>{pick.selection}</strong></div>
                      {pick.reasoning && <div style={{ fontSize: "12px", color: "#555", marginTop: "4px", fontStyle: "italic" }}>{pick.reasoning}</div>}
                      <div style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>
                        {new Date(pick.eventStartTime).toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })} UTC
                        · {pick.stakeUnit}u · {pick.riskLevel}
                      </div>
                    </div>
                    <div className="pick-card-right">
                      <div className="pick-odds">@{pick.odds}</div>
                      <span className="badge" style={{ border: `1px solid ${b.border}`, background: b.bg, color: b.color }}>{b.label}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
