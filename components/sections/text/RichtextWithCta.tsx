"use client";

import { useState } from "react";

import {
  CTAButtonsProps,
  PortableTextBlock,
} from "@/components/global/components";

import "./richtextwithcta.css";
import { PortableText } from "next-sanity";
import { useWindowWide } from "@/hooks/screenSize";

interface Props {
  title: string;
  description: PortableTextBlock[];
  cta_buttons: CTAButtonsProps[];
  activeItem: number;
  desktop_left_width: number
}

const RichtextWithCta = ({
  title,
  cta_buttons,
  activeItem,
  desktop_left_width,
  description
}: Props) => {
  const [activeIndex, setActiveIndex] = useState(activeItem ? activeItem : 0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);

  const handleChange = (index: number) => {
    if (index === activeIndex) return;

    setExitingIndex(activeIndex);

    setTimeout(() => {
      setActiveIndex(index);
      setExitingIndex(null);
    }, 700); // same as CSS transition
  };

  const wide = useWindowWide()

  const leftStyle = wide !== null && wide >= 1024 ? {width: `${desktop_left_width}%`} : {}


  return (
    <section className="richtext-with-cta">
      <div className="richtext-with-cta__container">
        
        <div className="richtext-with-cta__sidebar">
          <h2 className="richtext-with-cta__title">{title}</h2>
          {description && 
            <div className="description mt-15">
              <PortableText value={description}/>
            </div>
          }

          {cta_buttons && 
            <div className="content-cta-wrapper mt-15">
              <div style={leftStyle} className="cta_buttons">
                {cta_buttons?.map((item, index) => {
                  const label = item.label || "";
                  const labelWidth = label.length * 10;
                  const firstLetter = label.charAt(0);
                  const lastLetter = label.charAt(label.length - 1);


                  return (
                    <button
                      key={index}
                      className={`cta-button ${
                        activeIndex === index ? "active" : ""
                      }`}
                      onClick={() => {
                        setActiveIndex(index);
                        handleChange(index)
                      }}
                    >
                      {/* NORMAL TEXT */}
                      <span className="full-text">{label}</span>

                      {/* ACTIVE TEXT */}
                      <span className="active-text">
                        <span>{firstLetter}</span>

                        <span style={{width: activeIndex === index ? labelWidth : 0}} className="line" />

                        <span>{lastLetter}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="cta_descriptions">
                {cta_buttons?.map((item, index) => (
                  <div
                    key={index}
                    className={`cta-description-item
                      ${activeIndex === index ? "active" : ""}
                      ${exitingIndex === index ? "exit" : ""}
                    `}
                  >
                    <PortableText value={item.description} />
                  </div>
                ))}
              </div>
            </div>
          }

          
        </div>
      </div>
    </section>
  );
};

export default RichtextWithCta;