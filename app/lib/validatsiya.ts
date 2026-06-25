// Forma ma'lumotlarini tekshirish — server va client tomonda ishlatish uchun.

export type LeadKirish = {
  ism?: unknown;
  tel?: unknown;
  email?: unknown;
};

export type TozaLead = {
  ism: string;
  tel: string; // normallashtirilgan: 998XXXXXXXXX
  email: string;
};

export type ValidatsiyaNatija =
  | { ok: true; data: TozaLead }
  | { ok: false; xatolar: Record<string, string> };

// Faqat harf, bo'sh joy, apostrof, chiziqcha (Lotin + Kirill)
const ISM_REGEX = /^[\p{L}\s'’\-.]{2,60}$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function telNormalla(xom: string): string {
  let raqam = xom.replace(/\D/g, "");
  // 8 yoki 0 bilan boshlansa, mahalliy ko'rinish — 998 qo'shamiz
  if (raqam.length === 9) raqam = "998" + raqam;
  return raqam;
}

export function leadValidatsiya(kirish: LeadKirish): ValidatsiyaNatija {
  const xatolar: Record<string, string> = {};

  const ismXom = typeof kirish.ism === "string" ? kirish.ism.trim() : "";
  const telXom = typeof kirish.tel === "string" ? kirish.tel.trim() : "";
  const emailXom = typeof kirish.email === "string" ? kirish.email.trim() : "";

  // ISM
  if (ismXom.length < 2) {
    xatolar.ism = "Ismingizni to'liq kiriting (kamida 2 ta harf)";
  } else if (ismXom.length > 60) {
    xatolar.ism = "Ism juda uzun";
  } else if (!ISM_REGEX.test(ismXom)) {
    xatolar.ism = "Ismda faqat harflar bo'lishi mumkin";
  }

  // TELEFON
  const tel = telNormalla(telXom);
  if (!/^998\d{9}$/.test(tel)) {
    xatolar.tel = "To'g'ri telefon raqam kiriting (+998 XX XXX XX XX)";
  }

  // EMAIL (ixtiyoriy)
  if (emailXom.length > 0) {
    if (emailXom.length > 120 || !EMAIL_REGEX.test(emailXom)) {
      xatolar.email = "Email manzil noto'g'ri";
    }
  }

  if (Object.keys(xatolar).length > 0) {
    return { ok: false, xatolar };
  }

  return {
    ok: true,
    data: { ism: ismXom, tel, email: emailXom },
  };
}
