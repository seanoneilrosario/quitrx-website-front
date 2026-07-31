"use client";

import { PortableText } from "@portabletext/react";
import "./TwoColumnLayout.css";
import { PortableTextBlock } from "@/components/global/components";

interface Props {
  title: string;
  layoutPosition?: string;
  leftDescription: PortableTextBlock[];
  rightDescription: PortableTextBlock[];
}

const TwoColumnLayout = ({
  title,
  leftDescription,
  rightDescription,
}: Props) => {
  return (
    <section className="two-column-layout">
      <div className="two-column-layout__container">
        
        <div className="two-column-layout__heading">
          <h2>{title}</h2>
        </div>

        <div className="two-column-layout__content">
          
          <div className="two-column-layout__column">
            <PortableText value={leftDescription} />
          </div>

          <div className="two-column-layout__column">
            <PortableText value={rightDescription} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default TwoColumnLayout;