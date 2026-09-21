import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sourcing Refinement Loop",
  description: "Flexiple engineering challenge submission",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
