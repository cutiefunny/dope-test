import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
  applicationName: "dope-test",
  title: {
    default: "dope-test",
    template: "dope-test",
  },
  description: "dope-test",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "dope-test",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "dope-test",
    title: {
      default: "dope-test",
      template: "dope-test",
    },
    description: "dope-test",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "lightgray",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
