# Modernization Backlog

Canonical plan: `MODERNIZATION_PLAN.md`. Status values are `verified-complete`, `partial`, `blocked`, `planned`, and `speculative`. No production implementation is authorized by this document.

## Milestone 0 — Baseline and reproducibility

### M0.1 Preserve and record repository state — verified-complete

- Scope: Git branch/ahead state, stash list, worktree list, HEAD, instruction files, workflow/checkpoint artifacts.
- Out of scope: stash inspection/pop, branch/worktree creation or removal, commits.
- Prerequisites: none.
- Owner/capability: Haiku repository investigator; lead reviews contradictions.
- Acceptance: the plan records current state and distinguishes external session artifacts from repository state.
- Validation: `git status --short --branch`; `git stash list`; `git worktree list --porcelain`; `git log -15`.
- Artifact: `MODERNIZATION_PLAN.md` work-state and workflow sections.
- Rollback: revert documentation if it exposes secrets or misstates evidence.
- Review/gate: lead review; human approval was granted for documentation only.

### M0.2 Establish authoritative test baseline — partial

- Scope: core Vitest artifact contract and exact collected/pass/fail counts.
- Out of scope: changing test assertions, arbitrary delays, production fixes.
- Prerequisites: human approval for harness/build orchestration changes.
- Owner/capability: strong model with Vitest/Webpack knowledge; DOM-test specialist review.
- Acceptance: a clean checkout runs the documented command, collects the intended suites, and reports deterministic counts twice. Collection is restored; residual failures remain under M1.3.
- Validation: `npm test --workspace packages/ibm-gantt-chart -- --reporter=verbose`; `git diff --check`.
- Artifact: captured command/output summary; no checked-in build artifact unless separately approved.
- Rollback: collected tests decrease, semantics change, or the command depends on a stale prebuilt file.
- Human gate: build/test initialization order and any package-script/config edit.

### M0.3 Formalize bundle measurement — planned

- Scope: existing min/unmin core builds; raw/gzip bytes, maps, hashes, externals, mode.
- Out of scope: config changes and a 300 KB commitment.
- Prerequisites: M0.1.
- Owner/capability: Haiku for repeatable measurement; webpack specialist reviewer.
- Acceptance: two clean measurements agree and distinguish maps/compression/artifacts.
- Validation: existing `build:lib:min` and `build:lib` workspace commands; byte/gzip/hash capture in a temporary directory.
- Artifact: baseline table appended to the plan or a future checked measurement report.
- Rollback: repository artifacts or package files change during measurement.
- Human gate: required before adopting an artifact target.

## Milestone 1 — Test harness stabilization

### M1.1 Align test artifact production and consumption — planned

- Scope: `packages/ibm-gantt-chart/vitest.setup.js`, package scripts/config only if approved.
- Out of scope: production logic and test expectations.
- Prerequisites: M0.2 approval.
- Owner/capability: strong implementation model; harness specialist review.
- Acceptance: no missing-bundle error; intended suites collect from a clean state without relying on an undocumented artifact.
- Validation: core verbose Vitest command twice.
- Artifact: isolated harness commit and baseline report.
- Rollback: stale artifacts become required, suite count drops, or build/test semantics diverge.
- Human gate: initialization/build configuration.

### M1.2 Restore deterministic CSS behavior — planned

- Scope: test stylesheet loading for error and timetable styles.
- Out of scope: weakening computed-style assertions or changing production CSS semantics.
- Prerequisites: M1.1.
- Owner/capability: bounded DOM/CSS test specialist; Haiku may implement only with exact files and acceptance.
- Acceptance: error visibility and activity-text style tests exercise real project CSS deterministically.
- Validation: focused CSS tests, then full core suite.
- Artifact: isolated harness commit.
- Rollback: assertions are reduced, styles are duplicated in tests, or unrelated CSS is globally mocked.
- Human gate: test-semantics review.

### M1.3 Reproduce and classify residual runtime clusters — planned

- Scope: `leftComp`, async loading, event teardown, and geometry failures after M1.1–M1.2.
- Out of scope: fixes before reproduction.
- Prerequisites: M1.2.
- Owner/capability: Haiku for logs/clustering; strong model for root-cause decisions.
- Acceptance: every failure belongs to a reproducible cluster with first test, stack, ownership, cleanup, and smallest repair.
- Validation: focused tests plus full verbose suite.
- Artifact: evidence update to this backlog.
- Rollback: none; read-only investigation.
- Human gate: before event, initialization, or test-semantic changes.

### M1.4 Define URL data-loading boundary — planned

- Scope: `src/core/data-fetcher.js`, `src/core/utils.js` ajax boundary, deterministic test fixture transport.
- Out of scope: dependency additions or silently accepting malformed data.
- Prerequisites: M1.3; public behavior decision.
- Owner/capability: strong model; API and async-testing specialist review.
- Acceptance: supported URL inputs resolve/reject predictably; malformed data fails at the boundary; teardown is deterministic.
- Validation: focused loading tests and full core suite.
- Artifact: design note plus isolated implementation commit.
- Rollback: loading semantics or initialization order change beyond approval.
- Human gate: public/integration behavior and initialization.

## Milestone 2 — Type boundary definition

### M2.1 Model row-node taxonomy — planned

- Scope: `src/model/index.ts` reservation/resource/activity relationships and time-window capability.
- Out of scope: public shape changes without approval.
- Prerequisites: reliable M1 baseline.
- Owner/capability: strong model; domain/API specialist review.
- Acceptance: actual producers/consumers are documented; no node is converted by double assertion; compatibility tests cover traversal.
- Validation: model tests, core suite, strict check when established, consumer fixture.
- Artifact: short design decision and bounded commit.
- Rollback: serialized/traversed node behavior changes unexpectedly.
- Human gate: public data-model change.

### M2.2 Fetch/config boundary contracts — planned

- Scope: `src/types.ts` fetch/model/Gantt config and `IDataFetcher`; related model consumers.
- Out of scope: one oversized interface or closing extension keys abruptly.
- Prerequisites: M1.4 and M2.1 decisions.
- Owner/capability: strong TypeScript/API model; specialist review.
- Acceptance: domain-specific generics/interfaces represent producers and consumers; external input is narrowed once at the boundary.
- Validation: type consumer fixtures, boundary tests, core suite.
- Artifact: contract note and isolated commit series.
- Rollback: source compatibility breaks or vague aliases merely replace `unknown`.
- Human gate: public type changes.

### M2.3 Event and plugin contracts — planned

- Scope: `src/core/event.ts`, `src/gantt-namespace.ts`, plugin call sites in panel.
- Out of scope: lifecycle/cancellation behavior changes without approval.
- Prerequisites: reliable M1 baseline.
- Owner/capability: strong model; event/API specialist review.
- Acceptance: handler result semantics are explicit; typed overloads retain fallback compatibility; plugin registry reflects real calls.
- Validation: event registration/dispatch/teardown tests and public type fixture.
- Artifact: decision note and isolated commits.
- Rollback: ordering, cancellation, teardown, or plugin compatibility changes.
- Human gate: event lifecycle and public extensions.

### M2.4 Lifecycle and component capabilities — planned

- Scope: panel resize handler, scroller capability, component registry duplicate `Toolbar` declaration.
- Out of scope: global registration redesign.
- Prerequisites: M1 baseline.
- Owner/capability: bounded strong TypeScript implementer; DOM lifecycle reviewer.
- Acceptance: lifecycle optionality is explicit; teardown is idempotent; no structural double assertion remains in scope.
- Validation: repeated create/destroy tests, core suite, strict check when available.
- Artifact: isolated commit.
- Rollback: listeners leak or component lookup changes.
- Human gate: initialization/lifecycle behavior if affected.

## Milestone 3 — Incremental anti-pattern removal

### M3.1 Remove verified assertion bridges in dependency order — planned

- Scope: only sites unlocked by M2.1–M2.4.
- Out of scope: optional chaining, nullish coalescing, representation unions, and unrelated casts.
- Prerequisites: corresponding M2 contract task.
- Owner/capability: Haiku for bounded mechanical edits; strong reviewer.
- Acceptance: each removed construct maps to a domain contract, initialization fix, boundary parser, or guard; no replacement escape hatch.
- Validation: focused tests, full suite, contextual `rg`, strict check when available.
- Artifact: one commit per contract area.
- Rollback: behavior changes, vague aliases, duplicated guards, or compiler suppression.
- Human gate: inherited from the relevant M2 task.

### M3.2 Establish core strict-compilation policy — blocked

- Scope: proposal for the six production TypeScript files and JS/TS coexistence.
- Out of scope: adding/changing `tsconfig` or build tooling in the proposal task.
- Prerequisites: M2 contracts and human build-policy review.
- Owner/capability: TypeScript build specialist.
- Acceptance: proposal explains Babel resolution, `.js`/`.ts` duplicates, included files, declaration behavior, and incremental adoption.
- Validation: proposed command tested without committing config where possible.
- Artifact: architecture decision proposal.
- Rollback: proposal conflicts with shipped JS resolution or package consumers.
- Human gate: compiler/build configuration.

## Milestone 4 — Utility decomposition

### M4.1 Create an owner-based usage ledger — planned

- Scope: 315 current member expressions across source/tests, categorized by domain and public/test use.
- Out of scope: replacements or facade removal.
- Prerequisites: M1 baseline.
- Owner/capability: Haiku inventory worker; lead resolves ownership ambiguity.
- Acceptance: every member is assigned to native API, local helper, owner module/class, shared domain contract, or preserved facade.
- Validation: contextual `rg` inventory and count reconciliation.
- Artifact: checked ledger or backlog update.
- Rollback: none; documentation only.
- Human gate: ownership decisions spanning domains.

### M4.2 Migrate native predicates and local DOM operations — planned

- Scope: bounded files selected from isArray/isString/isFunction and trivial class/listener calls; facade retained.
- Out of scope: ajax, date/i18n, geometry, security helpers, global publication.
- Prerequisites: M4.1 and M1 regression baseline.
- Owner/capability: non-overlapping Haiku workers with exact file lists; security-aware reviewer.
- Acceptance: behavior-equivalent native/local code; security tests remain intact; no generic replacement utils module.
- Validation: focused security/DOM tests, full suite, min/unmin builds, usage delta.
- Artifact: small isolated commits.
- Rollback: browser compatibility, escaping, listener options, or class semantics differ.
- Human gate: none for purely internal equivalent batches; stop on ambiguity.

### M4.3 Move domain utilities to owners — planned

- Scope: date/i18n, geometry/rendering, property evaluation, normalization, and event helpers in separate decisions.
- Out of scope: public facade removal.
- Prerequisites: M4.1; relevant M2 contracts.
- Owner/capability: strong model per domain; specialist review.
- Acceptance: each abstraction has a domain owner and tests; internal namespace dependence decreases; facade delegates compatibly where required.
- Validation: domain tests, core suite, builds, public `Gantt.utils` snapshot.
- Artifact: one decision/commit series per domain.
- Rollback: formatting/timezone, geometry, security, or extension behavior changes.
- Human gate: cross-domain ownership and global namespace changes.

### M4.4 Decide public facade lifecycle — speculative

- Scope: deprecate, retain, or version removal of `Gantt.utils` and panel alias.
- Out of scope: implementation before decision.
- Prerequisites: internal migration substantially complete and consumer evidence collected.
- Owner/capability: lead/API specialist; human decision.
- Acceptance: compatibility/versioning policy and migration guide are approved.
- Validation: public consumer inventory and facade tests.
- Artifact: approved API decision record.
- Rollback: retain facade.
- Human gate: mandatory.

## Milestone 5 — Module boundary simplification

### M5.1 Map public entry and registration invariants — planned

- Scope: `src/index.js`, `src/gantt.js`, component/plugin registrations, CSS side effects, 58 mutable namespace consumers.
- Out of scope: entry/export removal.
- Prerequisites: M4 ownership map.
- Owner/capability: strong architecture model; package specialist review.
- Acceptance: public/internal edges, cycles, eager registrars, and initialization ordering are documented.
- Validation: webpack stats, clean-room global load, existing builds/tests.
- Artifact: module graph/decision note.
- Rollback: none; read-only mapping.
- Human gate: before registration changes.

### M5.2 Convert internal barrel imports in bounded batches — planned

- Scope: thin internal barrels such as panel/timetable/constraintgraph/loadchart; exact batch file lists required.
- Out of scope: package entry, public exports, implementation index modules, directory flattening.
- Prerequisites: M5.1.
- Owner/capability: Haiku mechanical worker; architecture reviewer.
- Acceptance: public entry unchanged; no new cycles; tests/builds pass; measured bundle is non-regressive.
- Validation: contextual import inventory, full suite, both builds, consumer smoke test.
- Artifact: one isolated commit per domain.
- Rollback: registration order, CSS inclusion, or consumer surface changes.
- Human gate: public export/entry changes are excluded and require separate approval.

### M5.3 Decide namespace registration architecture — speculative

- Scope: alternatives to bidirectional `core` imports and eager mutation.
- Out of scope: implementation.
- Prerequisites: M5.1, M4 internal migration, stable tests.
- Owner/capability: senior architecture model plus human/API/build reviewers.
- Acceptance: compatible migration path, initialization proof, and rollback plan.
- Validation: prototype consumer fixtures and bundle experiments outside production commits.
- Artifact: architecture decision record.
- Rollback: retain current registration.
- Human gate: mandatory.

## Milestone 6 — Bundle optimization

### M6.1 Approve artifact and budget — blocked

- Scope: choose min/unmin, JS/CSS/maps, raw/gzip, externals, supported features, and consumer format.
- Out of scope: optimization changes.
- Prerequisites: M0.3 and human product/package decision.
- Owner/capability: lead, webpack/package specialist, human product owner.
- Acceptance: one reproducible metric and non-negotiable compatibility set are approved.
- Validation: baseline reproduction.
- Artifact: signed-off target note.
- Rollback: revert to measurement-only status.
- Human gate: mandatory.

### M6.2 Verify side effects and tree-shaking — planned

- Scope: current `usedExports`, global `sideEffects:false`, SCSS, registrars, orphan modules, existing externals.
- Out of scope: config/package changes before approval.
- Prerequisites: M5.1 and M6.1.
- Owner/capability: webpack specialist; strong implementation model.
- Acceptance: experiments prove required CSS/registration survives and identify contributors with stats.
- Validation: min/unmin builds, clean-room global/consumer smoke tests, raw/gzip/hash comparison.
- Artifact: before/after experiment report.
- Rollback: discard experiment if behavior or artifact contract changes.
- Human gate: build/package config.

### M6.3 Optimize verified contributors — speculative

- Scope: only contributors proven by M6.2, potentially import amplification or verified dead code.
- Out of scope: dependency/tooling changes and source deletion based only on size.
- Prerequisites: M6.2 and explicit implementation approval.
- Owner/capability: strong model; webpack/API specialist review.
- Acceptance: reproducible reduction on the approved metric with behavior, tests, exports, and externals preserved.
- Validation: complete matrix in `MODERNIZATION_PLAN.md` plus consumer fixtures.
- Artifact: isolated optimization commits and measurement report.
- Rollback: any compatibility regression or non-reproducible improvement.
- Human gate: mandatory for build, dependency, export, or public behavior changes.

## Completion rule

Modernization may be claimed complete only after all non-speculative accepted tasks pass their validation matrix from a clean checkout, public compatibility fixtures pass, bundle results reproduce, the diff is reviewed, and a human explicitly approves the claim.
