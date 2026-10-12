import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulso+ | Finanzas personales",
  description: "Una mirada más clara a tus gastos personales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
