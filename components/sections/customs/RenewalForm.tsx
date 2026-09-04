"use client";

import { useEffect, useRef } from "react";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { buildQuitRxFormUrl } from "@/lib/quitRxFormUrls";
import "./EscriptRequest.css";
import "./FormBackButton.css";
import FormBackButton from "./FormBackButton";

const FORM_ID = "Zc9s8aLGPTVQntvZrepRaqSCsgNugnAh0z_ApC8x2XY";

export default function RenewalForm() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { customer, loading } = useAccountCustomer();

  useEffect(() => {
    if (loading) return;
    const url = buildQuitRxFormUrl("renewal", customer);
    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.forEach((value, key) => {
      if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "gclid") url.searchParams.set(key, value);
    });
    url.searchParams.set("referrername", window.location.href.slice(0, 1800));
    if (iframeRef.current) iframeRef.current.src = url.toString();
  }, [customer, loading]);

  useEffect(() => {
    function resizeForm(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow || typeof event.data !== "string") return;
      const [formId, height, shouldScroll] = event.data.split("|");
      if (formId !== FORM_ID || !iframeRef.current) return;
      const nextHeight = Number.parseInt(height, 10);
      if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
      iframeRef.current.style.height = `${nextHeight + 15}px`;
      if (shouldScroll) iframeRef.current.scrollIntoView({ behavior: "smooth" });
    }

    window.addEventListener("message", resizeForm);
    return () => window.removeEventListener("message", resizeForm);
  }, []);

  return (
    <section className="escript-request">
      <FormBackButton />
      <div className="escript-request__inner">
        <iframe
          ref={iframeRef}
          className="escript-request__iframe"
          title="QuitRX Script Renewal"
        />
      </div>
    </section>
  );
}
