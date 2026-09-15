import { PageHeading } from "@/components/account/AccountShell";
import OrderHistoryTable from "@/components/account/OrderHistoryTable";

export default function OrdersPage() {
  return <>
    <PageHeading eyebrow="Purchase history" title="Your orders" copy="Review deliveries, order details, and receipts." />
    <section className="account-card table-card"><OrderHistoryTable /></section>
  </>;
}
