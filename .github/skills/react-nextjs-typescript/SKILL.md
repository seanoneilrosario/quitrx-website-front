---
name: react-nextjs-typescript
description: 'React, Next.js, and TypeScript development workflow. Use for building UI, debugging runtime issues, refactoring components, improving types, routing, server/client boundaries, and Next.js app architecture.'
argument-hint: 'Describe the React/Next.js feature, bug, API flow, or TypeScript issue to fix.'
user-invocable: true
disable-model-invocation: false
---

# React, Next.js, and TypeScript

## When to Use
- You are building or updating a React component, page, feature, or UI flow.
- You are working in Next.js App Router or Pages Router code.
- You need to debug runtime bugs, hydration issues, missing props, or type errors.
- You are refactoring client/server boundaries, API integration, or data fetching.
- You need to improve TypeScript safety, component contracts, and maintainability.

## Core Workflow

1. Define the exact outcome before editing.
   - Identify the page, component, route, hook, or server action involved.
   - Confirm whether the problem is UI behavior, routing, data fetching, or type safety.
   - Write the expected behavior in one sentence before changing code.

2. Trace the data flow and component boundary.
   - Check whether the logic belongs in a server component, client component, shared component, hook, or utility.
   - Confirm props, data source, route params, and environment assumptions.
   - Verify whether the bug is caused by missing data, incorrect types, or component lifecycle behavior.

3. Keep the fix narrow and intentional.
   - Prefer the smallest change that resolves the root cause.
   - Avoid broad refactors unless the issue requires a structural fix.
   - Keep logic readable, explicit, and aligned with project conventions.

4. Use TypeScript to make interfaces explicit.
   - Define or tighten types for props, API responses, route params, and data models.
   - Avoid `any` unless it is absolutely required and documented.
   - Prefer discriminated unions, narrow conditions, and concrete return types.

5. Respect the Next.js server/client boundary.
   - Keep server-only logic in server components or route handlers.
   - Mark client-only behavior with `use client` only when required.
   - Avoid passing server-specific values into client components without explicit typing and serialization.

6. Validate behavior, not just compile status.
   - Check whether the route renders correctly and the user flow matches the expected behavior.
   - Re-test edge cases such as loading, empty state, error handling, and invalid inputs.
   - Inspect for hydration mismatches, stale data, broken event handlers, and incorrect conditional rendering.

7. Finish with a quality pass.
   - Check naming, reusability, and maintainability.
   - Ensure the fix is consistent with existing app patterns.
   - Confirm there are no unnecessary types, stale imports, or duplicated logic.

## Decision Points

### If the issue is a UI bug
- Inspect the component tree and props first.
- Verify the value being rendered and whether the condition is wrong or the data is missing.
- Prefer minimal conditional fixes over rewriting the entire component.

### If the issue is a routing or page problem
- Check the route structure, dynamic params, and page-level data fetching.
- Confirm whether the page is a server or client component and whether the data source is correct.
- Ensure navigation and metadata expectations match the app’s route conventions.

### If the issue is a data-fetching or API problem
- Check whether the fetch is happening on the server or client and whether the request is safe.
- Validate the response shape with TypeScript types.
- Handle loading, error, and empty states explicitly.

### If the issue is a type error
- Narrow the problem to the exact type boundary.
- Replace unsafe assumptions with explicit interfaces, guards, or mapped types.
- Keep the fix local to the offending contract when possible.

### If the issue is a refactor or feature build
- Start from the existing component or pattern in the codebase.
- Match naming conventions, prop patterns, and styling style before introducing new abstractions.
- Prefer reusable components and small hooks over duplicated logic.

## Completion Criteria
- The fix resolves the user-facing behavior or technical defect.
- TypeScript contracts are explicit and safe.
- Server/client boundaries are correct and intentional.
- Loading, empty, and error states are handled where needed.
- The solution is minimal, maintainable, and consistent with the codebase.

## Good Practices
- Keep components focused and composable.
- Prefer typed props and typed data contracts over loose object shapes.
- Use Next.js caching, route conventions, and server actions appropriately.
- Add clear loading and fallback patterns for async UI.
- Reuse existing app patterns before creating a new abstraction.

## Anti-patterns to Avoid
- Putting client-only logic in server components without a clear boundary.
- Using `any` or broad `unknown` conversions without validation.
- Repeating logic across multiple pages instead of extracting reusable patterns.
- Fixing symptoms without confirming the root cause.
- Ignoring hydration, async loading, or empty-data states.

## Example Prompt Patterns
- “Build a reusable product card component in Next.js with strict TypeScript props and loading fallback states.”
- “Fix the hydration mismatch on the homepage caused by client-side rendering of server data.”
- “Refactor this Next.js page to separate server data fetching from client interactivity cleanly.”
- “Add a typed filter and search flow for the collection page without breaking SSR behavior.”
- “Debug why this route is rendering stale data and fix it with proper data-fetching and state handling.”

## Output Expectations
This skill should help the agent:
- identify the correct component, route, or data boundary
- diagnose the true source of the issue before patching
- implement a minimal and type-safe fix
- validate behavior across common UI and async states
- explain the change clearly and note any assumptions or follow-up work
