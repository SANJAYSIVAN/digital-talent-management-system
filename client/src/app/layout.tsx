import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Talent Management System",
  description:
    "Digital Talent Management System with authentication, task workflows, role-based access, and profile-driven dashboard insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
