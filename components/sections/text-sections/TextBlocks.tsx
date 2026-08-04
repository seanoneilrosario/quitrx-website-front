"use client"
import Link from "next/link";
import"./TextBlocks.css";
import { PortableTextBlock } from "@/components/global/components";
import { PortableText } from "next-sanity";
import Image from "next/image";

interface TextBlocksProps {
  heading: string;
  description?: PortableTextBlock[];
  paddingTop?: number;
  paddingBottom?: number;

  // isLoggedIn?: boolean;

  // customer?: {
  //   firstName?: string;
  //   lastName?: string;
  //   email?: string;
  //   phone?: string;
  // };

  // openLoginPopup?: (redirect: string) => void;
}

const TextBlocks = ({
  heading,
  description,
  paddingTop = 0,
  paddingBottom = 0,
  // isLoggedIn = false,
  // customer,
  // openLoginPopup,
}: TextBlocksProps) => {
  // const escriptUrl = customer
  //   ? `https://forms.quitrx.com.au/quickrx/form/QuitRXIntakeHalaxyEscript/formperma/MNBq1fT5yNeveiZStUxHrUPzS7I2SIanje4yQR_mLy0?email=${encodeURIComponent(
  //       customer.email ?? ""
  //     )}&firstname=${encodeURIComponent(
  //       customer.firstName ?? ""
  //     )}&lastname=${encodeURIComponent(
  //       customer.lastName ?? ""
  //     )}&phone=${encodeURIComponent(customer.phone ?? "")}`
  //   : "#";

  return (
    <section
      className="text-blocks_wrap"
      style={{ paddingTop, paddingBottom }}
    >
      <div className="comparison-heading">
        <h2>{heading}</h2>
        {description && <PortableText value={description} />}
      </div>

      <div className="page-width">
        <div className="comparison-layout">

          {/* LEFT CARD */}

          <div className="text-blocks_box featured-box">
            <div className="card-top">

              <div className="renew-wrap">
                <Image
                  src="https://cdn.sanity.io/images/bd7slutt/production/3376f364b16865275eefec8365d3fa50514ba3ab-535x535.png"
                  width={100}
                  height={100}
                  alt=""
                />

                <span className="for-renewal">
                  RECOMMENDED
                </span>
              </div>

              <h3>
                Free Pharmacy Access (No Nicotine Pouch)

                <em>
                  Order through QuitRx Pharmacy
                </em>
              </h3>

              <ol>
                <li>Quick online assessment</li>
                <li>Australian practitioner review</li>
                <li>$0 prescription fee until 1st August (12-month script)</li>
                <li>Fast, discreet delivery to your door</li>
              </ol>
            </div>

            <div>

              <div className="plan-highlight">

                <span className="plan-highlight__icon">
                  $
                </span>

                <span className="plan-highlight__text">
                  <strong>100% free assessment</strong>
                </span>

              </div>

              <div className="text-blocks_btns">
                <button className="comparison-btn comparison-btn--primary">
                  Get Started Free (Usually $49)
                </button>
              </div>

            </div>
          </div>

          {/* OR */}

          <div className="comparison-or">
            OR
          </div>

          {/* RIGHT CARD */}

          <div className="text-blocks_box alternative-box">

            <div className="card-top">

              <div className="renew-wrap">

                <Image
                  src="https://cdn.sanity.io/images/bd7slutt/production/d3662ce195ea72db1c2af8b1bfd62ed35e89c8e1-536x536.webp"
                  width={70}
                  height={70}
                  alt=""
                />

                <span className="for-renewal">
                  ALTERNATIVE OPTION
                </span>

              </div>

              <h3>
                Get eScript

                <em>
                  Pick Up from Your Own Pharmacy ($49)
                </em>
              </h3>

              <ol>
                <li>Quick online assessment</li>
                <li>Australian practitioner review</li>
                <li>eScript sent to your phone (3-month script)</li>
                <li>Use at your preferred pharmacy</li>
              </ol>

            </div>

            <div>

              <div className="price-box">

                <span className="price-label">
                  One-off fee
                </span>

                <span className="price">
                  $49
                </span>

              </div>

              <div className="text-blocks_btns">
                <button className="comparison-btn comparison-btn--secondary">
                  Get eScript ($49)
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default TextBlocks;