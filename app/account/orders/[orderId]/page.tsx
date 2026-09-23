import Link from "next/link";
import { PageHeading } from "@/components/account/AccountShell";
import OrderDetails from "@/components/account/OrderDetails";

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <>
    <PageHeading
      eyebrow="Purchase history"
      title="Order details"
      copy="Review the status, items, and total for this order."
      action={<Link href="/account/orders" className="account-button">Back to orders</Link>}
    />
    <OrderDetails orderId={orderId} />
  </>;
}
