import type { Metadata } from "next";
import { Fraunces, Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "conversor.io — do códice ao código",
  description:
    "A oficina renascentista dos seus arquivos. Converta planilhas, documentos, dados e mídia com a precisão de um mestre.",
};

/** Aplica o tema antes da pintura (sistema + escolha salva) para evitar FOUC. */
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full", "antialiased", fraunces.variable, inter.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: anti-FOUC theme bootstrap */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
