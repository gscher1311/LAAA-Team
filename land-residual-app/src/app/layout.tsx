import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Land Residual Analysis | LAAA Team",
  description: "Internal tool for generating client-facing Land Residual Analysis reports for Los Angeles development deals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
