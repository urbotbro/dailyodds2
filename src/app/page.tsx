import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPublicStats } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TG_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/daily2oddss_bot";

async function getHomeData() {
  const [stats, pendingPicks, recentResults] = await Promise.all([
    getPublicStats(),
    // PART 1 fix: show PENDING picks regardless of date
    prisma.pick.findMany({
      where: { status: "PENDING" },
      orderBy: { eventStartTime: "asc" },
      take: 5,
      include: { slip: true },
    }),
    prisma.pick.findMany({
      where: { status: { in: ["WON","LOST","VOID","HALF_WON","HALF_LOST"] } },
      orderBy: { settledAt: "desc" },
      take: 5,
    }),
  ]);
  return { stats, pendingPicks, recentResults };
}

const BADGE: Record<string,{label:string;color:string;bg:string;border:string}> = {
  PENDING:                {label:"Pending",  color:"#92400e",bg:"#fef3c7",border:"#fcd34d"},
  WON:                    {label:"Won ✓",    color:"#065f46",bg:"#d1fae5",border:"#6ee7b7"},
  LOST:                   {label:"Lost ✗",   color:"#7f1d1d",bg:"#fee2e2",border:"#fca5a5"},
  VOID:                   {label:"Void",     color:"#374151",bg:"#f3f4f6",border:"#9ca3af"},
  HALF_WON:               {label:"Half Won", color:"#064e3b",bg:"#ecfdf5",border:"#a7f3d0"},
  HALF_LOST:              {label:"Half Lost",color:"#7c2d12",bg:"#fff7ed",border:"#fdba74"},
  CANCELLED_BEFORE_START: {label:"Cancelled",color:"#374151",bg:"#f9fafb",border:"#d1d5db"},
};
const ICON: Record<string,string> = {CRICKET:"🏏",FOOTBALL:"⚽",TENNIS:"🎾",BASKETBALL:"🏀"};

export default async function HomePage() {
  const {stats, pendingPicks, recentResults} = await getHomeData();

  // Group pending picks: slips as one card, singles as individual
  const slipMap = new Map<string, typeof pendingPicks>();
  const singles: typeof pendingPicks = [];
  for (const p of pendingPicks) {
    if (p.slip) {
      const key = p.slip.slipId;
      if (!slipMap.has(key)) slipMap.set(key, []);
      slipMap.get(key)!.push(p);
    } else {
      singles.push(p);
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",color:"#fff",fontFamily:"system-ui,sans-serif"}}>

      {/* Nav */}
      <nav style={{borderBottom:"1px solid #1f1f1f",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:"1100px",margin:"0 auto"}}>
        <span style={{fontSize:"20px",fontWeight:"800",background:"linear-gradient(135deg,#7c6aff,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Daily2Odds</span>
        <div style={{display:"flex",gap:"16px",alignItems:"center"}}>
          <Link href="/today"   style={{color:"#888",textDecoration:"none",fontSize:"14px"}}>Today</Link>
          <Link href="/history" style={{color:"#888",textDecoration:"none",fontSize:"14px"}}>History</Link>
          <Link href="/stats"   style={{color:"#888",textDecoration:"none",fontSize:"14px"}}>Stats</Link>
          <Link href={TG_URL} target="_blank" style={{background:"#5865f2",color:"#fff",padding:"7px 16px",borderRadius:"9px",fontSize:"13px",fontWeight:"700",textDecoration:"none"}}>
            Channel
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{maxWidth:"1100px",margin:"0 auto",padding:"70px 20px 50px",textAlign:"center"}}>
        <div style={{display:"inline-block",border:"1px solid #2a2a2a",borderRadius:"9999px",padding:"5px 14px",fontSize:"11px",color:"#666",marginBottom:"28px",letterSpacing:"0.1em"}}>
          VERIFIED SPORTS PICKS · NO FAKE SCREENSHOTS
        </div>
        <h1 style={{fontSize:"clamp(34px,6vw,66px)",fontWeight:"800",lineHeight:"1.1",marginBottom:"20px",letterSpacing:"-0.02em"}}>
          Stop trusting winning{" "}
          <span style={{color:"#ef4444",position:"relative",display:"inline-block",paddingBottom:"8px"}}>
            screenshots.
            <svg style={{position:"absolute",left:0,bottom:"0",width:"100%",height:"8px",overflow:"visible"}} viewBox="0 0 100 8" preserveAspectRatio="none">
              <line x1="2" y1="7" x2="98" y2="1" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
          <br/>
          <span style={{color:"#888",fontWeight:"700",fontSize:"0.75em"}}>
            Track every pick with{" "}
            <span style={{color:"#4ade80",textDecoration:"underline",textDecorationColor:"#4ade80",textDecorationThickness:"3px",textUnderlineOffset:"5px"}}>proof.</span>
          </span>
        </h1>
        <p style={{fontSize:"15px",color:"#555",maxWidth:"480px",margin:"0 auto 40px",lineHeight:"1.7"}}>
          Daily2Odds posts limited sports picks with locked proof pages, public results, and no deleted losses.
        </p>
        <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
          <Link href="/today" style={{background:"#7c6aff",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontWeight:"700",fontSize:"14px",textDecoration:"none"}}>
            View Today&apos;s Picks
          </Link>
          <Link href={TG_URL} target="_blank" style={{border:"1px solid #2a2a3e",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontWeight:"600",fontSize:"14px",textDecoration:"none"}}>
            Join Telegram Channel →
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{borderTop:"1px solid #1a1a1a",borderBottom:"1px solid #1a1a1a",padding:"28px 20px",background:"#0d0d0d"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",textAlign:"center"}}>
          {[
            {label:"Total Picks",value:stats.totalPicks},
            {label:"Win Rate",   value:`${stats.winRate}%`},
            {label:"ROI",        value:`${stats.roi>=0?"+":""}${stats.roi}%`},
            {label:"Deleted",    value:"0",sub:"always 0"},
          ].map((s)=>(
            <div key={s.label}>
              <div style={{fontSize:"clamp(24px,4vw,34px)",fontWeight:"800"}}>{s.value}</div>
              <div style={{fontSize:"12px",color:"#666",marginTop:"3px"}}>{s.label}</div>
              {s.sub && <div style={{fontSize:"11px",color:"#22c55e",marginTop:"2px"}}>{s.sub}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section style={{maxWidth:"1100px",margin:"0 auto",padding:"60px 20px"}}>
        <h2 style={{fontSize:"clamp(22px,4vw,30px)",fontWeight:"700",textAlign:"center",marginBottom:"40px"}}>The problem with tipsters today</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"14px"}}>
          {[
            {title:"Fake screenshots",desc:"Anyone can edit a betslip image. Wins are shared. Losses disappear."},
            {title:"Deleted losses",  desc:"Posts vanish after the game. No record, no accountability."},
            {title:"Overbetting",     desc:"10 picks a day, no discipline, units all over the place."},
          ].map((item)=>(
            <div key={item.title} style={{border:"1px solid #2a2a2a",borderRadius:"14px",padding:"22px",background:"#111"}}>
              <div style={{width:"30px",height:"30px",borderRadius:"8px",background:"#2a1515",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"14px",color:"#ef4444",fontWeight:"700",fontSize:"14px"}}>✗</div>
              <h3 style={{fontWeight:"600",marginBottom:"6px",fontSize:"15px"}}>{item.title}</h3>
              <p style={{fontSize:"13px",color:"#777",lineHeight:"1.7"}}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{background:"#0d0d0d",padding:"60px 20px",borderTop:"1px solid #1a1a1a"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <h2 style={{fontSize:"clamp(22px,4vw,30px)",fontWeight:"700",textAlign:"center",marginBottom:"10px"}}>How Daily2Odds works</h2>
          <p style={{textAlign:"center",color:"#666",marginBottom:"40px",fontSize:"14px"}}>Every pick gets a permanent proof page. Win or loss, the record stays.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"14px"}}>
            {[
              {step:"1",title:"Pick is posted",      desc:"Each pick gets a unique Proof ID and a permanent public page instantly."},
              {step:"2",title:"Pick is locked",      desc:"Once the match starts, no changes are possible. Sport, odds, selection — all frozen."},
              {step:"3",title:"Result is settled",   desc:"WON or LOST, the result is logged publicly with timestamp."},
              {step:"4",title:"History stays public",desc:"No deletions. No hidden losses. Transparency score tracks every edit."},
            ].map((item)=>(
              <div key={item.step} style={{border:"1px solid #2a2a2a",borderRadius:"14px",padding:"20px",background:"#111",display:"flex",gap:"14px"}}>
                <div style={{width:"28px",height:"28px",borderRadius:"9999px",background:"#1a1a1a",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"700",flexShrink:0}}>{item.step}</div>
                <div>
                  <h3 style={{fontWeight:"600",marginBottom:"4px",fontSize:"14px"}}>{item.title}</h3>
                  <p style={{fontSize:"13px",color:"#777",lineHeight:"1.6"}}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Picks */}
      <section style={{padding:"50px 20px",borderTop:"1px solid #1a1a1a"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
            <h2 style={{fontSize:"22px",fontWeight:"700"}}>Active picks</h2>
            <Link href="/today" style={{color:"#666",fontSize:"14px",textDecoration:"none"}}>View all →</Link>
          </div>
          {(singles.length === 0 && slipMap.size === 0) ? (
            <div style={{border:"1px solid #1a1a1a",borderRadius:"14px",padding:"40px",textAlign:"center",background:"#0d0d0d"}}>
              <p style={{color:"#555",fontSize:"15px"}}>No active picks right now.</p>
              <p style={{color:"#333",fontSize:"13px",marginTop:"6px"}}>Follow our <a href={TG_URL} target="_blank" style={{color:"#7c6aff",textDecoration:"none"}}>Telegram channel</a> for updates.</p>
            </div>
          ) : (
            <div>
              {/* Combo slips */}
              {Array.from(slipMap.entries()).map(([slipId, legs]) => {
                const combinedOdds = legs.reduce((a:number,l:{odds:number})=>a*l.odds,1);
                const firstLeg = legs[0];
                return (
                  <div key={slipId} className="slip-card">
                    <div className="slip-header">
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                          <span style={{fontSize:"11px",background:"#2a2440",color:"#a78bfa",padding:"2px 8px",borderRadius:"4px",fontWeight:"600"}}>COMBO SLIP</span>
                          <span style={{fontFamily:"monospace",fontSize:"10px",color:"#555"}}>{slipId}</span>
                        </div>
                        <div style={{fontSize:"14px",fontWeight:"600"}}>{legs.length} legs · Combined @{combinedOdds.toFixed(2)}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span className="badge" style={{border:"1px solid #fcd34d",background:"#fef3c7",color:"#92400e"}}>Pending</span>
                        <div style={{fontSize:"12px",color:"#555",marginTop:"4px"}}>{firstLeg.stakeUnit} unit</div>
                      </div>
                    </div>
                    <div className="slip-legs">
                      {legs.map((leg:{id:string;proofId:string;sport:string;matchName:string;pickType:string;selection:string;odds:number;stakeUnit:number;riskLevel:string;reasoning:string|null;eventStartTime:Date;isLocked:boolean},i:number)=>(
                        <div key={leg.id} className="slip-leg">
                          <div className="leg-num">{i+1}</div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px",flexWrap:"wrap"}}>
                              <span style={{display:"inline-flex",alignItems:"center",gap:"4px",background:"#1a1a2e",border:"1px solid #2a2a4e",padding:"2px 8px",borderRadius:"6px",fontSize:"12px",color:"#a78bfa",fontWeight:"600"}}>
                                {ICON[leg.sport]??"🏅"} {leg.sport.charAt(0)+leg.sport.slice(1).toLowerCase()}
                              </span>
                              <span style={{color:"#6b7280",fontSize:"12px"}}>{leg.matchName}</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                              <span style={{color:"#ffffff",fontSize:"15px",fontWeight:"700"}}>{leg.selection}</span>
                              <span style={{color:"#a78bfa",fontSize:"15px",fontWeight:"800"}}>@{leg.odds}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{padding:"0 18px 14px"}}>
                      <Link href={`/proof/${legs[0].proofId}`} style={{fontSize:"12px",color:"#7c6aff",textDecoration:"none"}}>View proof page →</Link>
                    </div>
                  </div>
                );
              })}
              {/* Single picks */}
              {singles.map((pick:{id:string;proofId:string;sport:string;matchName:string;pickType:string;selection:string;odds:number;status:string;isLocked:boolean;stakeUnit:number;riskLevel:string;reasoning:string|null;eventStartTime:Date})=>{
                const b = BADGE[pick.status]??BADGE.PENDING;
                return (
                  <Link key={pick.id} href={`/proof/${pick.proofId}`} style={{textDecoration:"none",display:"block"}}>
                    <div className="pick-card">
                      <div className="pick-card-left">
                        <div className="pick-meta">
                          <span style={{display:"inline-flex",alignItems:"center",gap:"4px",background:"#1a1a2e",border:"1px solid #2a2a4e",padding:"2px 8px",borderRadius:"6px",fontSize:"12px",color:"#a78bfa",fontWeight:"600"}}>
                            {ICON[pick.sport]??"🏅"} {pick.sport.charAt(0)+pick.sport.slice(1).toLowerCase()}
                          </span>
                          <span className="proof-chip">{pick.proofId}</span>
                        </div>
                        <div className="pick-match">{pick.matchName}</div>
                        <div className="pick-sel">{pick.pickType} · <strong>{pick.selection}</strong></div>
                      </div>
                      <div className="pick-card-right">
                        <div className="pick-odds">@{pick.odds}</div>
                        <span className="badge" style={{border:`1px solid ${b.border}`,background:b.bg,color:b.color}}>{b.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent Results */}
      {recentResults.length>0 && (
        <section style={{borderTop:"1px solid #1a1a1a",padding:"50px 20px",background:"#0d0d0d"}}>
          <div style={{maxWidth:"1100px",margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <h2 style={{fontSize:"22px",fontWeight:"700"}}>Recent results</h2>
              <Link href="/history" style={{color:"#666",fontSize:"14px",textDecoration:"none"}}>Full history →</Link>
            </div>
            <div>
              {recentResults.map((pick:{settledAt?:Date|null;id:string;proofId:string;sport:string;matchName:string;selection:string;odds:number;status:string})=>{
                const b = BADGE[pick.status]??BADGE.PENDING;
                return (
                  <Link key={pick.id} href={`/proof/${pick.proofId}`} style={{textDecoration:"none"}}>
                    <div className="hist-row">
                      <div className="hist-left">
                        <span style={{fontSize:"16px",flexShrink:0}}>{ICON[pick.sport]??"🏅"}</span>
                        <div style={{minWidth:0}}>
                          <div className="hist-match">{pick.matchName}</div>
                          <div className="hist-sub">{pick.selection}</div>
                        </div>
                      </div>
                      <div className="hist-right">
                        <span style={{fontSize:"14px",fontWeight:"700",color:"#888"}}>@{pick.odds}</span>
                        <span className="badge" style={{border:`1px solid ${b.border}`,background:b.bg,color:b.color}}>{b.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Transparency */}
      <section style={{borderTop:"1px solid #1a1a1a",padding:"50px 20px",textAlign:"center"}}>
        <div style={{maxWidth:"480px",margin:"0 auto"}}>
          <div style={{fontSize:"56px",fontWeight:"800",color:"#7c6aff",marginBottom:"6px"}}>{stats.transparencyScore}%</div>
          <div style={{fontSize:"14px",color:"#666",marginBottom:"14px"}}>Transparency Score</div>
          <p style={{fontSize:"14px",color:"#555",lineHeight:"1.8"}}>
            No hidden edits · No deleted picks · All results public<br/>
            Deleted picks: <strong style={{color:"#22c55e"}}>always 0</strong> — delete is disabled.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{borderTop:"1px solid #1a1a1a",padding:"50px 20px",background:"#0d0d0d"}}>
        <div style={{maxWidth:"640px",margin:"0 auto"}}>
          <h2 style={{fontSize:"26px",fontWeight:"700",textAlign:"center",marginBottom:"28px"}}>FAQ</h2>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {[
              {q:"Is this a sportsbook?",    a:"No. We don't take bets. We only track and prove picks publicly."},
              {q:"Can picks be deleted?",    a:"No. Delete is permanently disabled. Every pick stays public forever."},
              {q:"Can picks be edited?",     a:"Only before the event starts, and every edit is logged publicly with the original version."},
              {q:"What sports do you cover?",a:"Cricket, Football, Tennis, Basketball in Phase 1."},
              {q:"What is a Proof ID?",      a:"A unique identifier like D2O-2026-000001 linking to a permanent public proof page for every pick."},
            ].map((faq)=>(
              <details key={faq.q} style={{border:"1px solid #1f1f1f",borderRadius:"12px",overflow:"hidden",background:"#111"}}>
                <summary style={{padding:"14px 18px",cursor:"pointer",fontWeight:"500",fontSize:"14px",listStyle:"none",display:"flex",justifyContent:"space-between",color:"#ddd"}}>
                  {faq.q} <span style={{color:"#555"}}>+</span>
                </summary>
                <p style={{padding:"0 18px 14px",fontSize:"13px",color:"#777",lineHeight:"1.7"}}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — Admin link removed (PART 4) */}
      <footer style={{borderTop:"1px solid #1a1a1a",padding:"20px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"12px",color:"#444",flexWrap:"wrap",gap:"10px"}}>
          <span>© 2026 Daily2Odds · Not a sportsbook · Not financial advice</span>
          <div style={{display:"flex",gap:"20px"}}>
            <Link href="/terms"   style={{color:"#444",textDecoration:"none"}}>Terms</Link>
            <Link href="/privacy" style={{color:"#444",textDecoration:"none"}}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
