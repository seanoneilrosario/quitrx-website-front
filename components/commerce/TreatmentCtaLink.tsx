"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/script-access";

type TreatmentCtaLinkProps = {
  className?: string;
  defaultLabel: ReactNode;
  children?: ReactNode;
};

export default function TreatmentCtaLink({
  className,
  defaultLabel,
  children,
}: TreatmentCtaLinkProps) {
  const { customer } = useAccountCustomer();
  const canShop = hasActiveScript(customer);

  return (
    <Link href="/account/continue" className={className}>
      {canShop ? "Shop Pharmacy" : defaultLabel}
      {children}
    </Link>
  );
}
