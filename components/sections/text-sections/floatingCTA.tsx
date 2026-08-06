import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { PortableTextBlock } from "@/components/global/components";

import "./floating-cta.css";

interface FloatingCTAProps {
  icon?: string;
  title_array?: PortableTextBlock[];
  text?: PortableTextBlock[];
  button_text?: string;
  button_link?: string;
}

const FloatingCTA = ({
  icon,
  title_array,
  text,
  button_text,
  button_link,
}: FloatingCTAProps) => {
  return (
    <section className="floating-cta">
      <div className="page-width">

        <div className="floating-cta__card">

          {icon && (
            <div className="floating-cta__icon">
              <Image
                src={icon}
                alt=""
                width={220}
                height={220}
              />
            </div>
          )}

          <div className="floating-cta__content">

            {title_array && (
              <div className="floating-cta__heading">
                <PortableText value={title_array} />
              </div>
            )}

            {text && (
              <div className="floating-cta__text">
                <PortableText value={text} />
              </div>
            )}

            {button_text && (
              <Link
                href={button_link || "#"}
                className="floating-cta__button"
              >
                {button_text}
              </Link>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

export default FloatingCTA;