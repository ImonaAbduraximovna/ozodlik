import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ЎЗЛИККА ҚАЙТИШ — Грузия Ретрити 2026",
  description:
    "10 кунлик трансформацион ретрит Грузияда. 18-28 июль 2026. Анадо EXales билан ўзлигингизга қайтинг.",
  openGraph: {
    title: "ЎЗЛИККА ҚАЙТИШ — Грузия Ретрити",
    description: "10 кунлик трансформацион ретрит Грузияда. 18-28 июль 2026.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Marcellus&family=Italianno&family=Cinzel:wght@400;500;600&family=Jost:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
