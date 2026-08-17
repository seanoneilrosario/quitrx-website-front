import Link from "next/link";
import { PageHeading } from "@/components/account/AccountShell";

export default function AccountPage() {
  return <>
    <PageHeading eyebrow="Saturday, 15 August" title="Good morning, Alex" copy="Here’s an overview of your QuitRX care and recent activity." action={<Link className="account-button secondary" href="/account/profile">Manage profile</Link>}/>
    <section className="account-hero-card">
      <div><span className="account-kicker">Your quit journey</span><h2>You’re making meaningful progress.</h2><p>Your treatment plan is active. Keep following the directions from your prescriber, and reach out if you need support.</p><div className="account-progress"><span style={{width:"62%"}}/></div><small>Plan progress · Week 5 of 8</small></div>
      <div className="account-hero-stat"><strong>35</strong><span>smoke-free days</span></div>
    </section>
    <div className="account-grid stats">
      <article className="account-stat"><span>Next consultation</span><strong>22 Aug</strong><small>10:30 am · Telehealth</small></article>
      <article className="account-stat"><span>Prescription repeats</span><strong>2 left</strong><small>Valid until 12 Dec 2026</small></article>
      <article className="account-stat"><span>Latest order</span><strong>On its way</strong><small>Expected 18–20 Aug</small></article>
    </div>
    <div className="account-grid dashboard-bottom">
      <section className="account-card"><div className="card-heading"><div><span>Order #QR-10482</span><h2>Your order is on its way</h2></div><span className="status">In transit</span></div><div className="timeline"><i className="done"/><i className="done"/><i className="current"/><i/></div><div className="timeline-labels"><span>Ordered</span><span>Packed</span><span>Shipped</span><span>Delivered</span></div><p className="muted">Estimated delivery: 18–20 August</p><Link className="text-link" href="/account/orders">View order details →</Link></section>
      <section className="account-card support-card"><span className="account-kicker">Need a hand?</span><h2>We’re here to support you.</h2><p>Speak with the QuitRX team about your order, treatment, or account.</p><Link className="account-button" href="/contact">Contact support</Link></section>
    </div>
  </>;
}
