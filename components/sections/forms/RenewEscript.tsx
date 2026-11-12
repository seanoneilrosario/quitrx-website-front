"use client";

import { useEffect, useRef } from "react";
import { useAccountCustomer, useCustomerDataInvalidation } from "@/hooks/useAccountCustomer";
import { escriptRenewalUrl } from "@/lib/account/escript-renewal";
import "./escript-request.css";
import "./form-back-button.css";
import FormBackButton from "./FormBackButton";

const FORM_ID = "WYCZQquSgJ_aeL7brgxtrkDlbZiA7dnpQK-2cXcc-G4";

type RenewEscriptProps = {
  title?: string;
  paddingTop?: number;
  paddingBottom?: number;
};

export default function RenewEscript({ title }: RenewEscriptProps) {
  useCustomerDataInvalidation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { customer, loading } = useAccountCustomer();

  useEffect(() => {
    if (loading) return;
    const controller = new AbortController();
    async function loadForm() {
      let formUrl = escriptRenewalUrl(customer ?? {});
      if (customer?.id) {
        try {
          const response = await fetch("/api/account/escript-renewal", {
            cache: "no-store",
            signal: controller.signal,
          });
          const result = response.ok ? await response.json() : null;
          if (result?.url) formUrl = result.url;
        } catch {
          // Use available account details if the latest details cannot be loaded.
        }
      }
      if (controller.signal.aborted) return;
      const url = new URL(formUrl);
      url.searchParams.set("zf_rszfm", "1");
      const pageUrl = new URL(window.location.href);
      pageUrl.searchParams.forEach((value, key) => {
        if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "gclid")
          url.searchParams.set(key, value);
      });
      url.searchParams.set("referrername", window.location.href.slice(0, 1800));
      if (iframeRef.current) iframeRef.current.src = url.toString();
    }
    void loadForm();
    return () => controller.abort();
  }, [customer, loading]);

  useEffect(() => {
    function resizeForm(event: MessageEvent) {
      if (event.origin !== "https://forms.quitrx.com.au") return;
      if (event.source !== iframeRef.current?.contentWindow || typeof event.data !== "string")
        return;
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
        {title && <h2 className="escript-request__title">{title}</h2>}
        <iframe
          ref={iframeRef}
          className="escript-request__iframe"
          title="QuitRX Renew eScript"
          allow="geolocation"
        />
      </div>
    </section>
  );
}
