import { describe, expect, it } from "vitest";
import { productDescriptionSections } from "./product-description-sections";

describe("productDescriptionSections", () => {
  it("moves labeled product content into its matching sections", () => {
    const sections = productDescriptionSections(`
      <p>Product details</p>
      <p><strong>What's in the box</strong><br>1x Pod</p>
      <p><strong>Beginner Tips:</strong><br>Start slowly.</p>
      <p><strong>Shipping &amp; Delivery</strong></p><p>Standard: $12.90</p>
    `);

    expect(sections.details).toContain("Product details");
    expect(sections.details).not.toContain("1x Pod");
    expect(sections.inTheBox).toContain("1x Pod");
    expect(sections.beginnerTips).toContain("Start slowly.");
    expect(sections.shipping).toContain("Standard: $12.90");
  });

  it("leaves absent sections empty instead of adding generic copy", () => {
    expect(productDescriptionSections("<p>Only details.</p>")).toEqual({
      details: "<p>Only details.</p>",
      inTheBox: "",
      beginnerTips: "",
      shipping: "",
    });
  });

  it("removes a leading Details heading already supplied by the disclosure", () => {
    const sections = productDescriptionSections(
      "<p><strong>Details</strong></p><p>Product information.</p>",
    );

    expect(sections.details).toBe("<p>Product information.</p>");
  });
});
