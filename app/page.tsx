"use client";

import { useEffect } from "react";
import { leadValidatsiya } from "@/app/lib/validatsiya";

export default function Home() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // ========== TAYMER ==========
    // Retrit boshlanish sanasi: 18 Iyul 2026
    const retritSana = new Date("2026-07-18T00:00:00").getTime();

    function taymerYangilash() {
      const hozir = new Date().getTime();
      const farq = retritSana - hozir;

      const set = (id: string, v: string) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };

      if (farq < 0) {
        set("kunlar", "00");
        set("soatlar", "00");
        set("daqiqalar", "00");
        set("soniyalar", "00");
        return;
      }

      const kunlar = Math.floor(farq / (1000 * 60 * 60 * 24));
      const soatlar = Math.floor((farq % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const daqiqalar = Math.floor((farq % (1000 * 60 * 60)) / (1000 * 60));
      const soniyalar = Math.floor((farq % (1000 * 60)) / 1000);

      set("kunlar", String(kunlar).padStart(2, "0"));
      set("soatlar", String(soatlar).padStart(2, "0"));
      set("daqiqalar", String(daqiqalar).padStart(2, "0"));
      set("soniyalar", String(soniyalar).padStart(2, "0"));
    }

    taymerYangilash();
    const taymerInterval = setInterval(taymerYangilash, 1000);
    cleanups.push(() => clearInterval(taymerInterval));

    // ========== FAQ AKKORDION ==========
    const faqItems = document.querySelectorAll(".faq-item");
    const faqHandlers: Array<{ el: Element; fn: () => void }> = [];
    faqItems.forEach((item) => {
      const savol = item.querySelector(".faq-savol");
      if (!savol) return;
      const fn = () => {
        const faolMi = item.classList.contains("faol");
        faqItems.forEach((i) => i.classList.remove("faol"));
        if (!faolMi) item.classList.add("faol");
      };
      savol.addEventListener("click", fn);
      faqHandlers.push({ el: savol, fn });
    });
    cleanups.push(() =>
      faqHandlers.forEach(({ el, fn }) => el.removeEventListener("click", fn))
    );

    // ========== SMOOTH SCROLL ==========
    const anchorLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    const anchorHandlers: Array<{ el: Element; fn: (e: Event) => void }> = [];
    anchorLinks.forEach((link) => {
      const fn = (e: Event) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      link.addEventListener("click", fn);
      anchorHandlers.push({ el: link, fn });
    });
    cleanups.push(() =>
      anchorHandlers.forEach(({ el, fn }) => el.removeEventListener("click", fn))
    );

    // ========== SCROLL PROGRESS BAR ==========
    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    document.body.appendChild(progressBar);

    const progressFn = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollFoiz = (scrollTop / docHeight) * 100;
      progressBar.style.width = scrollFoiz + "%";
    };
    window.addEventListener("scroll", progressFn);
    cleanups.push(() => {
      window.removeEventListener("scroll", progressFn);
      progressBar.remove();
    });

    // ========== INTERSECTION OBSERVER (SCROLL ANIMATIONS) ==========
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = "1";
          (entry.target as HTMLElement).style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    const animElements = document.querySelectorAll<HTMLElement>(
      ".shart-karta, .dastur-karta, .kun-karta, .natija-item, .sharh-karta, .bonus-karta, .faq-item, .taymer-katak"
    );

    animElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      el.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      observer.observe(el);
    });
    cleanups.push(() => observer.disconnect());

    // ========== LEAD FORMA (validatsiya + rate limit) ==========
    const leadForma = document.getElementById("leadForma") as HTMLFormElement | null;
    if (leadForma) {
      const tugma = leadForma.querySelector(".btn-forma") as HTMLButtonElement | null;
      const holatEl = document.getElementById("forma-holat");
      let sanoqInterval: ReturnType<typeof setInterval> | undefined;
      cleanups.push(() => {
        if (sanoqInterval) clearInterval(sanoqInterval);
      });

      const xatoKorsat = (id: string, xabar: string) => {
        const el = document.getElementById(id);
        if (el) el.textContent = xabar;
        const input = document.getElementById(id.replace("err-", ""));
        if (input) input.classList.add("input-xato");
      };

      const xatolarniTozalash = () => {
        ["err-ism", "err-tel", "err-email"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.textContent = "";
        });
        ["ism", "tel", "email"].forEach((id) => {
          document.getElementById(id)?.classList.remove("input-xato");
        });
        if (holatEl) {
          holatEl.textContent = "";
          holatEl.className = "forma-holat";
        }
      };

      const holatKorsat = (xabar: string, tur: "ok" | "xato") => {
        if (!holatEl) return;
        holatEl.textContent = xabar;
        holatEl.className = "forma-holat " + (tur === "ok" ? "holat-ok" : "holat-xato");
      };

      const submitFn = async (e: Event) => {
        e.preventDefault();
        xatolarniTozalash();

        const ism = (document.getElementById("ism") as HTMLInputElement).value;
        const tel = (document.getElementById("tel") as HTMLInputElement).value;
        const email = (document.getElementById("email") as HTMLInputElement).value;
        const veb_sayt =
          (document.getElementById("veb_sayt") as HTMLInputElement | null)?.value ?? "";

        // Client tomonda validatsiya (tez javob uchun)
        const tekshir = leadValidatsiya({ ism, tel, email });
        if (!tekshir.ok) {
          Object.entries(tekshir.xatolar).forEach(([maydon, xabar]) =>
            xatoKorsat("err-" + maydon, xabar)
          );
          holatKorsat("Iltimos, xatolarni to'g'rilang.", "xato");
          return;
        }

        // Tugmani bloklash (qayta-qayta yuborilmasligi uchun)
        if (tugma) {
          tugma.disabled = true;
          tugma.dataset.aslMatn = tugma.dataset.aslMatn || tugma.innerHTML;
          tugma.innerHTML = "Yuborilmoqda...";
        }

        try {
          const javob = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ism, tel, email, veb_sayt }),
          });

          const data = await javob.json().catch(() => ({}));

          if (javob.status === 429) {
            holatKorsat(
              data.xabar || "Juda ko'p urinish. Birozdan keyin urinib ko'ring.",
              "xato"
            );
            return;
          }

          if (javob.status === 422 && data.xatolar) {
            Object.entries(data.xatolar as Record<string, string>).forEach(
              ([maydon, xabar]) => xatoKorsat("err-" + maydon, xabar)
            );
            holatKorsat("Iltimos, xatolarni to'g'rilang.", "xato");
            return;
          }

          if (!javob.ok || !data.ok) {
            holatKorsat("Xatolik yuz berdi. Birozdan keyin urinib ko'ring.", "xato");
            return;
          }

          // Muvaffaqiyat — ma'lumot Telegram guruxga ketdi.
          // Formani yashirib, rahmat panelini ko'rsatamiz va 3 soniya sanaymiz.
          leadForma.reset();
          leadForma.style.display = "none";
          if (holatEl) holatEl.textContent = "";

          const rahmatPanel = document.getElementById("forma-rahmat");
          const sanoqEl = document.getElementById("sanoq");
          if (rahmatPanel) rahmatPanel.classList.add("korinadi");

          let qoldi = 3;
          if (sanoqEl) sanoqEl.textContent = String(qoldi);

          if (sanoqInterval) clearInterval(sanoqInterval);
          sanoqInterval = setInterval(() => {
            qoldi -= 1;
            if (sanoqEl) sanoqEl.textContent = String(Math.max(qoldi, 0));
            if (qoldi <= 0) {
              if (sanoqInterval) clearInterval(sanoqInterval);
              window.location.href = "https://t.me/AnadoExales_admin";
            }
          }, 1000);
        } catch {
          holatKorsat("Tarmoq xatosi. Internetni tekshirib qayta urinib ko'ring.", "xato");
        } finally {
          if (tugma) {
            tugma.disabled = false;
            if (tugma.dataset.aslMatn) tugma.innerHTML = tugma.dataset.aslMatn;
          }
        }
      };

      leadForma.addEventListener("submit", submitFn);
      cleanups.push(() => leadForma.removeEventListener("submit", submitFn));
    }

    // ========== TELEFON FORMAT ==========
    const telInput = document.getElementById("tel") as HTMLInputElement | null;
    if (telInput) {
      const telFn = (e: Event) => {
        let qiymat = (e.target as HTMLInputElement).value.replace(/\D/g, "");
        if (qiymat.startsWith("998")) qiymat = qiymat.substring(3);

        let format = "";
        if (qiymat.length > 0) format = "+998 ";
        if (qiymat.length > 0) format += qiymat.substring(0, 2);
        if (qiymat.length > 2) format += " " + qiymat.substring(2, 5);
        if (qiymat.length > 5) format += " " + qiymat.substring(5, 7);
        if (qiymat.length > 7) format += " " + qiymat.substring(7, 9);

        (e.target as HTMLInputElement).value = format;
      };
      telInput.addEventListener("input", telFn);
      cleanups.push(() => telInput.removeEventListener("input", telFn));
    }

    // ========== STAT RAQAMLAR COUNT-UP ==========
    const statRaqamlar = document.querySelectorAll<HTMLElement>(".stat-raqam");

    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const matn = el.textContent || "";
            const raqam = parseInt(matn.replace(/\D/g, ""));
            const qoshimcha = matn.replace(/\d/g, "");

            if (!isNaN(raqam) && raqam > 0) {
              let hozir = 0;
              const qadam = Math.ceil(raqam / 50);
              const interval = setInterval(() => {
                hozir += qadam;
                if (hozir >= raqam) {
                  hozir = raqam;
                  clearInterval(interval);
                }
                el.textContent = hozir + qoshimcha;
              }, 30);
            }

            statObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    statRaqamlar.forEach((el) => statObserver.observe(el));
    cleanups.push(() => statObserver.disconnect());

    // ========== HERO RASM PARALLAX ==========
    const heroRasm = document.querySelector<HTMLElement>(".hero-rasm-konteyner");
    if (heroRasm) {
      const parallaxFn = () => {
        const scrolled = window.scrollY;
        if (scrolled < 800) {
          heroRasm.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
      };
      window.addEventListener("scroll", parallaxFn);
      cleanups.push(() => window.removeEventListener("scroll", parallaxFn));
    }

    // ========== KONSOL XABARI ==========
    console.log(
      "%c✨ КОСМИК ШИФО АКАДЕМИЯСИ ✨",
      "color: #C9A961; font-size: 24px; font-weight: bold; font-family: serif;"
    );
    console.log(
      "%c🌟 Ўзликка қайтиш ретрити - 2026 🌟",
      "color: #A88845; font-size: 16px; font-style: italic;"
    );
    console.log(
      "%c💛 Сайт яратилди билан муҳаббат 💛",
      "color: #D4B873; font-size: 14px;"
    );

    // ========== TUNGI REJIM ==========
    const rejimTugma = document.getElementById("rejimTugma");
    const rejimIkon = rejimTugma?.querySelector("i");

    if (rejimTugma && rejimIkon) {
      const tanlanganRejim = localStorage.getItem("rejim");
      if (tanlanganRejim === "tungi") {
        document.body.classList.add("tungi");
        rejimIkon.classList.remove("fa-moon");
        rejimIkon.classList.add("fa-sun");
      }

      const rejimFn = () => {
        document.body.classList.toggle("tungi");
        if (document.body.classList.contains("tungi")) {
          rejimIkon.classList.remove("fa-moon");
          rejimIkon.classList.add("fa-sun");
          localStorage.setItem("rejim", "tungi");
        } else {
          rejimIkon.classList.remove("fa-sun");
          rejimIkon.classList.add("fa-moon");
          localStorage.setItem("rejim", "kunduzgi");
        }
      };
      rejimTugma.addEventListener("click", rejimFn);
      cleanups.push(() => rejimTugma.removeEventListener("click", rejimFn));
    }

    // ========== TIL ALMASHTIRISH — TO'LIQ ==========
    const tilTugma = document.getElementById("tilTugma");
    const tilMatn = tilTugma?.querySelector(".til-matn") as HTMLElement | null;

    // Krill → Lotin lug'ati
    const krillLotin: Record<string, string> = {
      А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "Yo",
      Ж: "J", З: "Z", И: "I", Й: "Y", К: "K", Л: "L", М: "M",
      Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T", У: "U",
      Ф: "F", Х: "X", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Sh",
      Ъ: "'", Ы: "I", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
      Ў: "O'", Қ: "Q", Ғ: "G'", Ҳ: "H",
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
      ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
      н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
      ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh",
      ъ: "'", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
      ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
    };

    function krillToLotin(matn: string) {
      let natija = "";
      for (let i = 0; i < matn.length; i++) {
        const harf = matn[i];
        natija += krillLotin[harf] !== undefined ? krillLotin[harf] : harf;
      }
      return natija;
    }

    const otkazibYuborish = ["SCRIPT", "STYLE", "CODE", "PRE"];

    function barchaMatnlarniTopish(element: HTMLElement, lotinga: boolean) {
      if (otkazibYuborish.includes(element.tagName)) return;

      for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i] as ChildNode & { aslMatn?: string };

        if (node.nodeType === 3) {
          const matn = node.nodeValue || "";
          if (matn && matn.trim()) {
            if (!node.aslMatn) node.aslMatn = matn;
            if (lotinga) node.nodeValue = krillToLotin(node.aslMatn);
            else node.nodeValue = node.aslMatn;
          }
        } else if (node.nodeType === 1) {
          barchaMatnlarniTopish(node as HTMLElement, lotinga);
        }
      }
    }

    function tilniAlmashtirish(lotinga: boolean) {
      barchaMatnlarniTopish(document.body, lotinga);

      const inputlar = document.querySelectorAll<HTMLInputElement>("input[placeholder]");
      inputlar.forEach((input) => {
        if (!input.dataset.aslPlaceholder) {
          input.dataset.aslPlaceholder = input.placeholder;
        }
        if (lotinga) input.placeholder = krillToLotin(input.dataset.aslPlaceholder);
        else input.placeholder = input.dataset.aslPlaceholder;
      });

      if (!document.body.dataset.aslTitle) {
        document.body.dataset.aslTitle = document.title;
      }
      if (lotinga) document.title = krillToLotin(document.body.dataset.aslTitle);
      else document.title = document.body.dataset.aslTitle;
    }

    if (tilTugma && tilMatn) {
      const tanlanganTil = localStorage.getItem("til");
      if (tanlanganTil === "lotin") {
        setTimeout(() => {
          tilniAlmashtirish(true);
          tilMatn.textContent = "КР";
        }, 200);
      }

      const tilFn = () => {
        const hozirgiTil = tilMatn.textContent;
        if (hozirgiTil === "UZ") {
          tilniAlmashtirish(true);
          tilMatn.textContent = "КР";
          localStorage.setItem("til", "lotin");
        } else {
          tilniAlmashtirish(false);
          tilMatn.textContent = "UZ";
          localStorage.setItem("til", "krill");
        }
      };
      tilTugma.addEventListener("click", tilFn);
      cleanups.push(() => tilTugma.removeEventListener("click", tilFn));
    }

    // ========== TEPAGA QAYTISH TUGMASI ==========
    const tepagaQaytishTugma = document.getElementById("tepagaQaytish");
    if (tepagaQaytishTugma) {
      const scrollFn = () => {
        if (window.scrollY > 500) tepagaQaytishTugma.classList.add("korinadi");
        else tepagaQaytishTugma.classList.remove("korinadi");
      };
      window.addEventListener("scroll", scrollFn);

      const clickFn = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      tepagaQaytishTugma.addEventListener("click", clickFn);

      cleanups.push(() => {
        window.removeEventListener("scroll", scrollFn);
        tepagaQaytishTugma.removeEventListener("click", clickFn);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <>
      {/* TIL VA REJIM TUGMALARI */}
      <div className="boshqaruv-tugmalari">
        <button className="rejim-tugma" id="rejimTugma" aria-label="Tungi rejim">
          <i className="fa-solid fa-moon"></i>
        </button>
        <button className="til-tugma" id="tilTugma" aria-label="Tilni almashtirish">
          <span className="til-matn">UZ</span>
        </button>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-fon"></div>

        <div className="hero-logo">
          <i className="fa-solid fa-leaf"></i>
          КОСМИК ШИФО
        </div>

        <a href="#forma" className="hero-yuqori-tugma">
          КУРСДА ИШТИРОК ЭТИШ <i className="fa-solid fa-arrow-right"></i>
        </a>

        <div className="hero-konteyner">
          <div className="hero-ong">
            <div className="fon-shakl-1"></div>
            <div className="fon-shakl-2"></div>
            <div className="fon-shakl-3"></div>
            <div className="fon-naqsh"></div>

            <div className="hero-yulduz hero-yulduz-1">
              <i className="fa-solid fa-spa"></i>
            </div>
            <div className="hero-yulduz hero-yulduz-2">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <div className="hero-yulduz hero-yulduz-3">
              <i className="fa-solid fa-star"></i>
            </div>

            <div className="hero-rasm-konteyner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/rasmlar/heromaster.jpg"
                alt="Анадо EXales — Қалбшунос-Мастер"
                className="hero-rasm"
              />
            </div>
          </div>

          <div className="hero-chap">
            <p className="hero-akademiya">— Космик Шифо Академияси</p>

            <h1 className="hero-sarlavha">
              ЎЗЛИККА
              <span className="hero-kursiv">қайтиш</span>
            </h1>

            <p className="hero-tavsif">
              Тана, руҳ ва онг мувозанати орқали ҳаётнинг{" "}
              <strong>тўлиқлигини</strong> ҳис этинг.
            </p>

            <div className="hero-belgilar">
              <span>10 КУН</span>
              <span className="ajratuvchi">|</span>
              <span>ГРУЗИЯ</span>
              <span className="ajratuvchi">|</span>
              <span>PREMIUM</span>
            </div>

            <div className="hero-tugmalar">
              <a href="#forma" className="btn-asosiy">
                ЖОЙНИ БАНД ҚИЛИШ
                <i className="fa-solid fa-arrow-right"></i>
              </a>
              <a href="#narx" className="btn-link">
                Дастур ва<br />нархларни кўриш{" "}
                <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TAVSIF */}
      <section className="tavsif">
        <div className="container">
          <p className="kichik-yozuv">Биз ҳақимизда</p>
          <h2 className="bolim-sarlavha">РЕТРИТ ҲАҚИДА</h2>
          <div className="oltin-chiziq"></div>

          <p className="tavsif-matn">
            <strong>10 кунлик</strong> трансформацион саёҳат сизни шаҳар ҳаёти
            ғавғоларидан узиб, <strong>Батуми</strong> ва <strong>Тбилиси</strong>{" "}
            шаҳарларида ўзлигингизни кашф этишга, тинч ва уйғун ҳаёт қуришга ёрдам
            беради. Ҳар бир кун — янги тажриба, янги ўзлик кашфиёти.
          </p>
        </div>
      </section>

      {/* KIMLAR UCHUN */}
      <section className="kimlar-uchun">
        <div className="container">
          <p className="kichik-yozuv">Сиз учун</p>
          <h2 className="bolim-sarlavha">КИМЛАР УЧУН?</h2>
          <div className="oltin-chiziq"></div>

          <div className="shartlar-grid">
            <div className="shart-karta">
              <i className="fa-solid fa-check"></i>
              <p>Ўз ўзига қайтишни ва ҳаётини янгидан бошлашни истайдиганлар учун</p>
            </div>
            <div className="shart-karta">
              <i className="fa-solid fa-check"></i>
              <p>Стресс, чарчоқ ва ҳаётдан зерикишни енгмоқчи бўлганлар учун</p>
            </div>
            <div className="shart-karta">
              <i className="fa-solid fa-check"></i>
              <p>Ички мувозанат ва қалб тинчлигини изловчилар учун</p>
            </div>
            <div className="shart-karta">
              <i className="fa-solid fa-check"></i>
              <p>Янги тажриба ва трансформацияни орзу қилувчилар учун</p>
            </div>
          </div>
        </div>
      </section>

      {/* DASTUR */}
      <section className="dastur">
        <div className="container">
          <p className="kichik-yozuv">Нима ўрганасиз</p>
          <h2 className="bolim-sarlavha">7 ТА ДАСТУР</h2>
          <div className="oltin-chiziq"></div>

          <div className="dastur-grid">
            <div className="dastur-karta">
              <span className="raqam">01</span>
              <h3> Анадо EXales билан жонли дарслар</h3>
              <p>
                Профессионал Қалбшунос-Мастер Анадо EXales билан 5 соатлик жонли
                дарслар. Мастернинг юқори энергия майдонида бўлиш ва ўзингиз билан
                чуқур ишлаш имконияти.
              </p>
            </div>
            <div className="dastur-karta">
              <span className="raqam">02</span>
              <h3>Аждод дастурлари билан ишлаш</h3>
              <p>
                Аждоддан-Аждодга ўтиб келаётган ички дастурлар, муносабатлар ва
                такрорланувчи сценарийлар билан ишлаш имконияти.
              </p>
            </div>
            <div className="dastur-karta">
              <span className="raqam">03</span>
              <h3>Онгни кенгайтириш</h3>
              <p>
                Мастернинг жонли энергиялари орқали онг кенгаяди ва ҳаётингизнинг
                турли йўналишларидаги ривожланиш жараёнлари тезлашади.
              </p>
            </div>
            <div className="dastur-karta">
              <span className="raqam">04</span>
              <h3>Бетакрор табиат</h3>
              <p>Мовий денгиз, сарвқомат тоғлар ва яшил табиат қўйнида дам олиш ва янгиланиш.</p>
            </div>
            <div className="dastur-karta">
              <span className="raqam">05</span>
              <h3>Шарқона маданият ва осойишталик</h3>
              <p>Батуми ва Тбилиси шаҳарларининг ўзига хос муҳити, миллий таомлари ва меҳмондўстлиги.</p>
            </div>
            <div className="dastur-karta">
              <span className="raqam">06</span>
              <h3>Муқаддас жойлар ва ички саёҳат</h3>
              <p>
                Медитациялар, инициациялар, сукут амалиётлари ва энергияни тозаловчи
                машқлар орқали ички мувозанатни тиклаш.
              </p>
            </div>
            <div className="dastur-karta">
              <span className="raqam">07</span>
              <h3> Юлдузлар остидаги кечалар</h3>
              <p>Денгиз шовқини, юлдузлар жилваси ва руҳни енгиллаштирувчи кечки амалиётлар.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MASTER */}
      <section className="master-bolim" id="master">
        <div className="container">
          <h2 className="bolim-sarlavha">МАСТЕР ҲАҚИДА</h2>
          <div className="oltin-chiziq"></div>

          <div className="master-grid">
            <div className="master-rasm-blok">
              <div className="master-doira master-doira-1"></div>
              <div className="master-doira master-doira-2"></div>

              <div className="master-nuqta master-nuqta-1"></div>
              <div className="master-nuqta master-nuqta-2"></div>
              <div className="master-nuqta master-nuqta-3"></div>

              <div className="master-rasm-konteyner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/rasmlar/hero-master.jpg" alt="Анадо EXales" className="master-rasm" />

                <div className="master-online">
                  <span className="online-nuqta"></span>
                  Онлайн
                </div>
              </div>

              <div className="master-badge master-badge-1">
                <i className="fa-solid fa-award"></i>
                <div>
                  <strong>9+ йил</strong>
                  <span>Тажриба</span>
                </div>
              </div>

              <div className="master-badge master-badge-2">
                <i className="fa-solid fa-id-card"></i>
                <div>
                  <strong>Ассоциация</strong>
                  <span>Аъзоси</span>
                </div>
              </div>
            </div>

            <div className="master-matn-blok">
              <h3 className="master-ism">
                АНАДО <span className="kursiv-ism">EXales ким ?</span>
              </h3>

              <p className="master-unvon">
                <i className="fa-solid fa-brain"></i>
                Трансформацион Психолог
              </p>

              <p className="master-tavsif">
                <strong>Олий маълумотли</strong> трансформацион психолог. Психологлар
                ассоциацияси аъзоси. <strong>9 йиллик</strong> бой тажрибага эга. Онг
                остининг энг чуқур қаватларидаги{" "}
                <strong>пул, соғлиқ, муносабатлар</strong>га оид программалар ва
                чекловлар билан <strong>ген даражасида</strong> ишлайди.
              </p>

              <ul className="master-yutuqlar">
                <li>
                  <i className="fa-solid fa-graduation-cap"></i>
                  <strong>Олий маълумотли</strong> трансформацион психолог
                </li>
                <li>
                  <i className="fa-solid fa-id-badge"></i>
                  <strong>Психологлар ассоциацияси</strong> аъзоси
                </li>
                <li>
                  <i className="fa-solid fa-circle-check"></i>
                  <strong>9 йиллик</strong> амалий тажриба
                </li>
                <li>
                  <i className="fa-solid fa-dna"></i>
                  Онг ости билан <strong>ген даражасида</strong> ишлаш
                </li>
                <li>
                  <i className="fa-solid fa-coins"></i>
                  Пул, соғлиқ, муносабатлар <strong>чекловлари</strong>
                </li>
              </ul>

              <p className="master-imzo">
                <i className="fa-solid fa-pen-nib"></i>
                Анадо EXales
              </p>

              <div className="master-statistika">
                <div className="stat-item">
                  <div className="stat-raqam">9+</div>
                  <div className="stat-belgi">Йил тажриба</div>
                </div>
                <div className="stat-item">
                  <div className="stat-raqam">1000+</div>
                  <div className="stat-belgi">Мижозлар</div>
                </div>
                <div className="stat-item">
                  <div className="stat-raqam">50+</div>
                  <div className="stat-belgi">Ретритлар</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 KUNLIK DASTUR */}
      <section className="kun-dastur">
        <div className="container">
          <p className="kichik-yozuv">Кунма-кун</p>
          <h2 className="bolim-sarlavha-oq">10 КУНЛИК ДАСТУР</h2>
          <div className="oltin-chiziq-oq"></div>

          <div className="kun-grid">
            <div className="kun-karta">
              <span className="kun-raqam">01</span>
              <h4>КЕЛИШ КУНИ</h4>
              <p>Тошкент — Батуми, отелга жойлашиш, танишув</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">02</span>
              <h4>ОЧИЛИШ</h4>
              <p>Ретритнинг расмий очилиши ва ниятлар маросими</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">03</span>
              <h4>МЕДИТАЦИЯ</h4>
              <p>Денгиз бўйида чуқур медитация машғулотлари</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">04</span>
              <h4>ҚАЛБ ТАҲЛИЛИ</h4>
              <p>Ички дунёни тушуниш машғулотлари</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">05</span>
              <h4>Аждод дастурлари билан ишлаш</h4>
              <p>Аждоддан-аждодга ўтиб келаётган такрорланувчи сценарийлар билан ишлаш имконияти.</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">06</span>
              <h4>ТРАНСФЕР</h4>
              <p>Батуми — Тбилиси, янги муҳитга кириш</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">07</span>
              <h4>ЭНЕРГИЯ</h4>
              <p>Энергия мувозанатини ўрнатиш ва тозалаш</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">08</span>
              <h4>ҚАЛБ САЁҲАТИ</h4>
              <p>Чуқур ўзлик тажрибаси</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">09</span>
              <h4>ИНТЕГРАЦИЯ</h4>
              <p>Билимларни жамлаш ва режа тузиш</p>
            </div>
            <div className="kun-karta">
              <span className="kun-raqam">10</span>
              <h4>ҚАЙТИШ</h4>
              <p>Сертификат, ЯКУН ВА ЯНГИ БОШЛАНИШ</p>
            </div>
          </div>
        </div>
      </section>

      {/* TAYMER */}
      <section className="taymer-bolim">
        <div className="container">
          <p className="taymer-sarlavha">РЕТРИТГАЧА ҚОЛГАН ВАҚТ</p>

          <div className="taymer">
            <div className="taymer-katak">
              <div className="taymer-raqam" id="kunlar">00</div>
              <div className="taymer-belgi">Кун</div>
            </div>
            <div className="taymer-katak">
              <div className="taymer-raqam" id="soatlar">00</div>
              <div className="taymer-belgi">Соат</div>
            </div>
            <div className="taymer-katak">
              <div className="taymer-raqam" id="daqiqalar">00</div>
              <div className="taymer-belgi">Дақиқа</div>
            </div>
            <div className="taymer-katak">
              <div className="taymer-raqam" id="soniyalar">00</div>
              <div className="taymer-belgi">Сония</div>
            </div>
          </div>

          <p className="taymer-ogohlantirish">
            <strong>Жойлар чекланган!</strong> Атиги 15 та жой
          </p>
        </div>
      </section>

      {/* NATIJALAR */}
      <section className="natijalar">
        <div className="container">
          <p className="kichik-yozuv">Натижалар</p>
          <h2 className="bolim-sarlavha">НИМАГА ЭРИШАСИЗ?</h2>
          <div className="oltin-chiziq"></div>

          <div className="natija-grid">
            <div className="natija-item">
              <i className="fa-solid fa-heart"></i>
              <p>Ички енгиллик</p>
            </div>
            <div className="natija-item">
              <i className="fa-solid fa-spa"></i>
              <p>Руҳий хотиржамлик</p>
            </div>
            <div className="natija-item">
              <i className="fa-solid fa-sun"></i>
              <p>Янги қарашлар</p>
            </div>
            <div className="natija-item">
              <i className="fa-solid fa-leaf"></i>
              <p>Ўзлик тушуниш</p>
            </div>
            <div className="natija-item">
              <i className="fa-solid fa-star"></i>
              <p>Янги дўстлар</p>
            </div>
            <div className="natija-item">
              <i className="fa-solid fa-bolt"></i>
              <p>Янги энергия</p>
            </div>
            <div className="natija-item">
              <i className="fa-solid fa-award"></i>
              <p>Сертификат</p>
            </div>
          </div>
        </div>
      </section>

      {/* NARX */}
      <section className="narx" id="narx">
        <div className="container">
          <p className="kichik-yozuv">Инвестиция</p>
          <h2 className="bolim-sarlavha">ИШТИРОК НАРХИ</h2>
          <div className="oltin-chiziq"></div>

          <div className="narx-karta">
            <p className="narx-asosiy">
              <span className="narx-belgi">$</span>
              <span className="narx-raqam">2200</span>
            </p>

            <p className="narx-eslatma">— тўлиқ премиум ретрит дастури</p>

            <ul className="narx-tarkib">
              <li><i className="fa-solid fa-check"></i> 10 кунлик трансформацион дастур</li>
              <li><i className="fa-solid fa-check"></i> Авиабилет (Тошкент — Батуми — Тошкент)</li>
              <li><i className="fa-solid fa-check"></i> Барча трансферлар</li>
              <li><i className="fa-solid fa-check"></i> 5 юлдузли отелда яшаш</li>
              <li><i className="fa-solid fa-check"></i> Кунлик нонушталар</li>
              <li><i className="fa-solid fa-check"></i> Тиббий суғурта</li>
              <li><i className="fa-solid fa-check"></i> Иштирок сертификати</li>
            </ul>

            <div className="narx-ogohlantirish">
              <i className="fa-solid fa-circle-info"></i>
              Тушлик ва кечки овқат киритилмаган
            </div>

            <div className="narx-ogohlantirish">
              <i className="fa-solid fa-circle-info"></i>
              Жойни банд қилиш учун 1000$ олдиндан тўлов
            </div>

            <a href="#forma" className="btn-narx">
              ЖОЙНИ БАНД ҚИЛИШ
              <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </section>

      {/* SERTIFIKAT */}
      <section className="sertifikat">
        <div className="container">
          <i className="fa-solid fa-award sertifikat-ikon"></i>
          <h2>СЕРТИФИКАТ</h2>
          <p>
            Ретрит сўнгида ҳар бир иштирокчи{" "}
            <strong>халқаро намунадаги сертификат</strong> олади. Бу — сизнинг қалбий
            саёҳат тажрибангизнинг расмий тасдиғи.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="container">
          <p className="kichik-yozuv">Саволлар</p>
          <h2 className="bolim-sarlavha">КЎП БЕРИЛАДИГАН САВОЛЛАР</h2>
          <div className="oltin-chiziq"></div>

          <div className="faq-grid">
            <div className="faq-item">
              <div className="faq-savol">
                <span>Грузияга виза керакми?</span>
                <i className="fa-solid fa-plus"></i>
              </div>
              <div className="faq-javob">
                <p>Йўқ! Ўзбекистон фуқаролари учун Грузияга виза талаб қилинмайди. Фақат халқаро паспортингиз бўлиши кифоя.</p>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-savol">
                <span>Олдин тажриба бўлиши керакми?</span>
                <i className="fa-solid fa-plus"></i>
              </div>
              <div className="faq-javob">
                <p>Йўқ, олдинги тажриба шарт эмас. Биз сизни бошланғич даражадан бошлаб, чуқур билим ва тажрибаларга олиб борамиз.</p>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-savol">
                <span>Тўловни қандай амалга оширишим керак?</span>
                <i className="fa-solid fa-plus"></i>
              </div>
              <div className="faq-javob">
                <p>Жойни банд қилиш учун 1000$ олдиндан тўлов керак. Қолган суммани ретрит бошланишидан 1 ой олдин тўлайсиз. </p>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-savol">
                <span>Бўлиб тўлаш мумкинми?</span>
                <i className="fa-solid fa-plus"></i>
              </div>
              <div className="faq-javob">
                <p>Ҳа, мумкин! Олдиндан 1000$ тўлайсиз, қолган суммани 2-3 қисмга бўлиб тўлаш имконияти мавжуд.</p>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-savol">
                <span>Тошкентдан бошқа шаҳардан учмоқчиман</span>
                <i className="fa-solid fa-plus"></i>
              </div>
              <div className="faq-javob">
                <p>Бошқа шаҳардан учиш мумкин. Бизга ёзинг, биз сизнинг шаҳрингиздан учиш режасини ишлаб чиқамиз.</p>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-savol">
                <span>Қандай кийим олиб келиш керак?</span>
                <i className="fa-solid fa-plus"></i>
              </div>
              <div className="faq-javob">
                <p>Ёзги кийимлар, бир-икки тантанали либос, машғулот учун қулай кийим, шиппак ва пойафзал. Тўлиқ рўйхатни рўйхатдан ўтгандан сўнг юборамиз.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMA */}
      <section className="forma" id="forma">
        <div className="container">
          <p className="kichik-yozuv">Боғланиш</p>
          <h2 className="bolim-sarlavha-oq">РЕТРИТГА ЁЗИЛИШ</h2>
          <div className="oltin-chiziq-oq"></div>

          <p className="forma-tavsif">
            Бизга маълумотларингизни юборинг — мутахассисимиз сиз билан тез орада
            боғланади ва барча саволларингизга жавоб беради.
          </p>

          <form className="lead-forma" id="leadForma" noValidate>
            <input
              type="text"
              id="ism"
              name="ism"
              placeholder="Исм ва фамилия"
              autoComplete="name"
              maxLength={60}
              required
            />
            <span className="err-matn" id="err-ism"></span>

            <input
              type="tel"
              id="tel"
              name="tel"
              placeholder="Телефон рақам"
              autoComplete="tel"
              inputMode="tel"
              maxLength={20}
              required
            />
            <span className="err-matn" id="err-tel"></span>

            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email (ихтиёрий)"
              autoComplete="email"
              maxLength={120}
            />
            <span className="err-matn" id="err-email"></span>

            {/* Honeypot — botlarni tutish uchun. Odam ko'rmaydi/to'ldirmaydi. */}
            <input
              type="text"
              id="veb_sayt"
              name="veb_sayt"
              className="honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <button type="submit" className="btn-forma">
              РЕТРИТГА ЁЗИЛИШ
              <i className="fa-solid fa-arrow-right"></i>
            </button>

            <p className="forma-holat" id="forma-holat" role="status" aria-live="polite"></p>
          </form>

          {/* RAHMAT PANELI — forma yuborilgach ko'rsatiladi */}
          <div className="forma-rahmat" id="forma-rahmat">
            <div className="rahmat-ikon">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 className="rahmat-sarlavha">МАЪЛУМОТИНГИЗ ЮБОРИЛДИ</h3>
            <p className="rahmat-matn">
              Раҳмат! Аризангиз қабул қилинди. Тез орада сиз билан боғланамиз.
            </p>
            <div className="rahmat-sanoq">
              <span className="sanoq-raqam" id="sanoq">3</span>
            </div>
            <p className="rahmat-eslatma">сониядан сўнг Telegram'га йўналтирасиз...</p>
          </div>

          <p className="forma-imzo">
            <i className="fa-solid fa-pen-nib"></i>
            Сизни кутамиз
          </p>
        </div>
      </section>

      {/* TEPAGA QAYTISH TUGMASI */}
      <button className="tepaga-qaytish" id="tepagaQaytish" aria-label="Tepaga qaytish">
        <i className="fa-solid fa-arrow-up"></i>
      </button>

      {/* ALOQA TUGMALARI */}
      <div className="aloqa-tugmalari">
        <a href="https://t.me/AnadoExales_admin" target="_blank" className="aloqa-tugma telegram-tugma">
          <i className="fa-brands fa-telegram"></i>
          <span className="tugma-tooltip">Telegram орқали ёзиш</span>
        </a>

        <a href="tel:+998958332727" className="aloqa-tugma telefon-tugma">
          <i className="fa-solid fa-phone"></i>
          <span className="tugma-tooltip">Қўнғироқ қилиш</span>
        </a>
      </div>
    </>
  );
}
