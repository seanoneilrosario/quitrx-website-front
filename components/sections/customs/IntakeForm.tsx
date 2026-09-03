"use client";

import { useEffect, useRef } from "react";
import "./IntakeForm.css";

const FORM_ID = "n3JR1Lhg5OV91in2ovvhZMReVat5zQRQnwEmd6GYusw";
const FORM_ORIGIN = "https://forms.quitrx.com.au";
const FORM_URL = `${FORM_ORIGIN}/quickrx/form/QuitRXIntakeForm/formperma/${FORM_ID}?zf_rszfm=1`;

type IntakeFormProps = {
  title?: string;
  paddingTop?: number;
  paddingBottom?: number;
};

export default function IntakeForm({ title, paddingTop = 80, paddingBottom = 80 }: IntakeFormProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const url = new URL(FORM_URL);
    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.forEach((value, key) => {
      if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "gclid") {
        url.searchParams.set(key, value);
      }
    });
    url.searchParams.set("referrername", window.location.href.slice(0, 1800));
    if (iframeRef.current) iframeRef.current.src = url.toString();

    function resizeForm(event: MessageEvent) {
      if (event.origin !== FORM_ORIGIN || typeof event.data !== "string") return;
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
    <section className="intake-form" style={{ paddingTop, paddingBottom }}>
      <div className="page-width">
        {title && <h2 className="intake-form__title">{title}</h2>}
        <iframe
          ref={iframeRef}
          className="intake-form__iframe"
          src={FORM_URL}
          title="QuitRX Intake Form"
          allow="geolocation"
        />
      </div>
    </section>
  );
}
