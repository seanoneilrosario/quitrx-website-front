"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/script-access";

type TreatmentCtaLinkProps = {
  className?: string;
  defaultLabel: ReactNode;
  children?: ReactNode;
  openInNewTab?: boolean;
};

export default function TreatmentCtaLink({
  className,
  defaultLabel,
  children,
  openInNewTab = false,
}: TreatmentCtaLinkProps) {
  const { customer } = useAccountCustomer();
  const canShop = hasActiveScript(customer);

  return (
    <Link
      href="/account/continue"
      className={className}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
    >
      {canShop ? "Shop Pharmacy" : defaultLabel}
      {children}
    </Link>
  );
}
