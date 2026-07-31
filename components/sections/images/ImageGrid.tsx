import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import './ImageGrid.css'

interface GridImage {
  image: {
    asset: {
      _id: string
      url: string
    }
    hotspot?: {
      x: number
      y: number
      height: number
      width: number
    }
  }
  alt: string
  caption?: string
  link?: string
}

interface GridRow {
  columns: number
  images: GridImage[]
}

interface ImageGridProps {
  rows: GridRow[]
}

export default function ImageGrid({ rows }: ImageGridProps) {
  if (!rows || rows.length === 0) {
    return null;
  }

  const allImages = rows.flatMap((row) => row.images);

  return (
    <>
      {/* Desktop */}
      <div className="container desktop-grid">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="row"
            style={{
              gridTemplateColumns: `repeat(${row.columns}, 1fr)`,
            }}
          >
            {row.images.map((gridImage, imageIndex) => (
              <Image
                key={imageIndex}
                src={urlFor(gridImage.image).url()}
                alt={"Grid Images"}
                width={500}
                height={500}
                className="image"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="mobile-grid">
        {allImages.map((gridImage, imageIndex) => (
          <Image
            key={imageIndex}
            src={urlFor(gridImage.image).url()}
            alt={"Grid Images"}
            width={500}
            height={500}
            className="image"
          />
        ))}
      </div>
    </>
  );
}