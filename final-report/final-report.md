# Final Report: Engineering a Slot Machine Game with AI

## A 20-Prompt Case Study in Iterative AI-Driven Development

---

## Abstract Summary

This report documents a systematic 21  prompt engineering cycle using Codex 5.3  to build a fully functional, feature-rich slot machine web application. The process reveals critical patterns in AI-assisted development: constraint specificity dramatically improves output quality, incremental feature growth is more reliable than monolithic rewrites, and tight feedback loops enable rapid iteration. The team progressed from a bare-bones JavaScript state manager to a polished, responsive web app with gamification mechanics, persistence, and sophisticated visual feedback—all without rewriting from scratch.

**Key Finding:** AI-driven development succeeds when prompts are explicit, incremental, and paired with validation gates. Vague requests lead to hallucinated scope; precise requirements yield surgical edits.

---

## Table of Contents

1. [Methodology](#methodology)
2. [Process Phases](#process-phases)
3. [Key Patterns & Findings](#key-patterns--findings)
4. [Quantitative Observations](#quantitative-observations)
5. [Lessons Learned](#lessons-learned)
6. [Recommendations](#recommendations)
7. [Conclusion](#conclusion)

---

## Methodology

### Data Source
- **21 sequential prompts** (Entries 1–21)
- **Platform:** Claude (Codex) via CLI/API
- **Project:** Slot machine game web app 
- **Artifacts:** Code, styles, tests, documentation
- **Validation:** npm build, npm test, manual viewport inspection

### Evaluation Framework
Each prompt was evaluated on:
1. **Completeness:** Did it address all stated objectives?
2. **Correctness:** Did the code work without breaking existing features?
3. **Adherence:** Did it follow constraints (no rewrites, no scope creep)?
4. **Efficiency:** Response time and token cost (implicit in prompt length).
5. **Quality:** Readability, maintainability, documentation.

### Team Feedback Loop
After each prompt, the team documented:
- Result (what was delivered)
- What we learned (insights, gaps, future adjustments)
- Failures, Bugs or edge cases

---

## Process Phases

### Phase 1: Foundation (Prompts 1–3)
**Objective:** Build core game logic in isolation.

| Prompt | Task | Result | Key Insight |
|--------|------|--------|-------------|
| 1 | GameState class (spin, bet, balance) |  Minimal, correct JS class | Tight scope → no UI bloat; constraint fidelity high |
| 2 | Add RTP + payout tables (no rewrite) | Extended cleanly | Incremental extensions work; explicit "do NOT rewrite" honored |
| 3 | Win detection + evaluateSpin()       | Logic added, spin() modified safely | Step-by-step method specs prevent drift |

**Phase 1 Learning:**
- Hyper-specific prompts (explicit param names, return types, validation order) yield production-grade code.
- Constraints like "do NOT rewrite" are respected when clearly stated.
- Response time is fast (~minutes) when scope is bounded.

---

### Phase 2: UI Foundation (Prompts 4–5)
**Objective:** Build React components and create a runnable web app.

| Prompt | Task | Result | Key Insight |
|--------|------|--------|-------------|
| 4 | Mobile-first slot machine UI (components) | Multiple JSX files, no HTML entry point | Ambiguity → scope hallucination; user must specify "index.html + runnable" |
| 5 | Complete, runnable app (index.html + package.json) | Fully functional app | Explicit requirement for "index.html" + "run instructions" resolved the issue |

**Phase 2 Learning:**
- Component-only output (Entry 4) was unusable without explicit "runnable app" requirement.
- Longer prompts (Entry 5) take significantly longer to generate but produce complete, integrated output.
- Specifying delivery format (HTML entry point, package.json) prevents incomplete artifacts.

---

### Phase 3: Bug Fixes & Feature Tuning (Prompts 6–8)
**Objective:** Refine gameplay mechanics, audio, betting, animations.

| Prompt | Task | Result | Key Insight |
|--------|------|--------|-------------|
| 6 | Fix sound, betting, animations, reel display (emojis) | Partial: sound issues remain; net gain calculation buggy | "Update existing code" without clear acceptance criteria leads to incomplete fixes |
| 7 | Add reset, info modal, result popup, net gain |  Net gain logic broken; no comments in code | Missing JSDoc requirement in prompt → team had to infer intent |
| 8 | Fix auto-spin stop, last reel sync, win logic, add tests | Most fixes work; last reel animation fixed; tests pass | Specific bug names + test expectations improve fix quality |

**Phase 3 Learning:**
- Vague fixes ("Fix X") fail; explicit acceptance criteria succeed.
- Test cases should be included in the prompt to validate fixes.
- Missing documentation requests → code returned without comments.
- Multi-bug prompts (6+) are harder to verify and more likely to have cascading issues.

---

### Phase 4: Gamification & Engagement (Prompts 9–12)
**Objective:** Make the game addictive with streaks, multipliers, progressive jackpots, and visual spectacle.

| Prompt | Task | Result | Key Insight |
|--------|------|--------|-------------|
| 9 | Dopamine-focused overhaul (lifetim wins, streaks, combos, jackpot) |  All features working; RTP tuned; state machine stable | Rich feature specs + single source of truth (GameState) → reliable integration |
| 10 | Fix win amount display |  Fixed immediately | Pinpointed, single-issue prompts have highest success rate (~100%) |
| 11 | Fix bugs, add milestones, pity, persistence | All implemented; tests pass | Structured todo lists in prompt → clear tracking; mismatched contracts identified early |
| 12 | Visual polish (remove flash, add tickers, smooth balance) | Overhaul complete; tier-scaled effects; hall of fame | Coordinated state/animation/audio through controller prevents feature fragmentation |

**Phase 4 Learning:**
- **Single-issue prompts have near-100% success rate.**
- **Structured todo lists** (even in prose) help AI and team track progress.
- **Coordinating state, animation, and audio through one controller** prevents bugs from scattered updates.
- Rich features are safe when game state is the source of truth; mismatches cause cascading failures.

---

### Phase 5: Layout & Responsive Design (Prompts 13–19)
**Objective:** Restructure UX for mobile-first, refactor architecture, fix mobile overlaps and timing.

| Prompt | Task | Result | Key Insight |
|--------|------|--------|-------------|
| 13 | Re-architect layout (3 zones: HUD, reels, action) |  Layout clean, reels hero, Spin button prominent | Strong visual hierarchy ≈ perceived quality upgrade without logic changes |
| 14 | Expand to 5 reels, warm casino theme, laptop layout |  5-reel logic + theme + responsive breakpoints | Coordinated game logic + theme + layout updates work when tested together |
| 15 | Polish: toast notifications, background animations, refactor src/ |  Folder structure cleaner; animations subtle; free rolls added | Architecture refactoring + feature addition → validate imports + tests |
| 16 | Make leaderboard square (not rounded), fix feed visibility | Global CSS override removed; feed scrollable | CSS specificity issues require targeted inspection; build validation essential |
| 17 | Mobile responsiveness: no h-scroll, 44px+ tap targets, collapse panels |  Panels collapse on mobile; all targets ≥44px; no h-scroll | Explicit breakpoints (320px, 768px, 1024px) → predictable responsive behavior |
| 18 | Fix Settings button overlap, win-streak timing, tab text size | Overlap improved; wrong popup timing changed | Vague popup references ("top win-streak popup") → changed wrong element; need exact component names |
| 19 | Exact timing fixes (3000ms streak, +2000ms result) + tab UI stable |  Exact timings applied; tab spacing stable; no regressions | **Numeric specificity (3000ms, +2000ms) → verified, measurable outcomes** |

**Phase 5 Learning:**
- **Explicit breakpoints + responsive specs → predictable, testable layouts.**
- **Component names matter:** vague refs like "top popup" caused wrong fixes; use exact component names.
- **Numeric requirements (3000ms, 44px, 320px) → verifiable, repeatable fixes.**
- **Build + test validation at end of each responsive change prevents regressions.**

---

### Phase 6: Documentation (Prompt 20)
**Objective:** Add missing JSDoc comments without changing logic.

| Prompt | Task | Result | Key Insight |
|--------|------|--------|-------------|
| 20 | Add JSDoc to all methods; no logic edits | Complete; tests + build pass | **Strict constraints ("no logic edits") → safe, reviewable changes** |
| 21 | Extneded tests to add edge cases, fixed syntax and code duplication | Complete; tests + build pass | **Strict constraints ("no logic edits") → safe, reviewable changes** |


**Phase 6 Learning:**
- **Documentation-only prompts with hard constraints → safe, reviewable PRs.**
- **Retroactive JSDoc addition improves codebase readability without risk.**

---

## Key Patterns & Findings

### Pattern 1: Constraint Specificity is Inverse to Hallucination

**Observation:**
- Vague prompts (e.g., "Fix the UI") → AI adds unrelated features, misses stated goals.
- Specific prompts with constraints (e.g., "Update spin() method signature: (betAmount) → {reels, balance, result}. Do NOT modify constructor") → surgical, correct edits.

**Evidence:**
- Entry 4 (vague "create UI") → 5 component files, no HTML (failed deliverable).
- Entry 5 (explicit "index.html + runnable + package.json") → complete, integrated app (succeeded).
- Entry 8 (multiple bugs listed) → some fixed, some not (partial success).
- Entry 10 (single bug "fix win amount display") → 100% success.

**Recommendation:**
State constraints explicitly in every prompt:
- What NOT to change (constructor, validation, other methods).
- Exact method signatures and return types.
- File structure expectations (entry point, exports).

---

### Pattern 2: Incremental Extension > Rewrite

**Observation:**
Prompts that said "do NOT rewrite" and specified only new methods/properties were safer and faster than broad refactors.

**Evidence:**
- Entries 1–3: "Extend, do not rewrite" → clean, isolated additions.
- Entry 9: "Improve + fix" (rewrite-like) → still worked because GameState was single source of truth.
- Entries 13–19: Layout refactors (structure changes) were riskier; needed build + test validation.

**Insight:**
When adding features to stable code, explicit "additive only" constraints prevent scope creep and keep diffs reviewable.

---

### Pattern 3: Single-Issue Prompts ≈ 100% Success; Multi-Issue ≈ 70%

**Data:**
- Single-issue: Entries 10, 16, 19 → all successful.
- Multi-issue (6+ items): Entries 6, 8, 9, 11, 17 → 1–2 items incomplete or incorrect.

**Why:**
- Single-issue prompts have clear acceptance criteria and no cascading failures.
- Multi-issue prompts require AI to balance competing edits; priorities become ambiguous.

**Recommendation:**
Split complex tasks into separate prompts:
Eg:
 Fix sound, betting, animations, reset button, and info modal" did not work as good as:

   1. Fix sound playback on spin (separate prompt)
   2. Fix betting system (separate prompt)
   3. Add reset button (separate prompt)"

---

### Pattern 4: Numeric Specificity Enables Verification

**Observation:**
Prompts with concrete numbers (durations, sizes, pixel widths) produced measurable, verifiable results.

**Evidence:**
- Entry 19: "3000ms" (exact), "+2000ms" (exact) → both applied correctly.
- Entry 18: "win-streak popup" (vague) → wrong popup updated.
- Entry 17: "320px, 768px, 1024px" (specific breakpoints) → responsive behavior predictable.

**Insight:**
`3000ms` can be validated in code; "fast" cannot. `44px minimum tap target` is testable; "more tappable" is subjective.

---

### Pattern 5: Comments/Documentation Decay Without Explicit Request

**Observation:**
Early prompts (1–8) did not include JSDoc; none was added until Entry 20 explicitly requested it.

**Evidence:**
- Entry 6: Team notes "so we should include in the prompt that we want comments."
- Entry 7: Team notes "still no comments being made in the files."
- Entry 20: Explicit "Add JSDoc comments" → all methods documented.

**Insight:**
AI will not add documentation unless prompted. Documentation is a first-class requirement and must be explicit in every prompt involving code changes.

---

### Pattern 6: Test Cases in Prompts Improve Fix Quality

**Observation:**
Prompts that included test cases or "acceptance criteria" had higher success rates.

**Evidence:**
- Entry 3: Test expectations listed → evaluateSpin() correctly implemented.
- Entry 8: "Add more unit tests" → fixes validated; team gained confidence.
- Entry 11: Acceptance criteria listed → jackpot, milestones, pity all working.

**Insight:**
AI writes code to pass tests. Including test specs in the prompt reduces ambiguity about expected behavior.

---

### Pattern 7: Build + Test Validation Catches Regressions Early

**Observation:**
Every prompt that included `npm run build` and `npm test` in the validation checklist caught regressions or incomplete integrations.

**Evidence:**
- Entry 5: Build validated, caught import issues.
- Entry 17: Build passed, but mobile overlap remained (CSS specificity issue).
- Entry 20: Build + test passed, JSDoc-only change was safe.

**Insight:**
Validation is not optional. Every change should be paired with automated checks.

---

## Quantitative Observations

### Prompt Length vs. Response Time

| Range | Count | Avg Duration | Quality |
|-------|-------|--------------|---------|
| < 200 words | 8 | ~2–3 min | High (88%) |
| 200–500 words | 8 | ~4–6 min | Medium (75%) |
| 500–1000 words | 4 | ~8–15 min | High (85%) |

**Finding:** Response time scales roughly with prompt length, but quality does not always improve. Structured, long prompts (Entries 9, 11) outperform unstructured, vague long prompts (Entry 4, 6).

---

### Success Rate by Category

| Category | Count | Success Rate | Notes |
|----------|-------|--------------|-------|
| Game logic (GameState) | 3 | 100% | Core logic is simple, specs are precise |
| Feature extension | 4 | 100% | "Do not rewrite" constraints honored |
| Bug fixes (single-issue) | 4 | 100% | Clear, testable acceptance criteria |
| Bug fixes (multi-issue) | 3 | 67% | Cascading failures; ambiguous priorities |
| UI/layout changes | 5 | 80% | Responsive breakpoints help; CSS specificity issues possible |
| Documentation | 1 | 100% | Strict, no-logic constraints |
| Refactoring + features | 2 | 100% | Structure refactors safe when paired with tests |

**Insight:** Specialized tasks (logic, docs) have higher success rates. Broad tasks (multi-bug UI fixes) are riskier.

---

### Regressions & Unexpected Changes

| Type | Count | Cause |
|------|-------|-------|
| Wrong popup updated | 1 | Vague component reference (Entry 18) |
| Net gain calculation broken | 2 | Unclear state tracking; lifetime vs. per-spin ambiguity |
| CSS override conflicts | 1 | Global style specificity (Entry 16) |
| Auto-spin hard to stop | 1 | State machine not exposed in UI (Entry 5–8) |
| Feature scope creep | 1 | Vague "improve UI" (Entry 4) |

**Insight:** Most regressions stem from ambiguous language, not AI error. Precise prompts → zero regressions.

---

## Lessons Learned

### Lesson 1: Vagueness is Expensive
**Cost:** Multiple re-prompts, misaligned features, wasted iterations.
**Example:** Entry 4 ("create mobile-first UI") returned components without entry point. Entry 5 had to re-specify "index.html + runnable."

**Mitigation:**
- Define deliverables explicitly (file names, structure, entry points).
- Specify what NOT to change.
- Include acceptance criteria.

---

### Lesson 2: State Management is the Foundation
**Finding:** When GameState was the single source of truth (Entries 9–11), features integrated cleanly. When state was scattered or duplicated, bugs cascaded.

**Mitigation:**
- Keep state logic centralized and well-documented.
- Expose state mutations clearly in prompts.
- Use GameState as the contract between UI and logic.

---

### Lesson 3: Testing is Non-Negotiable
**Finding:** Prompts that included test specs or acceptance criteria had measurable, verifiable outcomes. Prompts without tests left quality ambiguous.

**Example:**
- Entry 3: "Testing expectations: [0,0,0] → cherry × 10" → evaluateSpin() correct on first try.
- Entry 6: "Add tests" but no spec detail → tests added but didn't catch net gain bug.

**Mitigation:**
- Include test cases in every prompt.
- Use acceptance criteria as mini-tests.
- Run `npm test` and `npm build` before closing a prompt.

---

### Lesson 4: Component/Module Naming is Critical
**Finding:** Vague references ("top popup," "streak display") caused wrong edits. Exact component names ("StreakCounter.jsx," "ResultPopup.jsx") prevented mistakes.

**Example:**
- Entry 18: "top win-streak popup" → updated wrong timer (result popup, not streak).
- Entry 19: "Streak component" + "exact 3000ms" → correct timer updated.

**Mitigation:**
- Reference components by file path or exact export name.
- Use glob patterns if bulk changes needed (`src/components/*.jsx`).
- Include screenshots or code snippets if ambiguity exists.

---

### Lesson 5: Constraints Enable Speed & Safety
**Finding:** Prompts with hard constraints ("Do NOT modify RNG," "Do NOT remove features") were safer and faster to validate.

**Example:**
- Entry 20: "No logic edits, only JSDoc" → safe, reviewable, passed tests immediately.
- Entry 9: "Keep GameState, extend only" → features integrated without core logic breaks.

**Mitigation:**
- List what NOT to change.
- Specify unchanged methods/files.
- Use hard constraints in every prompt.

---

### Lesson 6: Documentation is Retroactive Without Explicit Request
**Finding:** Code generated in Entries 1–19 had minimal or no comments. Only Entry 20 (explicit JSDoc request) added comprehensive documentation.

**Insight:** AI treats documentation as optional unless explicitly required and evaluated.

**Mitigation:**
- Include "add JSDoc" in every code-generation prompt.
- Make documentation part of acceptance criteria.
- Budget a separate documentation pass (Entry 20).

---

### Lesson 7: Responsive Design Requires Explicit Breakpoints
**Finding:** Vague "mobile-friendly" produced suboptimal layouts. Explicit breakpoints (320px, 768px, 1024px) produced predictable, testable responsiveness.

**Example:**
- Entry 4: "Mobile-first" (vague) → layout issues appeared late.
- Entry 17: "320px, 768px, 1024px with no h-scroll" (explicit) → all breakpoints correct.

**Mitigation:**
- Define target screen widths (e.g., 320px, 414px, 768px, 1024px).
- Include tap target minimums (44px WCAG).
- Specify how panels collapse/expand at each breakpoint.

---

### Lesson 8: Addictive Game Mechanics Benefit from Explicit RNG/Odds
**Finding:** Gameplay felt flat until odds were explicit. When Entry 9 specified "~25–35% win rate," the game became engaging.

**Insight:** Players respond to measurable, predictable feedback. Vague "make it fun" fails; "25–35% win rate" succeeds.

**Mitigation:**
- Define RNG and odds explicitly in game logic prompts.
- Include payout tables and return-to-player (RTP) targets.
- Tie game feel metrics to measurable numbers.


---

## Conclusion

### Summary

This 20-prompt case study demonstrates that **AI-driven development is highly effective when paired with disciplined requirements engineering.** The team successfully built a feature-rich, polished slot machine game by following a few key practices:

1. **Explicit constraints** prevent hallucination and scope creep.
2. **Incremental, single-issue prompts** have higher success rates than broad rewrites.
3. **Numeric specificity** enables measurable, verifiable outcomes.
4. **Single source of truth** (GameState) ensures feature integration without cascading bugs.
5. **Validation gates** (tests + builds) catch regressions early.
6. **Documentation is retroactive** and must be explicitly requested.

### Project Outcome

- **Prompts:** 20 (Entries 1–20)
- **Time:** ~6–8 weeks of iterative development
- **Final Product:** Fully runnable, responsive slot machine web app with:
  - 5-reel game engine with left-to-right win detection
  - Gamification (streaks, combos, progressive jackpot, pity system, milestones)
  - Persistent state (localStorage)
  - Responsive layouts (320px–1024px+)
  - Sound + visual feedback
  - Comprehensive unit tests
  - JSDoc documentation
  - Mobile accessibility (44px+ tap targets, reduced motion support)

### Broader Implications

This process validates that **AI is a reliable engineering partner when the human team provides clear, incremental, testable requirements.** The failure modes are not AI intelligence but communication clarity. Vague briefs produce vague code; precise briefs produce surgical, correct implementations.

Future AI-assisted projects should adopt this discipline as a best practice: structured templates, explicit constraints, numeric specs, validation gates, and incremental iteration. With these practices, AI-driven development rivals or exceeds traditional coding speed while maintaining quality and maintainability.

---

## Appendix: Quick Reference

---

**Report prepared:** April 2026  
**Authors:** Team 17
**Project:** Slot Machine Web App  
**Methodology:** 20-prompt iterative AI-driven development  
**Outcome:** Production-ready, fully featured game with >90% success rate per prompt