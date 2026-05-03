import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "760px", margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: "20px", fontWeight: "700", color: "#fff", textDecoration: "none" }}>Daily2Odds</Link>
      </nav>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>Terms of Use</h1>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginBottom: "40px" }}>Last updated: May 2026</p>

        {[
          { title: "Not a sportsbook", body: "Daily2Odds is a pick tracking and proof platform. We do not accept bets, process payments, or facilitate any form of gambling. We only publish and track sports picks publicly." },
          { title: "Not financial advice", body: "All picks posted on this platform are for informational and entertainment purposes only. Nothing on this site constitutes financial, betting, or investment advice. You are solely responsible for your own betting decisions." },
          { title: "No guarantee of profit", body: "Past performance does not guarantee future results. Sports betting involves significant risk. Never bet more than you can afford to lose." },
          { title: "Public records", body: "All picks are permanently public. We do not delete picks. Win or loss, every pick stays on the record. This is by design — to ensure full transparency." },
          { title: "Responsible gambling", body: "If you or someone you know has a gambling problem, please seek help. Visit begambleaware.org or call the National Gambling Helpline." },
          { title: "Changes", body: "We may update these terms at any time. Continued use of the site constitutes acceptance of the updated terms." },
        ].map((s) => (
          <div key={s.title} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>{s.title}</h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: "1.7" }}>{s.body}</p>
          </div>
        ))}

        <Link href="/" style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", textDecoration: "none" }}>← Back to home</Link>
      </div>
    </div>
  );
}
