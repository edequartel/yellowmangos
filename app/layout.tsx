import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Yellow Mangoes",
  description: "Markdown to pages on Vercel"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
