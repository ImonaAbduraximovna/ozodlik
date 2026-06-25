// Telegram bot orqali guruhga xabar yuborish.
// Token va chat ID .env.local faylida (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).

// HTML maxsus belgilarini xavfsizlaymiz (parse_mode: HTML uchun)
export function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function telegramYubor(matn: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error(
      "[telegram] TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID .env.local da to'ldirilmagan"
    );
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: matn,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // Telegram javob bermay qolsa, abadiy kutib qolmaslik uchun
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const xato = await res.text().catch(() => "");
      console.error(`[telegram] xato ${res.status}: ${xato}`);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[telegram] yuborishda xatolik:", e);
    return false;
  }
}
