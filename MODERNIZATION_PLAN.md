# Gantt Chart Modernization Plan

Last verified: 2026-07-16 on `master` at `4ac9599`

This is the canonical modernization plan. `BACKLOG.md` contains executable work items. The objective is to improve contracts, initialization, module ownership, utility ownership, and tree-shaking without changing observable behavior unless a human explicitly approves that change.

## Instruction and authority status

- No `AGENTS.md` exists in this repository, `.agents/`, or an ancestor directory. `.agents/` is empty.
- Root `CLAUDE.md` is the only applicable repository guide. Its claims of “99/99 tests passing” and “665 TypeScript errors remaining” are stale against the current checkout and must not be used as baselines.
- No current roadmap or backlog exists, so this file and `BACKLOG.md` become canonical.
- Public exports, public types, global registries, event lifecycle, initialization order, dependencies, and build configuration remain human-controlled stop gates.

## Verified work state

| State              | Finding                                                                                                                                            | Evidence                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Verified complete  | Working tree was clean before these documentation changes. `master` was 50 commits ahead of `origin/master`.                                       | `git status --short --branch`                                     |
| Verified retained  | One stash exists: `stash@{0}`, based on `522de6d`. It was not inspected destructively, popped, or changed.                                         | `git stash list`                                                  |
| Verified retained  | Three linked worktrees/branches exist under `.claude/worktrees`: `wf_1d81a77c-4bc-1`, `wf_1d81a77c-4bc-3`, and `wf_bffc0851-13e-1`.                | `git worktree list --porcelain`                                   |
| Partially complete | Recent commits claim type, test, utility, and bundle modernization, but current validation does not prove completion.                              | `git log -15`; current tests and source inventory below           |
| Partially repaired | Core Vitest builds its required artifact, loads CSS, and collects all 46 tests. The latest full run reports 26 passing, 19 failing, and 1 skipped. | `npm test --workspace packages/ibm-gantt-chart -- --reporter=dot` |
| Planned            | Type-boundary repair, utility decomposition, internal import cleanup, and bundle experiments remain unimplemented in this documentation run.       | `BACKLOG.md`                                                      |
| Speculative        | A 300 KB target and removal of the public `Gantt.utils` facade are not approved requirements.                                                      | Current artifact measurements and public compatibility tests      |

## Prior workflow reconciliation

The prior workflow is real but not a reliable completion record:

- Task identifier `wqxirrel3` is stored in the Claude project checkpoint and workflow run `wf_bffc0851-13e`.
- Saved artifacts exist at `C:\Users\bidwe\.claude\projects\c--Users-bidwe-workspace-gantt-chart\memory\modernization_session_checkpoint.md` and the session workflow directory.
- Only the anti-pattern agent returned a result. Strong typing, module flattening, test repair, utility elimination, bundle optimization, and final verification agents all recorded session-limit errors.
- Despite those errors, the workflow JSON reports `status: completed` and emits success logs. Those success claims are invalid.
- The checkpoint’s 49-commits-ahead claim is stale; the verified checkout was 50 commits ahead. Its test, type, utility, and bundle counts are superseded below.

## Reconciled baselines

| Reported claim                             | Current evidence                                                                                                                                                                                        | Disposition                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Approximately 34 remaining `any` usages    | Six production TypeScript files contain 15 literal `any` tokens: 14 in `gantt-namespace.ts`, one in `panel/ganttpanel.ts`; no production `as any`. Ten explicit `as unknown` bridge sites remain.       | Rejected as a current production count. Recount each scoped batch with contextual review.         |
| Approximately 36 failing tests / target 86 | The repaired command collects 46 tests: 26 pass, 19 fail, and 1 is skipped. Checked-in `test_output.txt` remains historical.                                                                            | The verified target is 46 collected tests, not 86, until suites are added deliberately.           |
| Approximately 293 `Gantt.utils` usages     | Current textual inventory: 300 source references and 18 test references; 315 are member expressions across source and tests.                                                                            | Prior count not confirmed. Preserve a compatibility facade until public policy is approved.       |
| Two files use `globalThis`                 | Excluding generated Storybook and linked worktrees, relevant uses are in `vitest.setup.js`, `test-load.js`, and `src/test-context.ts`; production entry `src/index.js` also assigns `globalThis.Gantt`. | Rejected. Classify production, test harness, and diagnostic-script uses separately.               |
| Approximately 12 MB or 695 KB bundle       | Reproduced core min JS 175,912 B and CSS 23,470 B; gzip 45,408 B and 8,811 B. Unmin JS 2,060,255 B plus 4,009,652 B source map.                                                                         | Neither figure matches current core artifacts. The figures may refer to old or aggregate outputs. |
| 300 KB target                              | Current min core JS+CSS is 199,382 B raw, already below 300 KB; unmin JS is 2.06 MB.                                                                                                                    | Provisional until artifact, compression, externals, and feature set are approved.                 |

Bundle reproduction uses `npm run build:lib:min --workspace packages/ibm-gantt-chart` and `npm run build:lib --workspace packages/ibm-gantt-chart`, copying outputs to a temporary directory before measuring raw and gzip sizes. Minified builds omit maps; unminified builds include them. Moment, vis-data, and vis-timeline are externalized.

## Major evidence

| Path                                                               | Symbol or lines                   | Observed pattern                                                                              | Required remediation                                                                                            | Risk                              | Validation                                                                          |
| ------------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/ibm-gantt-chart/vitest.setup.js:4`                       | bundle import                     | Requires an artifact not produced by the checked min build; tests cannot collect.             | Define one reproducible test artifact contract before diagnosing residual tests.                                | High, harness-wide                | Core verbose Vitest command; confirm collected/pass/fail counts.                    |
| `packages/ibm-gantt-chart/vitest.setup.js`                         | setup and global `createGantt`    | Context delegation is bound correctly; CSS is not loaded.                                     | Preserve binding; load the test stylesheet through an approved harness path.                                    | Medium                            | Focused error and timetable CSS tests, then full suite.                             |
| `packages/ibm-gantt-chart/src/core/utils.js:305`                   | `Gantt.utils.ajax`                | Empty implementation is used by URL-backed `DataFetcher`.                                     | Define the supported loading boundary and inject/implement a Promise-based adapter with deterministic fixtures. | High, behavior and initialization | URL-loading tests plus full suite; human approval before initialization/API change. |
| `packages/ibm-gantt-chart/src/gantt-namespace.ts:24-25,77-121,207` | constructors, utilities, plugins  | Fourteen `any` tokens and a weak plugin registry concentrate in a public mutable namespace.   | Introduce domain contracts in bounded groups; preserve extension compatibility.                                 | High, public API                  | Strict compilation when available, declaration/consumer fixture, unit tests.        |
| `packages/ibm-gantt-chart/src/model/index.ts:338,366`              | reservation nodes in `activities` | Double assertions conceal a node-model mismatch.                                              | Decide and encode the actual row-node union or shared capability.                                               | High, consumer-visible model      | Model tests and public traversal fixture; specialist/human review.                  |
| `packages/ibm-gantt-chart/src/model/index.ts:478`                  | loaded data                       | Assumes array data through assertion without validation.                                      | Validate at the fetch boundary and return a typed failure.                                                      | Medium-high                       | Invalid and valid payload tests.                                                    |
| `packages/ibm-gantt-chart/src/model/index.ts:514,518,565`          | `updateTimeWindow`                | Resource nodes are forced through `ActivityNode`.                                             | Extract a time-bounded-node capability or overload after model review.                                          | Medium                            | Time-window and resource-chart tests.                                               |
| `packages/ibm-gantt-chart/src/panel/ganttpanel.ts:79,1199`         | `resizeHandler`                   | Nonoptional field is cleared through a double assertion.                                      | Model lifecycle optionality and retain guarded teardown.                                                        | Low-medium                        | Repeated create/destroy and listener teardown tests.                                |
| `packages/ibm-gantt-chart/src/panel/ganttpanel.ts:857,1159`        | scroller and plugins              | Structural double assertions bridge undeclared capabilities.                                  | Add focused capability and plugin contracts; do not create an omnibus interface.                                | High for plugins                  | Panel tests and plugin compatibility fixture; human gate.                           |
| `packages/ibm-gantt-chart/src/types.ts:56-65,204,269`              | fetch/model/Gantt configs         | Public inputs and results are broad `unknown` dictionaries.                                   | Generify extension points and validate external input without abruptly closing them.                            | High, public API                  | Type consumer fixtures and runtime boundary tests.                                  |
| `packages/ibm-gantt-chart/src/core/event.ts:252,268,275`           | handler/on/off                    | Result type collapses to `unknown`; string overload loses event-map inference.                | Confirm result semantics, add typed overloads, retain fallback compatibility.                                   | High, event API                   | Event dispatch/teardown tests and public type fixture; human gate.                  |
| `packages/ibm-gantt-chart/src/index.js`, `src/gantt.js`            | package entry/registration        | UMD entry eagerly imports side-effect registrars and publishes globals.                       | Preserve entry; first convert only internal barrel imports, then separately evaluate registration architecture. | High                              | Both builds, consumer smoke test, global API snapshot.                              |
| `packages/ibm-gantt-chart/src/core/core.js` and base classes       | mutable namespace imports         | Core/base bidirectional imports and 58 namespace consumers enforce eager inclusion/order.     | Map ownership and cycles before changing registration.                                                          | High, initialization              | Import graph, clean-room load, full tests; human architecture approval.             |
| `packages/ibm-gantt-chart/src/core/utils.js:74,699`                | namespace/prototype publication   | Central facade is both global API and panel alias; tests assert standalone methods.           | Migrate internal consumers by domain while retaining facade; deprecation/removal is a separate public decision. | High                              | Security tests, public facade snapshot, usage count trend.                          |
| `packages/ibm-gantt-chart/webpack.config.js`                       | optimization and externals        | `usedExports` and global `sideEffects:false` coexist with SCSS and registration side effects. | Prove side-effect retention before relying on tree-shaking; do not change config without approval.              | High                              | Deterministic raw/gzip/hash comparison and consumer smoke test.                     |
| `packages/ibm-gantt-chart/package.json`                            | `main`, `module`, `source`        | `main` and `module` both target UMD; no exports map or manifest sideEffects field.            | Treat packaging changes as a later, approved compatibility task.                                                | High, consumers                   | Package fixture for CJS/ESM/browser; human gate.                                    |

## Dependency-ordered milestones

```text
M0 Reproducible baselines
 └─ M1 Test harness stabilization
     ├─ M2 Type boundary definition
     │   └─ M3 Incremental anti-pattern removal
     └─ M4 Utility decomposition (facade retained)
         └─ M5 Internal module-boundary simplification
             └─ M6 Measured bundle optimization
```

M2 may begin after M1 establishes trustworthy regression tests. Low-risk internal type batches can run alongside M4 only when file ownership does not overlap. M5 follows initial utility decomposition because the mutable namespace and side-effect registration—not directory depth—are the dominant import constraint. M6 is last because bundle claims require stable behavior, import boundaries, and a defined artifact.

## Validation matrix

| Concern                    | Authoritative/current command                                         | Notes                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core unit/DOM tests        | `npm test --workspace packages/ibm-gantt-chart -- --reporter=verbose` | Collects 46 tests; current residual baseline is 26 pass, 19 fail, and 1 skip.                                                                                                 |
| Core min build             | `npm run build:lib:min --workspace packages/ibm-gantt-chart`          | Measure JS/CSS raw and gzip, no maps.                                                                                                                                         |
| Core unmin build           | `npm run build:lib --workspace packages/ibm-gantt-chart`              | Measure JS/CSS and maps separately.                                                                                                                                           |
| Monorepo build             | `npm run build`                                                       | Runs all workspace builds; use after bounded package validation.                                                                                                              |
| Lint/import/style/prettier | `npm run check:list`                                                  | Existing root aggregate. It is not a TypeScript compiler.                                                                                                                     |
| Strict TypeScript          | Not currently authoritative for the core package                      | Core has no checked-in `tsconfig.json`; Babel transpiles TypeScript. Creating/configuring strict compilation is a build-config stop gate. Svelte has its own `tsconfig.json`. |
| Circular/import boundaries | No repository command exists                                          | Start with documented `rg`/webpack stats; adding a tool requires approval.                                                                                                    |
| Public compatibility       | Must be created as consumer fixtures before public changes            | Cover UMD/global, plugin/event/config types, and `Gantt.utils`.                                                                                                               |
| Clean change review        | `git status --short` and `git diff --check`                           | Also review generated artifacts and lockfiles remain unchanged.                                                                                                               |

## Ownership and capability policy

- Haiku/mechanical workers: bounded inventories, direct-import batches with an explicit file list, native predicate replacements, measurement scripts using existing tools, and documentation maintenance.
- Strong implementation model: node-domain contracts, fetch/config generics, harness initialization, event semantics, registry design, and any cross-cutting ownership decision.
- Specialist review: public TypeScript/API compatibility, DOM/event lifecycle, webpack/package publishing, and security-sensitive utility replacements.
- Human approval: every stop gate below and any task that fails acceptance twice.
- Concurrent implementation agents must never overlap file ownership. No implementation agents have been launched by this plan.

## Human stop gates

Explicit approval is required before changing a public type/export or entry point; event behavior; initialization order; a global registry/namespace; build or package configuration; dependencies/lockfiles; test semantics; or an artifact/size target. Approval is also required before launching implementation agents, merging concurrent work, removing/deprecating `Gantt.utils`, or claiming modernization complete.

## Rollback policy

Each implementation batch must be an isolated commit. Roll back the batch when it changes public runtime/type behavior without approval, reduces collected or passing tests, introduces nondeterminism, changes expected bundle externals/features, increases the agreed artifact metric beyond its approved budget, weakens an assertion, or cannot be cleanly reverted without unrelated changes. Never pop the existing stash as part of rollback.
