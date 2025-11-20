import type { Metadata, Viewport } from "next"; // Import Viewport
import { Inter } from "next/font/google";
import "./globals.css";
import { AppKitModal } from "../context/AppKitModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solana Reward",
  description: "Claim your allocation",
};

// INI YANG BIKIN PRESISI DI HP (FULL SCREEN)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Supaya user gak bisa zoom-zoom sendiri
  themeColor: "#000000", // Bar status HP jadi hitam
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppKitModal>{children}</AppKitModal>
      </body>
    </html>
  );
}