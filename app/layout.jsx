import "./globals.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import BottomNav from "./_components/BottomNav";

export const metadata = {
  metadataBase: new URL("https://departamentosenpozo.com.ar"),
  title: "Departamentos en Pozo | Inversiones Inmobiliarias en Buenos Aires",
  description:
    "Portal de análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA. Compará desarrolladoras, precios y potencial de ganancia barrio por barrio.",
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
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
