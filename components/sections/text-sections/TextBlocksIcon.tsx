"use client";

import Image from "next/image";
import { PortableText } from "next-sanity";
import { PortableTextBlock } from "@/components/global/components";
import "./TextBlocksIcon.css"

interface Box {
  image?: string;
  step?: string;
  title?: string;
  description?: PortableTextBlock[];

  label_1?: string;
  description_1?: string;

  label_2?: string;
  description_2?: string;

  label_3?: string;
  description_3?: string;

  label_4?: string;
  description_4?: string;

  row_direction?: boolean;
}

interface TextBlocksIconProps {
  title_array: PortableTextBlock[];
  description?: PortableTextBlock[];
  subHeading?: string;
  paddingTop?: number;
  paddingBottom?: number;

  box: Box[];
}

const TextBlocksIcon = ({
  title_array,
  description,
  paddingTop = 60,
  paddingBottom = 60,
  box,
  subHeading
}: TextBlocksIconProps) => {
  return (
    <section
      className="text-blocks-icon_wrap"

    >
      <div className="page-width">
        <div className="text-blocks-icon_heading">
          <h2 className="text-blocks-icon_title">
            <PortableText value={title_array} />
          </h2>

          {description && (
            <div className="text-blocks-icon_sub-head">
              <PortableText value={description} />
            </div>
          )}
        </div>

        <div className="text-blocks-icon_container">
          {box.map((item, index) => (
            <div
              key={index}
              className="text-blocks-icon_box"
            >
              {item.image && (
                <div className="text-blocks-icon_img">
                  <Image
                    className="icon_img"
                    src={item.image}
                    alt={item.title ?? ""}
                    width={500}
                    height={500}
                  />
                </div>
              )}

              <div className="text-blocks-icon_contents">
                {item.step && (
                  <span className="steps">
                    {item.step}
                  </span>
                )}

                {item.title && (
                  <h4>{item.title}</h4>
                )}

                {item.description && (
                  <div className="text-blocks-icon_description">
                    <PortableText value={item.description} />
                  </div>
                )}

                <div className="feature-list">

                  {(item.label_1 || item.description_1) && (
                    <div
                      className={`feature-row ${
                        item.row_direction ? "column-direction" : ""
                      }`}
                      style={
                        item.row_direction
                          ? {
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }
                          : undefined
                      }
                    >
                      <div className="feature-label feature-label--green">
                        {item.label_1}
                      </div>

                      <div
                        className="feature-text"
                        style={
                          item.row_direction
                            ? { maxWidth: "100%" }
                            : undefined
                        }
                      >
                        {item.description_1}
                      </div>
                    </div>
                  )}

                  {(item.label_2 || item.description_2) && (
                    <div
                      className={`feature-row ${
                        item.row_direction ? "column-direction" : ""
                      }`}
                      style={
                        item.row_direction
                          ? {
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }
                          : undefined
                      }
                    >
                      <div className="feature-label feature-label--grey">
                        {item.label_2}
                      </div>

                      <div
                        className="feature-text"
                        style={
                          item.row_direction
                            ? { maxWidth: "100%" }
                            : undefined
                        }
                      >
                        {item.description_2}
                      </div>
                    </div>
                  )}

                  {(item.label_3 || item.description_3) && (
                    <div
                      className={`feature-row ${
                        item.row_direction ? "column-direction" : ""
                      }`}
                      style={
                        item.row_direction
                          ? { flexDirection: "column" }
                          : undefined
                      }
                    >
                      <div className="feature-label feature-label--green">
                        {item.label_3}
                      </div>

                      <div className="feature-text">
                        {item.description_3}
                      </div>
                    </div>
                  )}

                  {(item.label_4 || item.description_4) && (
                    <div className="feature-row">
                      <div className="feature-label feature-label--grey">
                        {item.label_4}
                      </div>

                      <div className="feature-text">
                        {item.description_4}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TextBlocksIcon;