import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const josefinHeading = Josefin_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Skedio | Intelligent School Timetable Platform",
    template: "%s | Skedio"
  },
  description: "Skedio is a premium school timetable management platform. Automatically detect conflicts and optimize teacher workload with our intelligent scheduling engine.",
  keywords: ["school timetable", "scheduling software", "education management", "intelligent timetable", "school administration", "teacher scheduling", "Skedio"],
  authors: [{ name: "Onkar Gaikwad" }],
  creator: "Onkar Gaikwad",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://skedio.com",
    title: "Skedio | Intelligent School Timetable Platform",
    description: "Premium School Timetable Management Platform. Automatically detect conflicts and optimize teacher workload.",
    siteName: "Skedio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skedio | Intelligent School Timetable Platform",
    description: "Premium School Timetable Management Platform. Automatically detect conflicts and optimize teacher workload.",
    creator: "@onkargaikwad",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${josefinHeading.variable} ${josefin.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
