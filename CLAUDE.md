# IBM Gantt Chart Modernization Guide

## Project Overview

Multi-package monorepo for an IBM Gantt chart component with core rendering engine, React/Svelte wrappers, and comprehensive documentation.

**Packages:**
- `packages/ibm-gantt-chart` — Core runtime (JS + TS declarations)
- `packages/ibm-gantt-chart-react` — React wrapper (strict TypeScript)
- `packages/ibm-gantt-chart-svelte` — Svelte wrapper (strict TypeScript)
- `packages/ibm-gantt-chart-dev` — Dev/example setup
- `packages/ibm-gantt-chart-docs` — Storybook documentation

## Modernization Status

**Tier 1:** ✅ Complete (2026-07-16)
- 6 critical blockers fixed
- 99/99 tests passing
- Public API properly generified

**TypeScript Migration:** 77% complete (665 errors remaining from 2876)
- Constraint graph: 100% typed
- Base classes: Mostly typed
- Core runtime: bounded JS→TS migrations in progress

See `[[modernization-audit-status]]` and `[[typescript-migration-status]]` for detailed context.

---

## Modernization Principles

### 1. Strong Typing
**Goal:** Eliminate unsafe `unknown`/`any`/`object` types without replacing with broad `any`.

- ✅ **Replace** overly broad types with precise interfaces
- ✅ **Narrow** `Promise<unknown>` to concrete return types (e.g., `Promise<TimeWindow>`)
- ✅ **Generify** extension points (e.g., `GanttConfig<TFields = unknown>`)
- ✅ **Guard** external API boundaries with type guards or casts
- ❌ **Don't** replace one unsafe type with another (e.g., `unknown` → `any`)

### 2. Eliminate Cruft & Anti-Patterns
**Goal:** Reduce technical debt and inconsistent patterns without orphaning code.

- ✅ **Delete** truly redundant code (verified as unused and uneeded)
- ✅ **Wire up** dead code to tests or reference it properly (don't ghost code)
- ✅ **Refactor** inconsistent patterns into standardized approaches
- ❌ **Don't** delete code just because it's old (needs verification first)
- ❌ **Don't** add helper abstractions for hypothetical future use

### 3. Improve Standardization
**Goal:** Consistent structure across similar modules (interfaces, callbacks, handlers).

- ✅ **Index signatures** for dynamic object access (e.g., `DragHandler: {[key: string]: Handler}`)
- ✅ **Callback types** with consistent signatures (`(item: T) => R | void`)
- ✅ **Config objects** with proper typed interfaces (not bare `object`)
- ✅ **Error handling** follows the same pattern throughout

---

## High-Priority Anti-Patterns to Address

### 1. Dynamic Object Access Without Type Safety
**Pattern:** String-keyed access like `dragHandlers[eventType]` or `palette[colorName]`

**Current:** Often typed as `any` or `object`, no index signature

**Fix:** Add index signatures and discriminated unions
```typescript
interface DragHandlerRegistry {
  [eventType: string]: DragHandler;
}
```

**Files:** dragdrop.ts, palette-impl.ts, colorrenderer.ts

### 2. Callback Return Types Are Too Broad
**Pattern:** Callbacks return `unknown` or `any` without immediate narrowing

**Current:** Dispatch callbacks type as `(event: T) => unknown`

**Fix:** Define explicit result types per callback
```typescript
type SelectionCallback = (selected: Item[], deselected: Item[]) => void;
```

**Files:** event.ts, dispatch.ts, updates.ts, all selection handlers

### 3. Promise Return Types in Public API
**Pattern:** Methods like `setTimeWindow()` return `Promise<unknown>` when they always return `TimeWindow`

**Current:** Breaks autocomplete and type safety

**Fix:** Replace with concrete types in both runtime and d.ts
```typescript
setTimeWindow(tw: TimeWindow): Promise<TimeWindow>
```

**Files:** core.ts, ganttpanel.ts, declarations (d.ts)

### 4. Generic Config Objects Without Structure
**Pattern:** Internal config typed as `object | undefined` with no shape

**Current:** Accessing properties requires casts or unsafe access

**Fix:** Define proper interfaces per config usage
```typescript
interface LayoutConfig {
  padding?: number;
  autoResize?: boolean;
  // ...
}
```

**Files:** layout.ts, constraintlayout.ts, renderer.ts

### 5. Test Doubles with Intermediate Casts
**Pattern:** Test utilities cast through `as object` or `as any` as intermediate step

**Current:** Makes tests fragile, hides type errors

**Fix:** Use proper type generics in test factories
```typescript
// Bad: const mock = {foo: 1} as object as MyInterface
// Good: const mock: MyInterface = {foo: 1}
```

**Files:** test utilities, fixture generators

---

## Tier 2 Plan (Next Phase)

1. **Core JS→TS migrations** — Bounded files at public boundaries
   - model.ts: Fix Promise return types
   - event.ts: Define callback signatures
   - renderer.ts: Add RenderContext/RenderObject interfaces
   - Time window calculations: Add concrete return types

2. **Unknown narrowing via generics** — Extension points
   - Replace return `Promise<unknown>` with concrete types
   - Replace extension-point `unknown` with `<T = unknown>` generics
   - Update call sites to pass concrete types
   - Verify no test regressions

3. **Standardize dynamic access** — Handlers and registries
   - Add index signatures to handler registries
   - Replace string-keyed object access with typed maps
   - Verify all accessed keys are known at compile time

4. **Config object typing** — All configuration shapes
   - Audit all `object` and `{[key: string]: any}` config types
   - Define proper interfaces for each config shape
   - Use discriminated unions for variant configs

---

## Code Quality Standards

### Types
- No bare `unknown` or `any` without an adjacent type guard or narrowing
- External API responses guarded at boundary (vis-timeline, Tabulator, Carbon)
- Callbacks always have explicit parameter and return types
- Config objects always have shape interfaces

### Patterns
- Dynamic access uses index signatures, not bare `object`
- Dead code has tests (not orphaned)
- Redundant code verified as truly redundant before deletion
- Similar logic patterns consolidated (but only when genuinely duplicated)

### Comments
- Only for WHY when non-obvious
- Never document WHAT (well-named identifiers do that)
- No multi-line docstrings (single line max)

---

## Codebase Map

### Core Runtime (JS → partial TS)
- `src/core/` — Rendering engine, data model, timelines
- `src/core/renderer.ts` — Main render dispatch (being modernized)
- `src/panel/ganttpanel.ts` — Panel lifecycle, config (being modernized)
- `src/constraint/` — Constraint solver and layout

### Type Declarations
- `types/index.d.ts` — Public API (being completed in Tier 1)
- Interfaces inline in files via JSDoc comments (gradual migration)

### Wrappers (Both strict TypeScript)
- `packages/ibm-gantt-chart-react/src/` — React component + hooks
- `packages/ibm-gantt-chart-svelte/src/` — Svelte component + stores

### Tests
- `src/**/*.test.ts` — Unit tests (Vitest)
- `e2e/` — Playwright integration tests
- 99/99 currently passing (maintain this)

---

## Related Memories

- `[[modernization-audit-status]]` — Tier 1 blockers and resolutions
- `[[typescript-migration-status]]` — 665 error categories and strategies
- `[[type-narrowing-blockers]]` — Specific unknown/object uses and narrowing plans

---

## Git Workflow

- Work on `modernization/*` branches when addressing anti-patterns
- Commit per fix type: type safety, pattern consolidation, config typing
- Run full test suite before pushing: `npm test` (99 tests must pass)
- PRs should reference which anti-pattern they fix (see High-Priority section above)
