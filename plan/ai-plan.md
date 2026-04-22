# AI Strategy: Slot Machine v2

## Overall Approach: Feature-by-Feature + Prompt Refinement

**Core Strategy:**
- 1-3 main feature per prompt (or max 4-5 tightly related features together)
- NO separating backend/frontend — build features complete end-to-end
- All prompts run through Haiku 4.5 first for refinement before going to Codex
- Exact wording matters — be precise, not conversational

## Model Strategy: Haiku → Codex Pipeline

**Why this works:**
- Haiku is fast & good at instruction refinement
- Sonnet is better at implementation
- Two-pass catches ambiguity before coding

**The Process:**
1. Draft your prompt (plain language is fine)
2. Feed to **Haiku 4.5**: "Refine this prompt for clarity and exactness"
3. Take Haiku's refined version
4. Feed to **Codex 5.3**: Use the refined prompt for actual code

-----------------------

# AI-Driven Slot Machine v2: 20+ Session Plan

Based on user stories and feature-by-feature development

---

## **FEATURES TO BUILD (From User Stories)**

| Feature | Sessions | Priority |
|---------|----------|----------|
| 1. Game State & Core Logic:  1-3 | Critical |
| 2. UI Layout & Balance Display : 4-5  | Critical |
| 3. Spin Mechanic & Reel Animation : 6-8 | Ryan | Critical |
| 4. Win/Loss Detection & Payout Logic:  9-11 | Jordan | Critical |
| 5. Feedback & Results Display | 12-13 : Ryan | High |
| 6. Bet Size Adjustment | 14-15 : Jordan | High |
| 7. Error Handling & Edge Cases : 16-17 | Both | High |
| 8. Audio & Visual Polish : 18-19 | Ryan | Medium |
| 9. Stats Dashboard & History Tracking : 20-21 | Jordan | Medium |
| 10. Testing & Final Polish : 22+ | Both | Critical |

---

## **SESSION-BY-SESSION BREAKDOWN**

### **MONDAY (Sessions 1-8)**

---

#### **Session 1: GameState Class with spin() Method**
**Feature:** Game State & Core Logic  
**What We're Prompting:** 
- Create a GameState class with balance tracking
- Implement spin(betAmount) method that returns reel positions and win/loss result
- Handle insufficient balance validation

**Deliverable:** Working GameState class that manages game state and spins

---

#### **Session 2: RTP Calculation & Payout Table**
**Feature:** Game State & Core Logic  
**What We're Prompting:** 
- Add payout table to GameState (cherry 10x, bar 25x, bell 50x)
- Calculate and expose RTP (94%)
- Methods to retrieve payout rules for UI display

**Deliverable:** Static payout table with probability calculations

---

#### **Session 3: Win Detection Algorithm**
**Feature:** Win/Loss Detection  
**What We're Prompting:** 
- Implement win detection logic (matching 3 reels)
- Map reel combinations to combo names
- Return win/loss status with payout multiplier

**Deliverable:** Working win detection that correctly identifies winning combos

---

#### **Session 4: HTML Structure & Layout**
**Feature:** UI Layout  
**What We're Prompting:** 
- Create semantic HTML structure for slot machine
- Layout: header, balance display area, reel display area, controls area
- Mobile-first structure with proper IDs for all interactive elements

**Deliverable:** Clean, semantic HTML with all sections properly marked

---

#### **Session 5: CSS Styling & Responsive Layout**
**Feature:** UI Layout  
**What We're Prompting:** 
- Create responsive CSS (mobile 320px, tablet 768px, desktop 1024px)
- Style balance display, reel boxes, spin button
- Dark theme with neon accents (gold/cyan)

**Deliverable:** Fully styled, responsive game interface

---

#### **Session 6: Initialize Game & Connect GameState to DOM**
**Feature:** Core Logic Integration  
**What We're Prompting:** 
- Create main.js initialization logic
- Display initial balance on page load
- Create helper functions for updating balance and result display

**Deliverable:** Game initializes with $100 balance, balance updates on DOM

---

#### **Session 7: Reel Randomization & Display**
**Feature:** Spin Mechanic  
**What We're Prompting:** 
- Generate random reel positions (0-9 each)
- Wire spin button click handler to GameState.spin()
- Update DOM with reel results and balance changes
- Show win/loss message

**Deliverable:** Clicking spin button executes a complete spin cycle

---

#### **Session 8: Reel Spinning Animation**
**Feature:** Spin Mechanic & Animation  
**What We're Prompting:** 
- Add CSS animation for reels spinning (0.6s total)
- Stagger reel animations (each starts 0.1s apart)
- Disable spin button during animation, re-enable after
- Keep total spin time under 0.8s

**Deliverable:** Smooth spinning animation before showing results

---

### **TUESDAY (Sessions 9-16)**

---

#### **Session 9: Bet Amount Validation**
**Feature:** Bet Size Adjustment  
**What We're Prompting:** 
- Add bet validation before spin
- Prevent spinning with insufficient balance
- Show error messages for invalid bets

**Deliverable:** Game prevents invalid bets with clear error messages

---

#### **Session 10: Bet Adjustment UI (+/- Buttons)**
**Feature:** Bet Size Adjustment  
**What We're Prompting:** 
- Add +/- buttons to adjust bet between $5, $10, $25, $50
- Update bet display in real-time
- Show potential payout based on current bet
- Disable buttons at min/max limits

**Deliverable:** Intuitive bet adjustment UI that works smoothly

---

#### **Session 11: Session Stats Tracking**
**Feature:** Stats Dashboard  
**What We're Prompting:** 
- Add stats tracking to GameState (total spins, wins, losses, win rate)
- Calculate net session gain/loss
- Maintain bet history with timestamps

**Deliverable:** GameState tracks all session statistics

---

#### **Session 12: Stats Display Panel**
**Feature:** Stats Dashboard  
**What We're Prompting:** 
- Create stats display area showing spins, wins, losses, win rate, net gain
- Display updates in real-time after each spin
- Format numbers as currency and percentages
- Position responsively (sidebar on desktop, panel on mobile)

**Deliverable:** Live stats panel that updates with every spin

---

#### **Session 13: Insufficient Balance Error Handling**
**Feature:** Error Handling  
**What We're Prompting:** 
- Disable spin button when balance < current bet
- Show helpful error messages
- Auto-reduce bet to maximum allowed when balance decreases
- Prevent negative balances

**Deliverable:** Robust error handling that prevents invalid game states

---

#### **Session 14: Double-Click/Spam Prevention**
**Feature:** Error Handling  
**What We're Prompting:** 
- Implement flag to prevent multiple spins during animation
- Silently ignore rapid consecutive clicks on spin button
- Maintain smooth user experience (no janky behavior)

**Deliverable:** Clicking spin rapidly only executes one spin

---

#### **Session 15: Win/Loss Result Animations**
**Feature:** Feedback & Results  
**What We're Prompting:** 
- Add visual pulse animation to winning reels
- Flash background color for win results
- Display result message in large, color-coded text (gold for win, red for loss)
- Ensure animations complete quickly (<1s total)

**Deliverable:** Celebratory visual feedback for wins, clear feedback for losses

---

#### **Session 16: Audio Feedback (Spin & Win Sounds)**
**Feature:** Audio & Visual Polish  
**What We're Prompting:** 
- Implement audio playback for spin, win, and loss events
- Add mute/unmute button
- Set moderate volume levels (0.3)
- Handle audio failures gracefully (game works without sound)

**Deliverable:** Audio events that enhance gameplay without overwhelming player


---

#### **Session 17: Mobile Responsiveness Optimization**
**Feature:** Mobile Optimization  
**What We're Prompting:** 
- Test and refine CSS for 320px, 768px, and 1024px viewports
- Ensure touch-friendly button sizes (44px+ targets)
- Optimize reel display and balance text for readability on small screens
- Hide stats panel on mobile by default with toggle

**Deliverable:** Game plays smoothly and looks great on all device sizes

---

#### **Session 18: Settings Panel (Audio, Mute, Preferences)**
**Feature:** Audio & Visual Polish  
**What We're Prompting:** 
- Create settings modal/panel with audio toggle
- Implement open/close functionality
- Style as overlay or slide-out panel
- Keep settings minimal and accessible

**Deliverable:** Users can toggle audio and access preferences

---

#### **Session 19: How-To & Rules Info Modal**
**Feature:** Game Information  
**What We're Prompting:** 
- Create info modal with multiple sections: How to Play, Payout Table, Tips
- Display winning combos, probabilities, and payouts clearly
- Show RTP percentage prominently
- Keep text concise and user-friendly

**Deliverable:** Players understand odds, rules, and how to play

---

#### **Session 20: Code Linting & Clean Code Refactor**
**Feature:** Code Quality  
**What We're Prompting:** 
- Run ESLint and fix all linting errors
- Extract magic numbers to named constants
- Break long functions into smaller, single-responsibility functions
- Validate HTML and CSS with W3C validators
- Remove unnecessary console.logs

**Deliverable:** Clean, maintainable code that passes all validation

---

#### **Session 21: Unit Tests for GameState Class**
**Feature:** Testing  
**What We're Prompting:** 
- Write Jest tests for GameState constructor and properties
- Test spin() method with winning and losing scenarios
- Test balance calculations and insufficient balance handling
- Test stats calculations (win rate, net gain)
- Aim for >90% code coverage

**Deliverable:** Comprehensive unit tests that verify GameState logic

---

#### **Session 22: Integration/E2E Tests with Playwright**
**Feature:** Testing  
**What We're Prompting:** 
- Write Playwright tests for complete user flows
- Test: load game → adjust bet → spin → see result → spin again
- Test error handling flows (insufficient balance, invalid bets)
- Test stats updates after spins
- Test mobile responsiveness
- Verify no console errors

**Deliverable:** E2E tests that verify entire game works end-to-end

---

#### **Session 23: Bug Fixes & Performance Polish**
**Feature:** All (Polish)  
**What We're Prompting:** 
- Fix any failing tests or edge cases discovered
- Optimize animations for smooth 60fps performance
- Improve load time (target <2s)
- Handle edge cases (slow devices, poor connectivity, missing audio)
- Final visual polish and consistency pass

**Deliverable:** Stable, performant, polished game ready for presentation

---

#### **Session 24+: Stretch Goals (Optional)**
**Possible additions (choose 1-2 if time permits):**
- Persistent storage with localStorage (save stats, preferences)
- Share win results feature (copy to clipboard, social sharing)
- Advanced visualizations (balance chart over time, combo frequency)
- Additional themes or dark mode toggle
- Leaderboard / high scores tracking

---

## **SUMMARY: 20+ SESSIONS MAPPED TO FEATURES**

| Session | Feature | What We're Prompting |
|---------|---------|---------------------|
| 1 | Game State | GameState class with spin() method |
| 2 | Game State | RTP calculation and payout table |
| 3 | Win Detection | Win/loss detection algorithm |
| 4 | UI Layout | HTML structure and semantics |
| 5 | UI Layout | CSS responsive design |
| 6 | Core Integration | Game initialization and DOM connection |
| 7 | Spin Mechanic | Reel randomization and display |
| 8 | Spin Animation | CSS reel spinning animation |
| 9 | Bet Validation | Bet validation and error prevention |
| 10 | Bet UI | Bet adjustment buttons (+/-) |
| 11 | Stats Tracking | Session statistics in GameState |
| 12 | Stats Display | Stats panel DOM updates |
| 13 | Error Handling | Insufficient balance errors |
| 14 | Spam Prevention | Double-click prevention logic |
| 15 | Win Animation | Win/loss result animations |
| 16 | Audio | Audio for spin, win, loss events |
| 17 | Mobile | Mobile responsiveness optimization |
| 18 | Settings | Settings panel and preferences |
| 19 | Info Modal | Rules, odds, and how-to guide |
| 20 | Code Quality | Linting and code refactoring |
| 21 | Unit Tests | Jest tests for GameState |
| 22 | E2E Tests | Playwright integration tests |
| 23+ | Polish | Bug fixes, performance, stretch goals |

---