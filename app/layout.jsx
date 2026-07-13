import "./globals.css";
import Script from "next/script";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import BottomNav from "./_components/BottomNav";

const GA_ID = "G-G2FM2450HS";

export const metadata = {
  metadataBase: new URL("https://departamentosenpozo.com.ar"),
  title: {
    default: "Departamentos en Pozo | Inversiones Inmobiliarias en Buenos Aires",
    template: "%s",
  },
  description:
    "Portal de análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA. Compará desarrolladoras, precios y potencial de ganancia barrio por barrio.",
  alternates: { canonical: "https://departamentosenpozo.com.ar/" },
  openGraph: {
    type: "website",
    siteName: "Departamentos en Pozo",
    locale: "es_AR",
    url: "https://departamentosenpozo.com.ar/",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html className="scroll-smooth" lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Work+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface selection:bg-secondary-container font-body-md">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
