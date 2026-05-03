import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "760px", margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: "20px", fontWeight: "700", color: "#fff", textDecoration: "none" }}>Daily2Odds</Link>
      </nav>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginBottom: "40px" }}>Last updated: May 2026</p>

        {[
          { title: "What we collect", body: "Daily2Odds is a public pick tracking site. We do not require user accounts. No personal data is collected from visitors. If you join via Telegram, your Telegram chat ID and username may be stored to send you updates." },
          { title: "Pick data", body: "All picks posted are fully public and permanent by design. Pick data includes sport, match, selection, odds, result, and timestamps. This data is intentionally public — that is the purpose of this platform." },
          { title: "Cookies", body: "We use minimal cookies only for essential site functionality (e.g., admin session). We do not use tracking, advertising, or analytics cookies." },
          { title: "Third parties", body: "We use Supabase for database hosting and Vercel for site hosting. Telegram is used for the notification bot. These services have their own privacy policies." },
          { title: "Data retention", body: "Pick data is retained permanently. This is intentional — picks cannot be deleted by design. Admin session data is cleared on logout." },
          { title: "Contact", body: "For any privacy questions, contact us via the Telegram channel." },
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
