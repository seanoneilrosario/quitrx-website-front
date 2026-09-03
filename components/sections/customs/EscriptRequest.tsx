"use client";

import { useEffect, useRef } from "react";
import "./EscriptRequest.css";
import "./FormBackButton.css";
import FormBackButton from "./FormBackButton";

const FORM_ID = "kv_pCXTnqL7KtQx2aQj8yauEXxjqzQKzTTwrIKi8i5c";
const FORM_ORIGIN = "https://forms.quitrx.com.au";
const FORM_URL = `${FORM_ORIGIN}/quickrx/form/QuitRXEscriptRequestThisisusedforonlyafterfreepriv/formperma/${FORM_ID}?zf_rszfm=1`;

type EscriptRequestProps = {
  title?: string;
  paddingTop?: number;
  paddingBottom?: number;
};

export default function EscriptRequest({ title }: EscriptRequestProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const url = new URL(FORM_URL);
    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.forEach((value, key) => {
      if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "gclid") url.searchParams.set(key, value);
    });
    url.searchParams.set("referrername", window.location.href.slice(0, 1800));
    if (iframeRef.current) iframeRef.current.src = url.toString();

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

  return <section className="escript-request">
    <FormBackButton />
    <div className="escript-request__inner">
      {title && <h2 className="escript-request__title">{title}</h2>}
      <iframe ref={iframeRef} className="escript-request__iframe" src={FORM_URL} title="QuitRX eScript Request" allow="geolocation" />
    </div>
  </section>;
}
