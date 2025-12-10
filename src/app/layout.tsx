import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Painel COBOM - Sistema de Gestão",
  description: "Sistema de gestão e aplicativos do Corpo de Bombeiros - COBOM",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans custom-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}