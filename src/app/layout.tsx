import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} min-h-screen bg-gray-50 flex items-center justify-center`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
