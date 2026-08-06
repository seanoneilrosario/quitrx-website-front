import Image from "next/image";
import { PortableText } from "next-sanity";
import { PortableTextBlock } from "@/components/global/components";

import "./richtextwithimage.css";

interface RichtextImageProps {
  image?: string;
  title_array?: PortableTextBlock[];
  content?: PortableTextBlock[];
  paddingTop?: number;
  paddingBottom?: number;
}

const RichtextImage = ({
  image,
  title_array,
  content,
  paddingTop = 0,
  paddingBottom,
}: RichtextImageProps) => {
  console.log(image)
  return (
    <section
      className="richtext-image"
      style={{
        paddingTop,
        paddingBottom,
      }}
    >
      <div className="page-width">

        {image && (
          <div className="richtext-image__icon">
            <Image
              src={image}
              alt=""
              width={200}
              height={200}
            />
          </div>
        )}

        {title_array && (
          <div className="richtext-image__heading">
            <PortableText value={title_array} />
          </div>
        )}

        {content && (
          <div className="richtext-image__content">
            <PortableText value={content} />
          </div>
        )}

      </div>
    </section>
  );
};

export default RichtextImage;