import Link from "next/link";
import { getPublicStats, getMonthlyStats } from "@/lib/stats";

export const revalidate = 60;

export default async function StatsPage() {
  const overall = await getPublicStats();
  const now = new Date();
  const monthly = await getMonthlyStats(now.getFullYear(), now.getMonth() + 1);

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
      <div style={{ fontSize: "36px", fontWeight: "800", color: color ?? "#fff", marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>{label}</div>
      {sub && <div style={{ fontSize: "12px", color: "#6ee7b7", marginTop: "4px" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "900px", margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: "20px", fontWeight: "700", color: "#fff", textDecoration: "none" }}>Daily2Odds</Link>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/today"   style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>Today</Link>
          <Link href="/history" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>History</Link>
          <Link href="/stats"   style={{ color: "#fff",                    textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>Stats</Link>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>Public stats</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", marginBottom: "40px" }}>
          All-time · fully public · no hidden results
        </p>

        {/* Overall */}
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>All time</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "40px" }}>
          <StatCard label="Total picks"  value={overall.totalPicks} />
          <StatCard label="Won"          value={overall.won}   color="#6ee7b7" />
          <StatCard label="Lost"         value={overall.lost}  color="#fca5a5" />
          <StatCard label="Void"         value={overall.void}  color="#9ca3af" />
          <StatCard label="Half Won"     value={overall.halfWon} />
          <StatCard label="Half Lost"    value={overall.halfLost} />
          <StatCard label="Cancelled"    value={overall.cancelled} />
          <StatCard label="Pending"      value={overall.pending} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "48px" }}>
          <StatCard label="Win rate"     value={`${overall.winRate}%`} color={overall.winRate >= 50 ? "#6ee7b7" : "#fca5a5"} />
          <StatCard label="ROI"          value={`${overall.roi >= 0 ? "+" : ""}${overall.roi}%`} color={overall.roi >= 0 ? "#6ee7b7" : "#fca5a5"} />
          <StatCard label="Profit / loss" value={`${overall.profitLoss >= 0 ? "+" : ""}${overall.profitLoss}u`} color={overall.profitLoss >= 0 ? "#6ee7b7" : "#fca5a5"} />
          <StatCard label="Avg odds"     value={overall.averageOdds || "—"} />
          <StatCard label="Transparency" value={`${overall.transparencyScore}%`} color="#a5b4fc" />
          <StatCard label="Deleted picks" value={0} sub="always 0" color="#6ee7b7" />
        </div>

        {/* This month */}
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          This month — {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "48px" }}>
          <StatCard label="Picks"    value={monthly.totalPicks} />
          <StatCard label="Won"      value={monthly.won}  color="#6ee7b7" />
          <StatCard label="Lost"     value={monthly.lost} color="#fca5a5" />
          <StatCard label="Win rate" value={`${monthly.winRate}%`} color={monthly.winRate >= 50 ? "#6ee7b7" : "#fca5a5"} />
          <StatCard label="ROI"      value={`${monthly.roi >= 0 ? "+" : ""}${monthly.roi}%`} color={monthly.roi >= 0 ? "#6ee7b7" : "#fca5a5"} />
          <StatCard label="P/L"      value={`${monthly.profitLoss >= 0 ? "+" : ""}${monthly.profitLoss}u`} color={monthly.profitLoss >= 0 ? "#6ee7b7" : "#fca5a5"} />
        </div>

        {/* Transparency note */}
        <div style={{ border: "1px solid rgba(165,180,252,0.2)", borderRadius: "16px", padding: "24px", background: "rgba(99,102,241,0.05)" }}>
          <h3 style={{ fontWeight: "600", marginBottom: "12px", color: "#a5b4fc" }}>About transparency score</h3>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: "1.7" }}>
            100% = no edits, no deletions, all results public.<br />
            Score reduces slightly for picks corrected before start or cancelled.<br />
            <strong style={{ color: "#6ee7b7" }}>Deleted picks: always 0.</strong> Delete is permanently disabled — every pick ever created stays public forever.
          </p>
        </div>
      </div>
    </div>
  );
}
