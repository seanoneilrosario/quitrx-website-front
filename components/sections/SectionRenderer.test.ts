import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("./hero/Banner", () => ({ Banner: () => null }));
vi.mock("./hero/VideoHeroBanner", () => ({ default: () => null }));
vi.mock("./images/ImageGrid", () => ({ default: () => null }));
vi.mock("./text/RichtextWithCta", () => ({ default: () => null }));
vi.mock("./text/RichtextWithGroupedCTA", () => ({ default: () => null }));
vi.mock("./text/TwoColumnLayout", () => ({ default: () => null }));
vi.mock("./text/HeadingWithLink", () => ({ default: () => null }));
vi.mock("./images/MultiRow", () => ({ default: () => null }));
vi.mock("./contact/ContactSection", () => ({ default: () => null }));
vi.mock("./text/Richtext", () => ({ default: () => null }));
vi.mock("./text/TextBlocks", () => ({ default: () => null }));
vi.mock("./text/EscriptBanner", () => ({ default: () => null }));
vi.mock("./text/TextBlocksIcon", () => ({ default: () => null }));
vi.mock("./images/TextImage", () => ({ default: () => null }));
vi.mock("./text/Faq", () => ({ default: () => null }));
vi.mock("./forms/SupportForm", () => ({ default: () => null }));
vi.mock("./text/FloatingCallToAction", () => ({ default: () => null }));
vi.mock("./text/RichtextWithImage", () => ({ default: () => null }));
vi.mock("./hero/PromotionalBannerSlider", () => ({ default: () => null }));
vi.mock("./images/BrandGrid", () => ({ default: () => null }));
vi.mock("./products/ProductApiGrid", () => ({
  default: ({ heading }: { heading: string }) => createElement("h2", null, heading),
}));
vi.mock("./forms/IntakeForm", () => ({ default: () => null }));
vi.mock("./forms/UploadPrescription", () => ({ default: () => null }));
vi.mock("./forms/EscriptRequest", () => ({ default: () => null }));
import SectionRenderer from "./SectionRenderer";

it("renders every ProductApiGrid in CMS order", () => {
  const headings = ["Shop by Pharmacy", "Shop by Brand", "Collections"];
  const html = renderToStaticMarkup(
    createElement(SectionRenderer, {
      components: headings.map((heading, index) => ({
        _type: "product_api_grid" as const,
        _key: `grid-${index}`,
        heading,
        hide_separator: false,
        offices: [],
        box: [],
        items: [],
      })),
    }),
  );
  expect(html.match(/class="product_api_grid-section"/g)).toHaveLength(3);
  expect(html.indexOf(headings[0])).toBeLessThan(html.indexOf(headings[1]));
  expect(html.indexOf(headings[1])).toBeLessThan(html.indexOf(headings[2]));
});
