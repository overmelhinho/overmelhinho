import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import GlobalPopup from "@/components/GlobalPopup";
import GlobalCityModal from "@/components/GlobalCityModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.overmelhinho.com.br"),
  title: "O Vermelhinho | Maior Guia de Empresas e Negócios da Serra Gaúcha",
  description: "Encontre as melhores empresas, prestadores de serviços, profissionais de saúde e vagas de emprego em Farroupilha, Caxias do Sul e região. Busque no O Vermelhinho!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow some zoom for accessibility, but keep it constrained
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased bg-gray-50 overflow-x-hidden`}
      >
        <Providers>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <>
              <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `}
              </Script>
            </>
          )}
          <Header />
          <GlobalPopup />
          <GlobalCityModal />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
