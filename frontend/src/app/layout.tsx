import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import PasswordGate from "@/components/PasswordGate";

export const metadata: Metadata = {
  title: "Cerebrum",
  description: "AI-powered document intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <PasswordGate>
          <Nav />
          <main className="flex-1 flex flex-col">{children}</main>
        </PasswordGate>
      </body>
    </html>
  );
}
