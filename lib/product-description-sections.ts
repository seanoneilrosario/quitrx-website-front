import sanitizeHtml from "sanitize-html";

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

type SectionKey = "details" | "inTheBox" | "beginnerTips" | "shipping";

const headings: Array<[Exclude<SectionKey, "details">, string]> = [
  ["inTheBox", "What(?:'|\\u2019|&apos;|&#39;)s in the box"],
  ["beginnerTips", "Beginner Tips?"],
  ["shipping", "(?:Pickup,?\\s*)?Shipping\\s*(?:&(?:amp;)+|&|and)\\s*Delivery"],
];

export function productDescriptionSections(description?: string) {
  let marked = sanitizeHtml(description || "", sanitizeOptions);

  for (const [key, heading] of headings) {
    const standaloneHeading = new RegExp(
      `<p[^>]*>\\s*(?:<(?:strong|b)[^>]*>\\s*)?${heading}\\s*:?(?:\\s*</(?:strong|b)>)?\\s*</p>`,
      "gi",
    );
    marked = marked.replace(standaloneHeading, `<!--product-section:${key}-->`);

    const inlineHeading = new RegExp(
      `(?:<(?:strong|b)[^>]*>\\s*)?${heading}\\s*:?(?:\\s*</(?:strong|b)>)?\\s*(?:<br\\s*/?>)?`,
      "gi",
    );
    marked = marked.replace(inlineHeading, `<!--product-section:${key}-->`);
  }

  const sections: Record<SectionKey, string> = {
    details: "",
    inTheBox: "",
    beginnerTips: "",
    shipping: "",
  };
  let current: SectionKey = "details";

  for (const part of marked.split(/<!--product-section:(inTheBox|beginnerTips|shipping)-->/)) {
    if (part === "inTheBox" || part === "beginnerTips" || part === "shipping") {
      current = part;
    } else {
      sections[current] += part;
    }
  }

  for (const key of Object.keys(sections) as SectionKey[]) {
    sections[key] = sanitizeHtml(sections[key], sanitizeOptions).trim();
  }

  return sections;
}
