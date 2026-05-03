// src/app/proof/[proofId]/page.tsx — Public Proof Page
// This is the most important trust page. Every pick has one.

import { notFound } from "next/navigation";
import Link from "next/link";
import { getProofData } from "@/lib/proof";


export const revalidate = 30;

interface PageProps {
  params: { proofId: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:                { label: "Pending",            color: "#d97706", bg: "#fef3c7" },
  WON:                    { label: "Won ✓",              color: "#059669", bg: "#d1fae5" },
  LOST:                   { label: "Lost ✗",             color: "#dc2626", bg: "#fee2e2" },
  VOID:                   { label: "Void",               color: "#6b7280", bg: "#f3f4f6" },
  HALF_WON:               { label: "Half Won",           color: "#10b981", bg: "#ecfdf5" },
  HALF_LOST:              { label: "Half Lost",          color: "#f97316", bg: "#fff7ed" },
  CANCELLED_BEFORE_START: { label: "Cancelled before start", color: "#9ca3af", bg: "#f9fafb" },
};

const SPORT_ICON: Record<string, string> = {
  CRICKET: "🏏", FOOTBALL: "⚽", TENNIS: "🎾", BASKETBALL: "🏀",
};

const ACTION_LABEL: Record<string, string> = {
  CREATED:        "Pick created",
  EDITED:         "Pick edited",
  RESULT_SETTLED: "Result settled",
  CANCELLED:      "Pick cancelled",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "UTC",
  }) + " UTC";
}

export default async function ProofPage({ params }: PageProps) {
  const data = await getProofData(params.proofId);
  if (!data) notFound();

  const statusCfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.PENDING;
  const editLogs = data.auditLogs.filter((l: { action: string; fieldName?: string | null; oldValue?: string | null; id: string; changedBy: string; changedAt: Date | string; reason?: string | null; note?: string | null; newValue?: string | null }) => l.action === "EDITED");
  const createdLog = data.auditLogs.find((l: { action: string; fieldName?: string | null; oldValue?: string | null; id: string; changedBy: string; changedAt: Date | string; reason?: string | null; note?: string | null; newValue?: string | null }) => l.action === "CREATED");

  // Find first audit snapshot (original values from edit logs)
  const originalValues: Record<string, string> = {};
  for (const log of editLogs) {
    if (log.fieldName && !(log.fieldName in originalValues)) {
      originalValues[log.fieldName] = log.oldValue ?? "";
    }
  }

  const wasEdited = editLogs.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">Daily2Odds</Link>
        <div className="flex gap-4 text-sm text-white/40">
          <Link href="/today" className="hover:text-white transition-colors">Today</Link>
          <Link href="/history" className="hover:text-white transition-colors">History</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Combo Slip Banner — show if this pick belongs to a slip */}
        {data.slip && (
          <div style={{ border:"1px solid #2a2440", borderRadius:"14px", padding:"20px", marginBottom:"24px", background:"#110d1f" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
              <span style={{ fontSize:"11px", background:"#2a2440", color:"#a78bfa", padding:"3px 10px", borderRadius:"4px", fontWeight:"700" }}>COMBO SLIP</span>
              <span style={{ fontFamily:"monospace", fontSize:"12px", color:"#555" }}>{data.slip.slipId}</span>
              <span style={{ fontSize:"12px", color:"#555" }}>· Leg {data.legNumber} of {data.slip.picks.length}</span>
            </div>
            {data.slip.title && <div style={{ fontSize:"14px", fontWeight:"600", color:"#e5e7eb", marginBottom:"12px" }}>{data.slip.title}</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {data.slip.picks.map((leg: { id:string; proofId:string; sport:string; matchName:string; selection:string; odds:number; legNumber:number|null; status:string }) => {
                const isThis = leg.id === data.id;
                const legIcon: Record<string,string> = {CRICKET:"🏏",FOOTBALL:"⚽",TENNIS:"🎾",BASKETBALL:"🏀"};
                return (
                  <div key={leg.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"8px", background: isThis ? "rgba(124,106,255,0.1)" : "rgba(255,255,255,0.02)", border: isThis ? "1px solid rgba(124,106,255,0.3)" : "1px solid transparent" }}>
                    <span style={{ width:"20px", height:"20px", borderRadius:"50%", background:"#2a2440", color:"#a78bfa", fontSize:"11px", fontWeight:"700", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{leg.legNumber}</span>
                    <span style={{ fontSize:"14px" }}>{legIcon[leg.sport] ?? "🏅"}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:"13px", color: isThis ? "#fff" : "#aaa", fontWeight: isThis ? "600" : "400" }}>{leg.matchName}</span>
                      <span style={{ fontSize:"12px", color:"#666", marginLeft:"8px" }}>{leg.selection} @{leg.odds}</span>
                    </div>
                    {!isThis && (
                      <a href={`/proof/${leg.proofId}`} style={{ fontSize:"11px", color:"#7c6aff", textDecoration:"none" }}>view →</a>
                    )}
                    {isThis && <span style={{ fontSize:"11px", color:"#a78bfa" }}>← you are here</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1px solid #1e1a2e" }}>
              <span style={{ fontSize:"13px", color:"#666" }}>Combined odds: </span>
              <strong style={{ color:"#a78bfa", fontSize:"15px" }}>
                @{data.slip.picks.reduce((a: number, l: { odds: number }) => a * l.odds, 1).toFixed(2)}
              </strong>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-sm text-white/40 border border-white/10 px-3 py-1 rounded-full">
              {data.proofId}
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-medium border"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg + "20",
                        borderColor: statusCfg.color + "40" }}>
              {statusCfg.label}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full border ${
              data.isLocked
                ? "border-red-500/30 text-red-400 bg-red-500/10"
                : "border-green-500/30 text-green-400 bg-green-500/10"
            }`}>
              {data.isLocked ? "🔒 Locked" : "🔓 Editable until match start"}
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            {SPORT_ICON[data.sport]} {data.matchName}
          </h1>
          {wasEdited && (
            <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm">
              <span>⚠</span>
              <span>Corrected before start — original version shown below</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">

          {/* Current Pick */}
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
            <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">
              {wasEdited ? "Current pick" : "Pick details"}
            </h2>
            <div className="space-y-3">
              {[
                { label: "Sport",      value: `${SPORT_ICON[data.sport]} ${data.sport}` },
                { label: "League",     value: data.league ?? "—" },
                { label: "Pick type",  value: data.pickType },
                { label: "Selection",  value: data.selection },
                { label: "Odds",       value: `@${data.odds}` },
                { label: "Stake",      value: `${data.stakeUnit} unit` },
                { label: "Risk",       value: data.riskLevel },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
              {data.reasoning && (
                <div className="pt-2 border-t border-white/10 text-sm text-white/40">
                  {data.reasoning}
                </div>
              )}
            </div>
          </div>

          {/* Original Pick (if edited) */}
          {wasEdited && (
            <div className="border border-amber-500/20 rounded-2xl p-6 bg-amber-500/[0.03]">
              <h2 className="text-xs uppercase tracking-widest text-amber-500/60 mb-4">
                Original pick (before edit)
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Sport",     value: originalValues.sport ?? data.sport },
                  { label: "Pick type", value: originalValues.pickType ?? data.pickType },
                  { label: "Selection", value: originalValues.selection ?? data.selection },
                  { label: "Odds",      value: `@${originalValues.odds ?? data.odds}` },
                  { label: "Stake",     value: `${originalValues.stakeUnit ?? data.stakeUnit} unit` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-amber-500/40">{row.label}</span>
                    <span className="font-medium text-amber-200/60">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timing */}
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
            <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Timestamps</h2>
            <div className="space-y-3">
              {[
                { label: "Created",     value: formatDate(data.createdAt) },
                { label: "Event start", value: formatDate(data.eventStartTime) },
                { label: "Locked at",   value: data.lockedAt ? formatDate(data.lockedAt) : data.isLocked ? "Auto-locked at event start" : "Not yet locked" },
                { label: "Settled at",  value: data.settledAt ? formatDate(data.settledAt) : "—" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{row.label}</span>
                  <span className="font-mono text-xs text-white/60">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
            <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Result</h2>
            <div className="mb-4">
              <span className="text-3xl font-bold" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </div>
            {data.resultNote && (
              <p className="text-sm text-white/50 mb-3">{data.resultNote}</p>
            )}
            {data.sourceLink && (
              <a href={data.sourceLink} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline">
                Source link →
              </a>
            )}
            {data.settledBy && (
              <p className="text-xs text-white/20 mt-3">
                Settled by: {data.settledBy}
              </p>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
          <h2 className="text-xs uppercase tracking-widest text-white/30 mb-6">
            Activity log — {data.auditLogs.length} entries
          </h2>
          {data.auditLogs.length === 0 ? (
            <p className="text-sm text-white/30">No activity yet.</p>
          ) : (
            <div className="space-y-4">
              {data.auditLogs.map((log: { id: string; action: string; fieldName?: string | null; oldValue?: string | null; newValue?: string | null; changedBy: string; changedAt: Date; reason?: string | null; note?: string | null }) => (
                <div key={log.id}
                  className="flex gap-4 text-sm border-l-2 border-white/10 pl-4">
                  <div className="shrink-0 w-28 text-xs text-white/30 font-mono pt-0.5">
                    {new Date(log.changedAt).toLocaleString("en-GB", {
                      day: "2-digit", month: "short",
                      hour: "2-digit", minute: "2-digit", hour12: false,
                    })}
                  </div>
                  <div>
                    <div className="font-medium text-white/80">
                      {ACTION_LABEL[log.action] ?? log.action}
                      {log.fieldName && (
                        <span className="text-white/40 font-normal"> · {log.fieldName}</span>
                      )}
                    </div>
                    {log.oldValue && log.newValue && (
                      <div className="text-xs text-white/40 mt-0.5">
                        <span className="text-red-400/60 line-through">{log.oldValue}</span>
                        {" → "}
                        <span className="text-green-400/60">{log.newValue}</span>
                      </div>
                    )}
                    {log.reason && (
                      <div className="text-xs text-white/30 mt-0.5">Reason: {log.reason}</div>
                    )}
                    {log.note && (
                      <div className="text-xs text-white/30 mt-0.5">{log.note}</div>
                    )}
                    <div className="text-xs text-white/20 mt-0.5">by {log.changedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proof URL */}
        <div className="mt-6 p-4 border border-white/10 rounded-xl bg-white/[0.02] flex items-center justify-between">
          <div className="text-xs text-white/30">Permanent proof link</div>
          <div className="text-xs font-mono text-white/50">
            {`${process.env.NEXT_PUBLIC_URL}/proof/${data.proofId}`}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/history" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            ← Back to history
          </Link>
        </div>
      </div>
    </main>
  );
}
