---
name: shopify-liquid
description: 'Shopify Liquid theme development and debugging. Use for storefront logic, theme templates, snippets, sections, filters, Shopify objects, JSON templates, and Liquid troubleshooting.'
argument-hint: 'Describe the Shopify Liquid issue, template, snippet, or storefront behavior to fix.'
user-invocable: true
disable-model-invocation: false
---

# Shopify Liquid

## When to Use
- You need to edit a Shopify theme template, section, snippet, block, or JSON template.
- You are debugging Liquid rendering issues, empty outputs, or incorrect storefront logic.
- You need to use Shopify objects like product, collection, cart, customer, page, article, linklists, routes, or metafields.
- You want to add conditional rendering, sizing logic, price formatting, variant logic, or dynamic collection filtering.

## Core Workflow

1. Identify the exact storefront behavior and the target template.
   - Confirm which page, section, or snippet is producing the output.
   - Check if the issue is in a template, section, snippet, or theme setting.
   - Note the relevant Shopify object and expected condition.

2. Trace the data flow before editing.
   - Verify the object being used exists in the current context.
   - Check whether the value comes from product, collection, variant, cart, customer, or settings.
   - Decide whether the logic should live in a template, snippet, section schema, or a reusable block.

3. Use the smallest safe Liquid change.
   - Prefer a simple conditional over a complex nested logic block.
   - Keep logic readable and easy to maintain.
   - Use Shopify-native patterns and filters when possible instead of custom workarounds.

4. Add guards for missing data.
   - Use `if`, `unless`, `case`, and `default` patterns to handle empty objects and null values.
   - Provide fallback content or hidden output when expected data is unavailable.
   - Avoid assuming product, collection, variant, or customer fields are always present.

5. Match the correct Shopify object and property names.
   - Confirm the correct object context before writing property access.
   - Check for product vs. variant vs. line_item differences in pricing and availability.
   - Use handles, IDs, and collections intentionally; do not hardcode assumptions when dynamic Shopify objects exist.

6. Validate rendering and logic.
   - Review syntax for proper tags, braces, and block closures.
   - Check that conditions align with the actual storefront context.
   - Inspect output for empty states, duplicate content, incorrect prices, or broken loops.

7. Finish with a quality check.
   - Ensure the change is scoped to the real issue.
   - Confirm the output is correct across default, empty, and edge-case states.
   - Keep code maintainable and avoid unnecessary complexity.

## Decision Points

### If the issue is about missing output
- Inspect the object context first.
- Add `if` checks around the object or property before rendering.
- Use a fallback message or hidden markup when appropriate.

### If the issue is about incorrect conditions
- Rewrite the logic with clearer, explicit conditions.
- Prefer direct object checks over complex nested expressions.
- Reduce multiple condition layers when a single `case` or `if` covers the behavior.

### If the issue is about pricing or inventory
- Confirm whether the data is on the product, variant, or line item.
- Use Shopify pricing and inventory-related properties consistently.
- Keep logic aligned with the actual theme data source and product availability.

### If the issue is about collections or navigation
- Check whether the theme is using collection handles, linklists, or menu objects.
- Use `for` loops and `contains` checks only where the data structure supports them.
- Verify that collection or product filters are being applied in the correct theme block.

### If the issue is about custom storefront logic
- Prefer a theme section or snippet to keep logic reusable.
- Keep settings and schema values explicit and theme-safe.
- Avoid embedding business rules in layout-specific markup when they belong in a reusable block.

## Completion Criteria
- The Liquid code uses the correct object and property path.
- Missing or empty values are handled gracefully.
- The rendered output matches the storefront requirement.
- No syntax or unclosed tag errors remain.
- The solution is minimal, readable, and maintainable.

## Good Practices
- Use `if`, `unless`, and `case` to express storefront logic clearly.
- Keep loops focused and avoid heavy nested logic.
- Use Shopify filters intentionally for formatting, money, image rendering, and URL operations.
- Prefer reusable sections/snippets over duplicated Liquid blocks.
- Validate behavior in the actual theme context, not only by reading the code.

## Anti-patterns to Avoid
- Assuming a product or object always exists in a given template.
- Hardcoding Shopify object names without checking context.
- Duplicating repeated Liquid logic across templates instead of reusing a section or snippet.
- Writing overly complex nested conditions that are hard to debug.
- Rendering content without safe fallback states.

## Example Prompt Patterns
- "Fix the product card so it hides unavailable variants without breaking the collection grid."
- "Add a fallback for empty product metafields in the featured collection section."
- "Update the cart drawer to show a customer-friendly empty state and correct line item pricing."
- "Refactor this Shopify section to use cleaner Liquid conditions and reusable snippets."
- "Debug why this collection page is rendering duplicate product cards and fix the loop logic."

## Output Expectations
This skill should help the agent:
- Locate the correct Shopify Liquid file and object context.
- Diagnose the root cause before patching.
- Implement a minimal, theme-safe fix.
- Validate the logic against empty, default, and edge-case states.
- Explain the change clearly and note any assumptions or follow-up considerations.
