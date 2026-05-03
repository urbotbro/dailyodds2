import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily2Odds — Verified Sports Picks with Locked Proof",
  description: "Stop trusting winning screenshots. Daily2Odds posts limited sports picks with locked proof pages, public results, and no deleted losses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
