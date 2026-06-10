import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosugi-3dmap.onrender.com";
const ogImageUrl = "/og-image.png?v=20260610-flood-risk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "武蔵小杉 3D Walk + Safety Map",
  description:
    "Google 3D MapsとGISデータを使い、街歩きの楽しさと防災情報を同じ3D空間で確認する武蔵小杉エリアのPoCです。",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "武蔵小杉 3D Walk + Safety Map",
    description:
      "Google 3D MapsとGISデータを使い、街歩きの楽しさと防災情報を同じ3D空間で確認する武蔵小杉エリアのPoCです。",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "武蔵小杉 3D Walk + Safety Map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "武蔵小杉 3D Walk + Safety Map",
    description:
      "Google 3D MapsとGISデータを使い、街歩きの楽しさと防災情報を同じ3D空間で確認する武蔵小杉エリアのPoCです。",
    images: [ogImageUrl],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
