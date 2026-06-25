// Oddiy in-memory rate limiter (IP bo'yicha).
// Eslatma: bu bitta server instansiyasi xotirasida ishlaydi. Bir nechta
// instansiya / serverless muhitda Redis (masalan Upstash) ishlatish kerak.

type Urinish = {
  count: number;
  oynaBoshi: number; // joriy oyna boshlangan vaqt (ms)
  oxirgi: number; // oxirgi so'rov vaqti (ms)
};

const xotira = new Map<string, Urinish>();

// Sozlamalar
const OYNA_MS = 10 * 60 * 1000; // 10 daqiqalik oyna
const MAX_SOROV = 5; // oynada maksimal 5 ta yuborish
const MIN_ORALIQ_MS = 10 * 1000; // ketma-ket yuborishlar orasida kamida 10 soniya

export type RateLimitNatija = {
  ruxsat: boolean;
  qoldi: number; // oynada qolgan urinishlar
  qaytaUrinish: number; // necha soniyadan keyin urinish mumkin (0 = hozir)
};

export function rateLimit(kalit: string): RateLimitNatija {
  const hozir = Date.now();
  const mavjud = xotira.get(kalit);

  // Vaqti-vaqti bilan eski yozuvlarni tozalash (xotira o'smasligi uchun)
  if (xotira.size > 5000) {
    xotira.forEach((v, k) => {
      if (hozir - v.oynaBoshi > OYNA_MS) xotira.delete(k);
    });
  }

  if (!mavjud || hozir - mavjud.oynaBoshi > OYNA_MS) {
    // Yangi oyna
    xotira.set(kalit, { count: 1, oynaBoshi: hozir, oxirgi: hozir });
    return { ruxsat: true, qoldi: MAX_SOROV - 1, qaytaUrinish: 0 };
  }

  // Juda tez ketma-ket yuborish (flood) tekshiruvi
  if (hozir - mavjud.oxirgi < MIN_ORALIQ_MS) {
    const qaytaUrinish = Math.ceil(
      (MIN_ORALIQ_MS - (hozir - mavjud.oxirgi)) / 1000
    );
    return { ruxsat: false, qoldi: Math.max(0, MAX_SOROV - mavjud.count), qaytaUrinish };
  }

  // Oyna ichidagi limit tekshiruvi
  if (mavjud.count >= MAX_SOROV) {
    const qaytaUrinish = Math.ceil((OYNA_MS - (hozir - mavjud.oynaBoshi)) / 1000);
    return { ruxsat: false, qoldi: 0, qaytaUrinish };
  }

  mavjud.count += 1;
  mavjud.oxirgi = hozir;
  xotira.set(kalit, mavjud);

  return { ruxsat: true, qoldi: MAX_SOROV - mavjud.count, qaytaUrinish: 0 };
}
