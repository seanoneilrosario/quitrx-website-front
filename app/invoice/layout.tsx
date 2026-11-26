import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: {
    absolute: "Invoice payment | QuitRX",
  },
  description: "Securely view and pay a QuitRX invoice.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
  referrer: "no-referrer",
};

export default function InvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
