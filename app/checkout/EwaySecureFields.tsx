"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./checkout.module.css";

type SecureFieldType = "name" | "card" | "expirytext" | "cvn";

type SecureFieldEvent = {
  targetField: SecureFieldType;
  secureFieldCode?: string;
  fieldValid: boolean;
  valueIsValid: boolean;
  errors?: string;
};

type EwayBrowserApi = {
  setupSecureField: (
    config: {
      publicApiKey: string;
      fieldDivId: string;
      fieldType: SecureFieldType;
      styles: string;
      autocomplete?: "true" | "false";
    },
    callback: (event: SecureFieldEvent) => void,
  ) => void;
};

declare global {
  interface Window {
    eWAY?: EwayBrowserApi;
  }
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_EWAY_PUBLIC_API_KEY?.trim();
const FIELD_STYLES =
  "box-sizing:border-box;width:100%;height:42px;border:1px solid #bdd1ce;border-radius:7px;padding:0 12px;background:#fff;color:#173d41;font-family:Arial,sans-serif;font-size:14px;outline:none;";

export function EwaySecureFields({
  onChange,
}: {
  onChange: (secureFieldCode: string | null) => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const initialized = useRef(false);
  const validFields = useRef(new Set<SecureFieldType>());
  const latestCode = useRef("");

  const initialize = useCallback(() => {
    if (initialized.current || !PUBLIC_KEY || !window.eWAY) return;
    initialized.current = true;

    const callback = (event: SecureFieldEvent) => {
      if (!event.fieldValid) {
        setLoadError("The secure payment field could not be loaded. Please refresh and try again.");
        onChange(null);
        return;
      }
      if (event.valueIsValid) validFields.current.add(event.targetField);
      else validFields.current.delete(event.targetField);
      if (event.secureFieldCode) latestCode.current = event.secureFieldCode;
      onChange(validFields.current.size === 4 && latestCode.current ? latestCode.current : null);
    };

    const fields: Array<[SecureFieldType, string]> = [
      ["name", "eway-secure-name"],
      ["card", "eway-secure-card"],
      ["expirytext", "eway-secure-expiry"],
      ["cvn", "eway-secure-cvn"],
    ];
    for (const [fieldType, fieldDivId] of fields) {
      window.eWAY.setupSecureField(
        {
          publicApiKey: PUBLIC_KEY,
          fieldDivId,
          fieldType,
          styles: FIELD_STYLES,
          autocomplete: "true",
        },
        callback,
      );
    }
  }, [onChange]);

  useEffect(() => {
    if (scriptReady) initialize();
    return () => onChange(null);
  }, [initialize, onChange, scriptReady]);

  if (!PUBLIC_KEY)
    return (
      <p className={styles.notice} role="alert">
        Secure card payments are not configured. Please choose PayPal or contact support.
      </p>
    );

  return (
    <>
      <Script
        src="https://secure.ewaypayments.com/scripts/eWAY.min.js"
        strategy="afterInteractive"
        data-init="false"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
        onError={() => setLoadError("Secure card fields could not be loaded. Please try again.")}
      />
      <div className={styles.cardFields} aria-busy={!scriptReady}>
        <label className={styles.fieldWide}>
          <span>Name on card</span>
          <div id="eway-secure-name" className={styles.secureCardField} />
        </label>
        <label className={styles.fieldWide}>
          <span>Card number</span>
          <div id="eway-secure-card" className={styles.secureCardField} />
        </label>
        <label>
          <span>Expiry</span>
          <div id="eway-secure-expiry" className={styles.secureCardField} />
        </label>
        <label>
          <span>Security code</span>
          <div id="eway-secure-cvn" className={styles.secureCardField} />
        </label>
        <p className={styles.cardSecurityNote}>
          Card details are hosted securely by eWAY and never pass through our server.
        </p>
        {loadError && (
          <p className={`${styles.notice} ${styles.fieldWide}`} role="alert">
            {loadError}
          </p>
        )}
      </div>
    </>
  );
}
