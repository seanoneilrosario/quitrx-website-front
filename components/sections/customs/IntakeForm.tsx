"use client";

import { useEffect, useRef } from "react";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { buildQuitRxFormUrl } from "@/lib/quitRxFormUrls";
import "./IntakeForm.css";
import "./FormBackButton.css";
import FormBackButton from "./FormBackButton";

const FORM_ID = "n3JR1Lhg5OV91in2ovvhZMReVat5zQRQnwEmd6GYusw";

type IntakeFormProps = {
  title?: string;
  paddingTop?: number;
  paddingBottom?: number;
};

export default function IntakeForm({ title }: IntakeFormProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { customer, loading } = useAccountCustomer();

  useEffect(() => {
    if (loading) return;
    const url = buildQuitRxFormUrl("intake", customer);
    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.forEach((value, key) => {
      if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "gclid") {
        url.searchParams.set(key, value);
      }
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
    <section className="intake-form">
      <FormBackButton />
      <div className="intake-form__inner">
        {title && <h2 className="intake-form__title">{title}</h2>}
        <iframe
          ref={iframeRef}
          className="intake-form__iframe"
          title="QuitRX Intake Form"
          allow="geolocation"
        />
      </div>
    </section>
  );
}
