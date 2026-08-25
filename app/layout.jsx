import "./globals.css";
import { Libre_Caslon_Text, Work_Sans } from "next/font/google";
import Script from "next/script";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import BottomNav from "./_components/BottomNav";
import AuthProvider from "./_auth/AuthProvider";
import AsesorLauncher from "./asesor/AsesorLauncher";
import PlanToast from "./_components/PlanToast";
import PlanContextBar from "./_components/PlanContextBar";
import { SITE, GA_ID } from "../lib/constants";

// Fuentes self-hosteadas por Next (next/font): se sirven desde nuestro dominio, con
// preload automático y display:swap. Elimina las 2 <link> render-blocking a Google Fonts
// que disparaban el FCP en TODAS las páginas. Se exponen como variables CSS y globals.css
// + tailwind.config las consumen vía var(--font-serif) / var(--font-sans).
const fontSerif = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-serif",
  fallback: ["Georgia", "serif"],
});
const fontSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Departamentos en Pozo | Inversiones Inmobiliarias en Buenos Aires",
    template: "%s",
  },
  description:
    "Portal de análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA. Compará desarrolladoras, precios y potencial de ganancia barrio por barrio.",
  // NO canonical global acá: cada página setea el suyo (buildMeta). Un canonical fijo
  // a la home se aplicaba a todas las páginas y hacía que Google las consolidara mal.
  openGraph: {
    type: "website",
    siteName: "Departamentos en Pozo",
    locale: "es_AR",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html className={`scroll-smooth ${fontSerif.variable} ${fontSans.variable}`} lang="es">
      <head>
        {/* Solo queda Material Symbols (íconos) desde Google. Las fuentes de texto ya se
            self-hostean con next/font, sin request externo ni render-block. Preconnect
            acelera la carga del icon-font. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Warm-up de conexión para GTM/GA (antes se cargaban en frío). */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&icon_names=add_business,analytics,apartment,arrow_back,arrow_forward,arrow_upward,auto_awesome,badge,bolt,bookmark,business,calculate,calendar_today,call,chat,check,check_circle,chevron_left,chevron_right,close,construction,currency_exchange,domain,download,edit,edit_note,event,event_available,expand_more,explore,fact_check,favorite,forum,gavel,grid_view,groups,history,home,image,info,insights,location_city,location_on,login,logout,mail,map,mark_email_read,menu,menu_book,notifications_active,open_in_new,payments,person,photo_library,play_arrow,progress_activity,query_stats,quiz,radio_button_unchecked,rate_review,real_estate_agent,refresh,savings,schedule,search,search_off,send,share,smart_display,space_dashboard,storefront,support_agent,table_rows,timeline,trending_up,tune,verified,verified_user,visibility&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface selection:bg-secondary-container font-body-md">
        {/* GA a lazyOnload: se carga después del onload para no bloquear el hilo principal
            (el audit medía ~700ms de TBT por GTM). Analytics se registra igual, apenas más tarde. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="lazyOnload"
        />
        <Script id="ga4" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <AuthProvider>
          <Header />
          <PlanContextBar />
          <main>{children}</main>
          <Footer />
          <AsesorLauncher />
          <PlanToast />
        </AuthProvider>
      </body>
    </html>
  );
}
