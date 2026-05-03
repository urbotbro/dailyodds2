// Daily2Odds — Telegram Bot
// Uses grammy library (npm install grammy)
// Run: npx ts-node bot/index.ts

import { Bot, Context } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SITE_URL = process.env.NEXT_PUBLIC_URL ?? "https://daily2odds.com";
const ADMIN_SECRET = process.env.ADMIN_SECRET!;
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID; // your personal Telegram ID

const bot = new Bot(BOT_TOKEN);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isAdminChat(ctx: Context): boolean {
  return String(ctx.chat?.id) === ADMIN_CHAT_ID;
}

async function fetchFromSite(path: string) {
  const res = await fetch(`${SITE_URL}/api${path}`, {
    headers: { "x-admin-secret": ADMIN_SECRET },
  });
  return res.json();
}

function formatPick(pick: {
  proofId: string; sport: string; matchName: string;
  selection: string; odds: number; stakeUnit: number;
  status: string; pickType: string;
}): string {
  const sportEmoji: Record<string, string> = {
    CRICKET: "🏏", FOOTBALL: "⚽", TENNIS: "🎾", BASKETBALL: "🏀",
  };
  return [
    `${sportEmoji[pick.sport] ?? "🏅"} *${pick.matchName}*`,
    `Pick: ${pick.pickType} → *${pick.selection}*`,
    `Odds: @${pick.odds} | Stake: ${pick.stakeUnit} unit`,
    `Status: ${pick.status}`,
    `🔒 Locked proof: ${SITE_URL}/proof/${pick.proofId}`,
  ].join("\n");
}

// ─── Commands ─────────────────────────────────────────────────────────────────

bot.command("start", (ctx) =>
  ctx.reply(
    `Welcome to Daily2Odds! 🎯\n\n` +
    `Every pick is locked with a public proof page.\n` +
    `Win or loss — the record stays.\n\n` +
    `/today — Today's picks\n` +
    `/stats — Public stats\n` +
    `/history — Recent results\n` +
    `/help — All commands`
  )
);

bot.command("help", (ctx) =>
  ctx.reply(
    `*Daily2Odds Bot Commands*\n\n` +
    `/today — Today's picks with proof links\n` +
    `/stats — Win rate, ROI, transparency score\n` +
    `/history — Last 5 settled picks\n` +
    `/proof [D2O-ID] — Get proof page for a pick\n\n` +
    `Admin only:\n` +
    `/settle [pickId] [WON|LOST|VOID] — Settle a pick`,
    { parse_mode: "Markdown" }
  )
);

bot.command("today", async (ctx) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data = await fetchFromSite(`/picks?date=${today}`);
    const picks = data.picks ?? [];

    if (picks.length === 0) {
      return ctx.reply("No picks posted today yet. Check back later! 🕐");
    }

    let msg = `📅 *Today's Picks — ${today}*\n\n`;
    for (const pick of picks) {
      msg += formatPick(pick) + "\n\n";
    }
    msg += `View all: ${SITE_URL}/today`;

    return ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    return ctx.reply("Error fetching picks. Try again later.");
  }
});

bot.command("stats", async (ctx) => {
  try {
    const data = await fetchFromSite("/stats");
    const s = data.stats;

    const msg = [
      `📊 *Daily2Odds Public Stats*`,
      ``,
      `Total picks: ${s.totalPicks}`,
      `Won: ${s.won} | Lost: ${s.lost} | Void: ${s.void}`,
      `Cancelled: ${s.cancelled} | Pending: ${s.pending}`,
      ``,
      `Win rate: ${s.winRate}%`,
      `ROI: ${s.roi > 0 ? "+" : ""}${s.roi}%`,
      `P/L: ${s.profitLoss > 0 ? "+" : ""}${s.profitLoss} units`,
      `Avg odds: ${s.averageOdds}`,
      `Transparency: ${s.transparencyScore}%`,
      `Deleted picks: ${s.deletedPicks} (always 0)`,
      ``,
      `Full stats: ${SITE_URL}/stats`,
    ].join("\n");

    return ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    return ctx.reply("Error fetching stats.");
  }
});

bot.command("history", async (ctx) => {
  try {
    const data = await fetchFromSite("/picks?status=WON");
    const won = (data.picks ?? []).slice(0, 3);
    const data2 = await fetchFromSite("/picks?status=LOST");
    const lost = (data2.picks ?? []).slice(0, 2);

    const recent = [...won, ...lost]
      .sort((a: {settledAt: string}, b: {settledAt: string}) =>
        new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime()
      )
      .slice(0, 5);

    if (recent.length === 0) {
      return ctx.reply("No settled picks yet.");
    }

    let msg = `📜 *Recent Results*\n\n`;
    for (const pick of recent) {
      msg += formatPick(pick) + "\n\n";
    }
    msg += `Full history: ${SITE_URL}/history`;

    return ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    return ctx.reply("Error fetching history.");
  }
});

bot.command("proof", async (ctx) => {
  const proofId = ctx.message?.text?.split(" ")[1];
  if (!proofId) {
    return ctx.reply("Usage: /proof D2O-2026-000001");
  }
  return ctx.reply(`Proof page: ${SITE_URL}/proof/${proofId}`);
});

// ── Admin: /settle pickId STATUS ──────────────────────────────────────────────

bot.command("settle", async (ctx) => {
  if (!isAdminChat(ctx)) {
    return ctx.reply("⛔ Admin only.");
  }

  const parts = ctx.message?.text?.split(" ") ?? [];
  const pickId = parts[1];
  const status = parts[2]?.toUpperCase();
  const resultNote = parts.slice(3).join(" ");

  if (!pickId || !status) {
    return ctx.reply("Usage: /settle [pickId] [WON|LOST|VOID|HALF_WON|HALF_LOST] [optional note]");
  }

  try {
    const res = await fetch(`${SITE_URL}/api/picks/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ pickId, status, resultNote, settledBy: "admin-telegram" }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    return ctx.reply(
      `✅ Settled as *${status}*\n` +
      `Proof: ${SITE_URL}/proof/${data.pick.proofId}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    return ctx.reply(`✗ Error: ${err instanceof Error ? err.message : "Unknown"}`);
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

bot.catch((err) => console.error("Bot error:", err));

bot.start();
console.log("Daily2Odds bot running...");
