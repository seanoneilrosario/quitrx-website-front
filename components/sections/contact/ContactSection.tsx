"use client";

import { useState } from "react";
import { PortableText } from "@portabletext/react";
import { PortableTextBlock } from "@/components/global/components";
import styles from "./ContactSection.module.css";
import ContactPopup from "./ContactPopup";

interface Office {
  title: string;
  address: PortableTextBlock[];
  phone: string;
}

interface ContactSectionProps {
  eyebrow?: string;
  heading: string;
  offices: Office[];
  button_text?: string;
  button_link?: string;
}

export default function ContactSection({
  eyebrow,
  heading,
  offices,
  button_text,
  button_link,
}: ContactSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className={styles.section}>
        <div className={styles.wrapper}>
          <aside className={styles.sidebar}>
            {eyebrow && <p>{eyebrow}</p>}
          </aside>

          <div className={styles.content}>
            <h2>{heading}</h2>
          </div>
        </div>

        <div className={styles.rows}>
          {offices.map((office, index) => (
            <div className={styles.row} key={index}>
              <div className={styles.sidebarSpacer} />

              <div className={styles.location}>
                <h3>{office.title}</h3>

                <PortableText value={office.address} />

                <a href={`tel:${office.phone}`}>
                  {office.phone}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.buttonWrapper}>
          <div className={styles.sidebarSpacer} />

          <button
            className={`${styles.button} ${open ? styles.open : ""}`}
            onClick={() => setOpen(true)}
          >
            <span>{button_text}</span>
            <span className={styles.arrow}><svg className="-rotate-90" xmlns="http://www.w3.org/2000/svg" width="16.516" height="18.102" viewBox="0 0 18.516 18.102">
                  <g id="Icon_feather-arrow-down" data-name="Icon feather-arrow-down" transform="translate(-6.793 -7)">
                    <path id="Path_11" data-name="Path 11" d="M18,7.5V24.6" transform="translate(-1.949 0)" fill="none" stroke="#b59a73" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"/>
                    <path id="Path_12" data-name="Path 12" d="M24.6,18l-8.551,8.551L7.5,18" transform="translate(0 -1.949)" fill="none" stroke="#b59a73" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"/>
                  </g>
                </svg></span>
          </button>
        </div>
      </section>

      <ContactPopup
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}