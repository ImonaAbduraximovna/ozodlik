import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/app/lib/rate-limit";
import { leadValidatsiya } from "@/app/lib/validatsiya";
import { telegramYubor, htmlEscape } from "@/app/lib/telegram";

export const runtime = "nodejs";

function ipOlish(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonim";
}

export async function POST(req: NextRequest) {
  // 1) RATE LIMIT (IP bo'yicha)
  const ip = ipOlish(req);
  const limit = rateLimit(ip);
  if (!limit.ruxsat) {
    return NextResponse.json(
      {
        ok: false,
        xato: "rate_limit",
        xabar: `Juda ko'p urinish. ${limit.qaytaUrinish} soniyadan keyin qayta urinib ko'ring.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.qaytaUrinish) },
      }
    );
  }

  // 2) JSON ni xavfsiz o'qish
  let tana: unknown;
  try {
    tana = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, xato: "json", xabar: "Ma'lumot noto'g'ri formatda" },
      { status: 400 }
    );
  }

  const body = (tana ?? {}) as Record<string, unknown>;

  // 3) HONEYPOT — botlar to'ldiradigan yashirin maydon. To'lsa — bot deb hisoblaymiz.
  if (typeof body.veb_sayt === "string" && body.veb_sayt.trim() !== "") {
    // Botga muvaffaqiyat ko'rsatamiz, lekin hech narsa qilmaymiz.
    return NextResponse.json({ ok: true });
  }

  // 4) SERVER TOMONDA VALIDATSIYA
  const natija = leadValidatsiya({
    ism: body.ism,
    tel: body.tel,
    email: body.email,
  });

  if (!natija.ok) {
    return NextResponse.json(
      { ok: false, xato: "validatsiya", xatolar: natija.xatolar },
      { status: 422 }
    );
  }

  // 5) TELEGRAM GURUHGA YUBORISH
  const { ism, tel, email } = natija.data;
  const sana = new Date().toLocaleString("uz-UZ", {
    timeZone: "Asia/Tashkent",
    dateStyle: "short",
    timeStyle: "short",
  });

  const matn =
    `🆕 <b>Yangi ro'yxatdan o'tish!</b>\n\n` +
    `👤 <b>Ism:</b> ${htmlEscape(ism)}\n` +
    `📞 <b>Tel:</b> +${htmlEscape(tel)}\n` +
    `📧 <b>Email:</b> ${email ? htmlEscape(email) : "—"}\n\n` +
    `🕐 ${htmlEscape(sana)}\n` +
    `🌐 IP: ${htmlEscape(ip)}`;

  const yuborildi = await telegramYubor(matn);

  // Telegram ishlamasa ham lead yo'qolmasligi uchun (client WhatsApp'ga o'tadi)
  // foydalanuvchiga muvaffaqiyat qaytaramiz, lekin holatni bildiramiz.
  return NextResponse.json({
    ok: true,
    data: natija.data,
    telegram: yuborildi,
    qoldi: limit.qoldi,
  });
}

// Boshqa metodlarni rad etamiz
export function GET() {
  return NextResponse.json({ ok: false, xabar: "Method not allowed" }, { status: 405 });
}
