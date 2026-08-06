"use client";

import { useState } from "react";
import { PortableText } from "next-sanity";

import "./faq.css";
import { FAQItem } from "@/components/global/components";

interface FAQProps {
  heading: string;
  paddingTop?: number;
  paddingBottom?: number;
  items: FAQItem[];
}

export default function Faq({
  heading,
  items,
  paddingTop = 80,
  paddingBottom = 80,
}: FAQProps) {
  const [open, setOpen] = useState(0);

  return (
    <section
      className="faq"
      style={{
        paddingTop,
        paddingBottom,
      }}
    >
      <div className="page-width" id="faq">

        <h2 className="faq__heading">
          {heading}
        </h2>

        <div className="faq__list">

          {items.map((item, index) => (
            <div
              className={`faq__item ${
                open === index ? "active" : ""
              }`}
              key={index}
            >
              <button
                className="faq__question"
                onClick={() =>
                  setOpen(open === index ? -1 : index)
                }
              >
                <span>{item.question}</span>

                <span className="faq__icon">
                  <svg className="icon icon-caret w-3" viewBox="0 0 10 6"><path fill="currentColor" fillRule="evenodd" d="M9.354.646a.5.5 0 0 0-.708 0L5 4.293 1.354.646a.5.5 0 0 0-.708.708l4 4a.5.5 0 0 0 .708 0l4-4a.5.5 0 0 0 0-.708" clipRule="evenodd"></path></svg>
                </span>
              </button>

              {open === index && item.answer && (
                <div className="faq__answer">
                  <PortableText value={item.answer} />
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}