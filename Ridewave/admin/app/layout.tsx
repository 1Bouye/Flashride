import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flashride Admin",
  description: "Administrative dashboard for reviewing driver registrations"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

