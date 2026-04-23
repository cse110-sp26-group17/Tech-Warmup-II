MIN 20 ENTRIES

Entry #1
Prompt: Create a JavaScript GameState class for a slot machine game with the following exact specifications:

INITIAL STATE:
- balance: number, initialized to 1000
- betAmount: number, initialized to 10
- gameHistory: array, empty at start
- isSpinning: boolean, initialized to false

CONSTRUCTOR:
- constructor(initialBalance = 1000)
- Set balance = initialBalance
- Set betAmount = 10
- Set gameHistory = []
- Set isSpinning = false

METHOD: spin(betAmount)
VALIDATION (in order, throw Error if failed):
  1. If isSpinning === true → throw Error('Spin already in progress')
  2. If betAmount < 1 → throw Error('Bet amount must be at least 1')
  3. If betAmount > this.balance → throw Error('Insufficient balance for bet')

EXECUTION:
  1. Set isSpinning = true
  2. Generate 3 random reel positions: [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]
  3. Deduct betAmount from this.balance
  4. Create spin record: { betAmount, reels, timestamp: Date.now() }
  5. Push spin record into gameHistory
  6. Set isSpinning = false
  7. Return { reels: [num, num, num], balance: this.balance, betAmount: this.betAmount }

METHOD: updateBet(newBetAmount)
VALIDATION:
  1. If newBetAmount < 1 → throw Error('Bet amount must be at least 1')
  2. If newBetAmount > this.balance → throw Error('Insufficient balance for bet')
EXECUTION:
  1. Set this.betAmount = newBetAmount
  2. Return this.betAmount

METHOD: getBalance()
- Return this.balance

METHOD: getGameHistory()
- Return a copy of gameHistory (not a reference)

METHOD: resetGame(newInitialBalance = 1000)
- Set balance = newInitialBalance
- Set betAmount = 10
- Clear gameHistory = []
- Set isSpinning = false

CODE REQUIREMENTS:
- Use JSDoc comments for all methods (include @param, @returns, @throws)
- Export as default export
- No UI code, no animations, no payout logic
- All error messages must be descriptive and user-friendly
- All validations must throw Error objects (not return false)

Deliverable: A working GameState.js file that manages game state and executes spins without any UI dependencies.

Result: It gave me a javascript file that runs in a browser console. Very barebones but it works properly. Since we specified only the core features I'm assuming that's why it didn't give me html and css.

What we learned: Codex strongly optimized for instruction fidelity. Because the prompt constrained scope to a pure `GameState` logic module and explicitly excluded UI, it returned only JavaScript logic without adding HTML/CSS scaffolding. This was notable because the prompt was long and detailed, yet the model still did not drift into unrelated output. The practical takeaway is that tightly bounded prompts can reduce hallucinated extras and produce implementation-ready artifacts for one layer of the stack at a time.

---
Entry #2

Prompt: Extend the existing GameState class with payout table and RTP (Return to Player) calculations. Do NOT rewrite the class—only add new properties and methods.

ADD NEW PROPERTY:
- payoutTable: object (static, defined in constructor or as class property)

PAYOUT TABLE STRUCTURE:
{
  "cherry": { multiplier: 10, probability: 0.20 },
  "bar": { multiplier: 25, probability: 0.10 },
  "bell": { multiplier: 50, probability: 0.05 },
  "seven": { multiplier: 100, probability: 0.02 },
  "none": { multiplier: 0, probability: 0.63 }
}

SYMBOL MAPPING (reel numbers 0-9 to symbols):
- 0-1: "cherry"
- 2-3: "bar"
- 4-5: "bell"
- 6-7: "seven"
- 8-9: "none" (no win)

NEW METHOD: getPayoutTable()
- Return the entire payoutTable object as-is
- Allows UI to display payout rules to players
- @returns {Object} The payout table

NEW METHOD: calculateRTP()
- Calculate theoretical Return to Player percentage
- FORMULA: Sum of (multiplier × probability) for all outcomes
- Example: (10 × 0.20) + (25 × 0.10) + (50 × 0.05) + (100 × 0.02) + (0 × 0.63) = RTP value
- Return as decimal (e.g., 0.94 for 94%)
- @returns {number} RTP as decimal (e.g., 0.94)

NEW METHOD: getSymbolName(reelNumber)
- INPUT: reelNumber (0-9, from a reel result)
- Convert reel number to symbol name using the SYMBOL MAPPING above
- @param {number} reelNumber - Reel position (0-9)
- @returns {string} Symbol name ("cherry", "bar", "bell", "seven", or "none")

NEW METHOD: getSymbolMultiplier(symbolName)
- INPUT: symbolName (string, e.g., "cherry")
- Look up the symbol in payoutTable
- Return the multiplier value
- If symbol not found, return 0
- @param {string} symbolName - Name of the symbol
- @returns {number} Payout multiplier (0 if not found)

CODE REQUIREMENTS:
- Add JSDoc comments (@param, @returns) to all new methods
- Initialize payoutTable in the constructor or as a class static property
- Do NOT modify existing methods (spin, updateBet, getBalance, getGameHistory, resetGame)
- No UI code, no animations, pure logic only
- All return values must match the types specified above

Result: It added new functions in the GameState.js which calculates the RTP. It did not take a long time to generate since there's no formatting or styling

What we learned: Incremental extension prompts worked well for controlled evolution of the codebase. By saying "do NOT rewrite the class" and listing exact additions, the model preserved prior behavior while appending RTP and payout utilities with correct data-shape consistency. We also observed that response speed was high when prompts targeted backend logic only (no design or formatting requirements). The limitation remains visibility into final product quality until integration with UI and deployment, so future prompts should include lightweight verification checks after each extension.

---
Entry #3 

Prompt: Extend the existing GameState class with win detection logic that evaluates spin results. Do NOT rewrite the class—only add new methods and modify the spin() method as specified.

NEW METHOD: evaluateSpin(reels)
- INPUT: reels array [num, num, num] (from a spin result)
- LOGIC:
  1. Check if all 3 reel numbers are identical (reels[0] === reels[1] === reels[2])
  2. If NOT identical → RETURN { isWin: false, symbolName: "none", multiplier: 0, payout: 0 }
  3. If identical:
     a. Convert first reel number to symbol name using this.getSymbolName(reels[0])
     b. Get multiplier for that symbol using this.getSymbolMultiplier(symbolName)
     c. Calculate payout = multiplier × this.betAmount (use current betAmount stored in class)
     d. RETURN { isWin: true, symbolName: string, multiplier: number, payout: number }
- @param {number[]} reels - Array of 3 reel positions [0-9, 0-9, 0-9]
- @returns {Object} { isWin: boolean, symbolName: string, multiplier: number, payout: number }

MODIFY EXISTING METHOD: spin(betAmount)
- Keep all existing validation and spin logic UNCHANGED
- AFTER pushing spinRecord to gameHistory and BEFORE returning:
  1. Call this.evaluateSpin(reels) to get the win result
  2. Store the result in spinRecord: spinRecord.result = evalResult
  3. Update the return object to include the result:
     RETURN { reels, balance: this.balance, betAmount: this.betAmount, result: evalResult }
- Do NOT modify any validation or bet deduction logic

NEW METHOD: spinWithPayout(betAmount)
- Convenience method that combines spin() with automatic payout crediting
- EXECUTION:
  1. Call const spinResult = this.spin(betAmount)
  2. Check if spinResult.result.isWin === true
  3. If true: Add spinResult.result.payout to this.balance
  4. RETURN { reels: spinResult.reels, balance: this.balance, betAmount: spinResult.betAmount, result: spinResult.result }
- @param {number} betAmount - Bet amount for this spin
- @returns {Object} Spin result with updated balance if win occurred

TESTING EXPECTATIONS:
- Winning combination [0, 0, 0] → "cherry" × 10 = payout
- Winning combination [2, 2, 2] → "bar" × 25 = payout
- Winning combination [6, 6, 6] → "seven" × 100 = payout
- Losing combination [0, 1, 2] → "none", payout = 0
- spinWithPayout() should credit balance only on wins

CODE REQUIREMENTS:
- Add JSDoc comments (@param, @returns) to all new methods
- Do NOT modify existing methods except spin()
- Do NOT modify constructor or other properties
- Keep all existing error handling and validation intact
- All return values must match the types specified above

Result: It expanded the GameState.js file and added the win detection algorithm. It also edited the spin method with the specific instructions.

What we learned: The model handled feature growth reliably when tasks were decomposed into explicit, testable deltas (new methods + one targeted method modification). It inserted win detection and payout credit flow in the expected location without disrupting validation order, which suggests strong compliance with step-by-step constraints. However, this phase reinforced that correctness in isolated logic does not equal user-facing completeness; without an interface, it is hard to assess usability, feedback clarity, and end-to-end flow. The next phase should pair UI generation prompts with strict acceptance criteria so we can validate both functional behavior and presentation quality.

---
Entry #4

Prompt: "You are building a mobile-first slot machine UI that connects to an existing GameState class.
Your goal is to create a polished, responsive frontend with clear state transitions, fast interaction, and strong visual feedback.
### CORE STRUCTURE
- Use a clear state machine:
- idle → spinning → result → payout → idle
- Prevent input during spinning
- Each state must have distinct visual feedback
### LAYOUT (MOBILE-FIRST)
1. Portrait layout with 3 sections:
 - Top HUD:
 - Balance
 - Bet
 - Last Win
2. Center:
 - 3 animated reels (main focus)
3. Bottom:
 - Large SPIN button (primary action)
 - Bet controls (+ / - / Max)
### VISUAL DESIGN
- Dark casino theme (black/purple background)
- Gold/red for wins and high-value symbols
- Neon glow accents
- Large, prominent win text
- Spin button must be most visually dominant
### INTERACTION LOOP
Set Bet → Spin → Animate Reels → Show Result → Feedback → Idle
- Total loop: ~2–4 seconds
- Support turbo mode (<1s animation)
### FEEDBACK SYSTEM
Differentiate win tiers visually:
- Loss → minimal feedback
- Small win → highlight + small animation
- Medium → screen flash + particles
- Big → large animation + counting win text
- Jackpot → full-screen celebration
Include sound hooks:
playSpinSound(), playStopSound(), playWinSound(tier)
### GAME FEEL REQUIREMENTS
- Reels spin vertically with staggered stops
- Occasionally show near-miss visuals (no RNG impact)
- Treat small payouts as wins (even if < bet)
- Keep loop fast and frictionless
### CONTROLS & SETTINGS
- Spin button (primary)
- Bet +/- and Max Bet
- Optional:
  i Auto-spin
  ii. Turbo mode
- Simple settings overlay:
  i. Sound toggle
  ii. Reduced motion toggle
### ACCESSIBILITY
- High contrast for all numbers
- Do not rely on color alone for feedback
- Large tap targets
- Support reduced motion
### ARCHITECTURE
- Do NOT use a single monolithic component
- Separate:
  i. UI components
  ii. State controller
  iii. Animation logic
Suggested components:
Reel, SlotMachine, HUD, SpinButton, WinOverlay
### GAMESTATE INTEGRATION
Use:
gameState.spinWithPayout(betAmount)
Display:
- Updated balance
- Win/loss result
- Last win
### OUTPUT
- Use React (preferred) or vanilla JS
- Functional components
- Include basic animations
- Use placeholder symbols (text/emojis OK)
### CONSTRAINTS
DO:
- Make spin button dominant
- Clearly show state transitions
- Use animation for feedback
DO NOT:
- Hide state changes
- Use static reels
- Block gameplay with menus
Goal: A smooth, engaging slot machine UI with fast gameplay, clear feedback, and strong visual hierarchy."

Result: We got a several jsx files and a css file, but no runnable html. 
i. Slot Machine.jsx
ii. Animations
 - reelAnimation.js
iii. Audio
 - soundHooks.js
iv. Components
 - BetControls.jsx
 - HUD.jsx
 - Reel.jsx
 - ReelSet.jsx
 - SettingsOverlay.jsx
 - SpinButton.jsx
 - WinOverlay.jsx
v. Controller
 - useSlotMachineController.js

What We Learned: We have to be more specific in what files we need/want created. We should specify what technologies we want to deploy. This came as a result of us not being given an html file. 

---
Entry #5

Prompt: "You are building a COMPLETE, RUNNABLE slot machine web app using an existing GameState class.

Your priority is NOT just UI components — your priority is a working app that can be opened and run locally.


### PRIMARY GOAL

Generate a fully runnable project with:

* index.html (entry point)
* All JS/React files wired correctly
* Styles (CSS or Tailwind)
* Clear instructions to run the app

The app must work when opened or started (no missing wiring).


### PROJECT STRUCTURE

Provide a clean structure like:

/src
/components
/state
main.jsx or index.js
index.html
package.json (if using React + Vite or similar)

* Ensure index.html properly mounts the app
* Ensure all imports resolve correctly
* No missing files


### CORE FUNCTIONALITY

* Use GameState.spinWithPayout(betAmount)

* Display:

* Balance
* Bet
* Last Win

* Allow:

* Spin
* Adjust bet

* Implement state flow:
idle → spinning → result → payout → idle


### UI/UX REQUIREMENTS (SIMPLIFIED)

* Mobile-first layout (portrait style)

* Large, dominant SPIN button (bottom)

* Center reel display (animated)

* Top HUD (balance, bet, last win)

* Animate reels vertically

* Show clear feedback for:

* Loss
* Win (small vs big visually different)


### IMPORTANT: RUNNABILITY

You MUST:

* Include index.html
* Include script mounting (ReactDOM or equivalent)
* Include package.json if needed
* Include exact steps to run:
(example: npm install → npm run dev)

DO NOT:

* Output only components without entry point
* Leave the app in a non-runnable state


### CODE QUALITY REQUIREMENTS

* Use small, modular components (no giant files)
* Use clear naming
* Avoid duplicate code
* Include JSDoc comments for major functions
* Handle errors (invalid bet, insufficient balance)


### TESTING (BASIC)

* Include at least 1–2 simple unit tests (e.g., GameState behavior)
* Use a simple framework (Vitest or Jest)


### CONSTRAINTS FROM ASSIGNMENT

* Code must be:

* Clean (modular, readable)
* Documented (JSDoc)
* Testable
* Everything must exist in the repo structure
* Do NOT simulate commits — just generate files

### OUTPUT FORMAT

* Show ALL files with filenames clearly labeled
* Ensure nothing is missing
* Include run instructions at the end



Goal: A clean, minimal but COMPLETE slot machine app that actually runs, not just a collection of components."

Result: There is now an html file. When running the program, the last slot in the spinner may glitch and take longer before settling into place (animation). There is an option for enabling sound and reducing motion. Fix auto-spin not being able to stop

What We Learned: Longer prompts take a lot longer. By making it shorter and reasonable, the AI will take less time to make the necessary files. We would also have to be more specific with what we want labelled. We learned also that we want changes to how the UI/UX turned out, since that affects how engaging. Because there was no reset button, the ease of starting over and playing was compromised, so we want to change what is displayed in the slot, change what is being tracked, and how we can change the bets.

---
Entry #6

Prompt: "Update the existing slot machine UI code (do not rewrite from scratch). Fix and improve the following:

1. Sound
- Ensure sounds trigger reliably on spin and win
- Prevent overlapping audio (stop or reset before replay)
- Add clear separation: spin sound vs win sound

2. Betting System
- Replace free input with fixed bet options (e.g. 5, 10, 25, 50, 100)
- Allow selection via buttons
- Visually highlight the selected bet

3. Spinning Animation
- Fix any bugs where reels stop instantly or desync
- Ensure a 1–2 second animation before showing results
- Reels should stop sequentially (slight delay between each)

4. Reel Display
- Replace numbers with emoji symbols (:cherries: :lemon: :bell: :star: :seven:)
- Use getSymbolName() to map values correctly

5. Result Display
- Replace “last win” with “net gain”
- Net gain = payout - betAmount
- Display clearly (+/-) and update after each spin

Constraints:
- Keep using the existing GameState class
- Do not duplicate logic already in GameState
- Keep UI simple and mobile-friendly
- Only modify what’s necessary

Return updated components and explain key fixes briefly."

Result: Net gain is not working as intended. It is only counting with relative gain of the last turn rather than the total. Final slot spinner animation is not working. Betting functionality works as we asked. Sound is not working as intended. 

What We Learned: Results showed on the screen should stay longer. We didn't see that many comments in the code produced, so we should include in the prompt that we want comments so that humans when looking back through it can understand what each prompt does.

---
Entry #7

Prompt: "Update the existing slot machine UI (do not rewrite).

Add/fix:
- Reset button when balance = 0 → calls resetGame()
- Info section/modal explaining symbols (emojis) + payouts
- Result popup: stays ~2–3s, green for win, red for loss
- “Net gain” should only show winnings (never negative, show 0 if loss)
- Add clear comments for readability

Constraints:
- Use GameState as source of truth
- Keep UI simple and mobile-friendly

Return updated code."

Result: There is a logic issue with how our payouts are calculated and monitored, since no matter the result our wins are not given. There are still no comments being made in the files.

What We Learned: We should expand the test cases so that we are not just looking at the base functionality, but also the UI and edge cases. Because the auto-spin is difficult to turn off, we should hace a separate button. The info section was not clear, so we should specify what we want. We will likely be focusing out next prompt to debug our code with the specific issues and how we would want them to be fixed. 

---
Entry #8

Prompt: "Update the existing slot machine UI (do not rewrite).

Add/fix:
- Stop Auto-Spin button (toggles auto-spin off immediately)
- Fix last reel animation so all reels are synced and stop correctly
- Fix win logic bug (user should win when all symbols match)
- Improve info section: clearly show emoji + payout (e.g. :star::star: → +$100)
- Result popup: stays ~2–3s, green (win) / red (loss)
- Net gain: show winnings only (never negative, 0 if loss)
- Reset button when balance = 0 → calls resetGame()
- Add more unit tests for spin, payout, and edge cases
- Add clear comments for readability

Constraints:
- Use GameState as source of truth
- Keep UI simple and mobile-friendly

Return updated code + tests."

Result: The animation for the last spinner is fixed. Auto-spin has a button to stop it. Last win still applies to the last roll rather than the full game lifetime.

What We Learned: The odds of winning are very low so we should improve those. We need to improve the information section because it has repition. We need more clarity on the results message. In future sessions, fix/adjust the UI since visually it is bland. There are two win displays, so we should get rid of the second underneath the slots because it serves little functionality and is repetitive. 

Entry #9

prompt: Update the existing slot machine web app (do NOT rewrite from scratch). Improve and fix the current code to make it a hyper-addictive, sensory-rich Roblox-style gacha slot machine that triggers constant "just one more spin" dopamine.

### CRITICAL FIXES
1. Net Gain → Change "Net Gain" to show lifetime total winnings only (never losses or spent amount). It must accumulate across all spins, not reset to the last spin.
2. Remove the second/duplicated win/loss display under the reels.
3. Fix win detection & payout logic so matching symbols (all three reels identical) correctly pay out every time.
4. Improve win/loss message in the result popup: clear, short, exciting (e.g. "BIG WIN! +420 VC" or "Better luck next spin").
5. Increase win odds significantly (make the game feel rewarding and fun — target ~25-35% win rate).

### VISUAL & UX UPGRADES (make it juicy)
- Dark purple/red casino theme, neon glows, gold accents
- Make the 100 VC bet button glow brightly by default
- Bet buttons: 5 / 10 / 25 / 50 / 100 (highlight selected)
- Larger, more dominant SPIN button with glow pulse
- Reels: realistic vertical spin with staggered stops, screen shake on spin
- Every win = confetti explosion + victory sound + screen flash + camera shake
- Result popup stays 2.5 seconds, green for wins, red for losses

### NEW ADDICTIVE FEATURES
- Auto-Spin button that keeps spinning until balance = 0 or manually stopped (big visible Stop button)
- Turbo checkbox (faster ~0.8s spins)
- "Info" modal → clean payout table with emoji symbols + multipliers
- Biggest Win showcase (fireworks + multiplier pop-up)
- Win log panel that ONLY shows gains (never spent amounts)
- Daily VC Grant button (once per day, tempting visual)

Keep using the existing GameState class as source of truth. Keep the app fully runnable (index.html + all files). Add helpful comments. Return all updated files clearly labeled.

Result:
Upgraded the existing app (not rewritten) with fixed payout/win logic, lifetime-winnings-only tracking, cleaner result popup messaging, ~30% win rate, and new addictive features (auto-spin, turbo, payout info, biggest win, win-only log, daily VC grant) plus stronger casino-style visuals/effects.

Learned:
Single-source state in GameState made updates reliable; separating lifetime winnings from balance avoided logic bugs; stronger feedback loops and validated odds improved fun while keeping behavior correct.



# Run 10

Prompt:
fix the winning amount display. its not accurately reflecting the win amount. 

Result:
Fixed the win amount display so the popup now always shows the exact payout for the current spin immediately, instead of a delayed or stale value.

Learned:
The displayed win value was tied to a later animation phase; setting it at result reveal keeps UI feedback accurate and in sync with game logic.


# Run 11

Prompt: 

---
name: Slot Machine Gamification
overview: Fix identified bugs in the slot machine, tune game economics for addictive variable-ratio reinforcement, and add streak/combo/milestone/progressive-jackpot systems to maximize engagement.
todos:
  - id: fix-bugs
    content: "Fix all 5 identified bugs: near-miss ternary, WinOverlay PAYOUT visibility, dead effectsToken, duplicated formatCredits (extract to util), RTP tuning to ~92%"
    status: pending
  - id: streak-combo
    content: Add win/loss streak tracking and combo multiplier system to GameState + controller + HUD display
    status: pending
  - id: jackpot-pool
    content: Add progressive jackpot pool (2% of bets) with persistence and prominent display
    status: pending
  - id: milestones-pity
    content: Add spin milestone bonuses (10/25/50), pity system (force win after 8 losses), total spin counter with persistence
    status: pending
  - id: near-miss-upgrade
    content: "Upgrade near-miss system: higher frequency when reels 1+2 match, slow-down animation, SO CLOSE text"
    status: pending
  - id: persistence
    content: Full localStorage persistence for balance, streaks, spins, jackpot pool, biggest win
    status: pending
  - id: visual-audio-juice
    content: Scaled screen shake, urgency pulse on spin button, loss sound, streak fire animation, combo glow, jackpot ticker, milestone popup, machine temperature indicator
    status: pending
  - id: update-tests
    content: "Add tests for new GameState features: streaks, combo, jackpot, milestones, pity, persistence"
    status: pending
isProject: false
---

# Slot Machine: Bug Fixes + Hyper-Gamification

## Bugs Found

### Bug 1 -- Near-miss ternary is a no-op
In [`src/animations/reelAnimation.js`](src/animations/reelAnimation.js) line 152:

```147:153:src/animations/reelAnimation.js
export function createNearMissHint({ isWin, finalSymbols }) {
  if (isWin === true || Math.random() > 0.26) {
    return null;
  }

  const targetBase = finalSymbols[0] === finalSymbols[1] ? finalSymbols[0] : finalSymbols[0];
```

Both branches of the ternary return `finalSymbols[0]` -- the condition is meaningless. Should only trigger near-miss when the first two reels match (a true "almost won" scenario), and show the matching symbol as the tease on reel 3.

### Bug 2 -- WinOverlay vanishes during PAYOUT phase
[`src/components/WinOverlay.jsx`](src/components/WinOverlay.jsx) line 16 checks `machineState !== MACHINE_STATES.RESULT` and returns null. But the controller transitions RESULT -> PAYOUT -> IDLE. So the overlay disappears while the win counter is still animating. The overlay should remain visible during both RESULT and PAYOUT states.

### Bug 3 -- Unused `effectsToken`
The controller exports `effectsToken` but [`src/SlotMachine.jsx`](src/SlotMachine.jsx) never passes it to any child component. Dead code to remove.

### Bug 4 -- Duplicated `formatCredits` in 5 files
`formatCredits` / `formatValue` is independently defined in `SlotMachine.jsx`, `useSlotMachineController.js`, `HUD.jsx`, `WinOverlay.jsx`, and `BetControls.jsx`. Extract to a single shared utility.

### Bug 5 -- RTP is 855% (player always profits)
The current math: `0.3 win rate * (0.45*10 + 0.30*25 + 0.17*50 + 0.08*100) = 0.3 * 28.5 = 8.55x`. For every 1 VC wagered, expected return is 8.55 VC. There is zero tension because the player always comes out massively ahead. Needs tuning to ~92% RTP for realistic feel with occasional big wins.

---

## Gamification Enhancements

### 1. Win/Loss Streak System
- Track consecutive wins (`currentWinStreak`) and consecutive losses (`currentLossStreak`) in `GameState`
- Display streak counter in HUD with fire animation when >= 3
- Show "HOT STREAK x5!" overlay text during sustained runs
- After 3+ losses, show "DUE FOR A WIN" messaging (loss aversion hook)

### 2. Combo Multiplier
- Consecutive wins apply escalating payout bonus: streak 2 = 1.2x, streak 3 = 1.5x, streak 5 = 2x
- Golden glow on the HUD when combo is active
- Visual "COMBO x1.5" badge appears on screen during active combo
- Combo breaks on any loss (creates tension to keep spinning)

### 3. Progressive Jackpot Pool
- 2% of every bet feeds a visible progressive jackpot pool
- Pool displays prominently at the top with a ticking counter
- When triple-sevens hit, the jackpot pool is awarded ON TOP of the normal payout
- Pool persists in localStorage

### 4. Spin Milestone Bonuses
- Track total spins across sessions (persisted)
- Every 10 spins: small bonus (50 VC)
- Every 25 spins: medium bonus (150 VC)
- Every 50 spins: big bonus (500 VC) + guaranteed win on next spin
- Show "Next bonus in X spins" countdown in the HUD
- Animated milestone celebration popup

### 5. Lucky Spin Guarantee
- After 8 consecutive losses, force the next spin to be a win (pity system)
- Show subtle "luck is building..." messaging after 5+ losses
- Creates the illusion of hot/cold cycles

### 6. Enhanced Near-Miss System (fix + upgrade)
- Fix the ternary bug so near-miss only fires when reels 1+2 match
- Increase near-miss frequency to ~35% of losses when first two match
- Add dramatic slow-down animation on reel 3 during near-miss
- Flash "SO CLOSE!" text
- Near-misses are the strongest driver of continued play in slot research

### 7. Balance + State Persistence
- Save full game state to localStorage on every spin: balance, streaks, total spins, jackpot pool, biggest win, win log
- Hydrate on mount so progress survives page refresh
- Show "Welcome back! Balance: X VC" on return

### 8. Visual/Audio Juice
- Scale screen shake intensity with win tier (small = subtle, jackpot = heavy shake)
- Add pulsing "SPIN NOW" urgency animation that speeds up after losses
- Win counter counts up with accelerating tick sound
- Jackpot wins get extended celebration with multiple firework layers
- Losses get a quick "whomp" deflation sound rather than silence
- Reel stage border color pulses with combo multiplier color

### 9. "Machine Temperature" Indicator
- Visual thermometer or "hot/cold" badge based on recent win rate
- Updates after each spin based on last 10 results
- "MACHINE IS ON FIRE" when 4+ of last 10 were wins
- Pure psychological decoration (outcome is still random) but creates narrative

### 10. Quick Stats Banner
- Replace the plain "State: Idle/Spinning" HUD bar with useful info:
  - Total spins this session
  - Current streak (wins or losses)
  - Next milestone countdown
  - Jackpot pool amount

---

## File Changes Summary

- [`src/state/GameState.js`](src/state/GameState.js) -- Add streak tracking, combo multiplier, jackpot pool, milestone tracking, pity timer, persistence, tune RTP
- [`src/controller/useSlotMachineController.js`](src/controller/useSlotMachineController.js) -- Wire new state, persistence, combo/streak/milestone logic, pity system
- [`src/animations/reelAnimation.js`](src/animations/reelAnimation.js) -- Fix near-miss bug, add combo tier, machine temperature helpers
- [`src/components/HUD.jsx`](src/components/HUD.jsx) -- Show jackpot pool, streak, combo, next milestone countdown, machine temp
- [`src/components/WinOverlay.jsx`](src/components/WinOverlay.jsx) -- Fix PAYOUT visibility bug, add streak/combo celebration text, milestone popup
- [`src/components/SpinButton.jsx`](src/components/SpinButton.jsx) -- Urgency pulse that scales with loss streak
- [`src/components/BetControls.jsx`](src/components/BetControls.jsx) -- Minor: use shared formatCredits
- [`src/SlotMachine.jsx`](src/SlotMachine.jsx) -- Wire new props, remove dead effectsToken, add combo/streak/jackpot display sections
- [`src/styles.css`](src/styles.css) -- Streak fire animation, combo glow, jackpot ticker, milestone popup, temperature indicator, enhanced near-miss, urgency pulse
- [`src/audio/soundHooks.js`](src/audio/soundHooks.js) -- Add loss sound, streak sound, milestone fanfare, combo sound
- New: `src/utils/formatCredits.js` -- Shared formatter (extract from 5 files)
- [`src/tests/GameState.test.js`](src/tests/GameState.test.js) -- Add tests for streaks, combo, jackpot, milestones, pity, persistence

Result: Implemented the full hyper-gamification plan with bug fixes, including near-miss correction, PAYOUT-phase overlay persistence, streak/combo systems, progressive jackpot, milestone bonuses, pity spins, persistence, audio/visual enhancements, and updated tests.

Learned: The biggest stability risk was not missing features but mismatched contracts between upgraded state/controller logic and UI props, so reconciling those interfaces was crucial.

Prompt 12: ---
name: Slot Machine Visual Overhaul
overview: Remove the full-screen white flash on wins and replace it with a suite of polished, tier-scaled visual features that make the slot machine feel like a real casino game.
todos:
  - id: remove-flash
    content: Remove the win-flash keyframe and ::before pseudo-element from styles.css
    status: pending
  - id: scaled-celebrations
    content: Rework win-impact CSS classes for tier-scaled glow/vignette/shake instead of flash; make WinOverlay particle count dynamic by tier
    status: pending
  - id: streak-counter
    content: Create StreakCounter component with glowing multiplier display; expose winStreak from controller; mount above reels
    status: pending
  - id: wins-ticker
    content: Create WinsTicker component with fake scrolling win messages every 8-12s; mount at top of app
    status: pending
  - id: smooth-balance
    content: Enhance balance counter with rAF ease-out animation, counting CSS class on HUD, and tick sound
    status: pending
  - id: hall-of-fame
    content: Add top-3 wins tracking to GameState persistence; enhance biggest win showcase with fireworks and gold styling
    status: pending
isProject: false
---

# Slot Machine Visual Overhaul

## Features Selected

From the suggestions, these five deliver the best bang-for-effort and work together as a cohesive experience. "Multiple Slot Machines" and "Perk Shop" are excluded — they're large scope and change game balance/architecture significantly.

---

## 1. Remove the blinding flash (mandatory)

The flash lives in [`src/styles.css`](src/styles.css) as `.slot-machine.win-impact::before` with a `win-flash` keyframe (full-viewport white radial gradient at 0.6 opacity). Remove the `::before` pseudo-element and the `win-flash` keyframe entirely. Keep the `win-shake` animation on `.win-impact` but reduce intensity for small wins (see feature 5).

---

## 2. Win Streak Multiplier Display

The combo system already exists in `GameState.getComboMultiplier()` (1x / 1.2x / 1.5x / 2x at streaks 1/2-2/3-4/5+). What's missing is a **prominent visual**.

- Add a new `StreakCounter` component rendered above the reel stage in [`src/SlotMachine.jsx`](src/SlotMachine.jsx).
- Shows the current streak count and multiplier (e.g., "x1.5 STREAK 3") with a pulsing glow that intensifies with streak level.
- Animates in on win, shakes/fades on loss (reset). Uses CSS `text-shadow` glow + scale keyframes.
- Data already available: `currentWinStreak` is in `GameState` and exposed via the controller's `syncFromGameState`.

---

## 3. Live Wins Ticker

- Add a new `WinsTicker` component as a scrolling banner at the very top of the app in [`src/SlotMachine.jsx`](src/SlotMachine.jsx).
- Every 8-12 seconds (random interval), generate a fake message like `"Player_7291 just won 1,250 VC!"` using random name/amount generation.
- CSS `marquee`-style animation (use `@keyframes ticker-scroll` translateX from right to left).
- Pauses on hover. Semi-transparent dark background strip. Gold text.

---

## 4. Smooth Balance Counter

The controller already has a `startWinCounter` mechanism in [`src/controller/useSlotMachineController.js`](src/controller/useSlotMachineController.js). Enhance it:

- Use `requestAnimationFrame` to animate `displayedBalance` counting up from old value to new value over ~1.2 seconds with an ease-out curve.
- Add a CSS class `balance-counting` to the HUD balance element during the animation (glow pulse, slight scale-up).
- Play a rapid ticking sound (short oscillator bursts at increasing pitch) during the count-up, ending with a satisfying "ding" from the existing Web Audio system in [`src/audio/soundHooks.js`](src/audio/soundHooks.js).

---

## 5. Scaled Celebration Intensity

Replace the removed flash with tier-appropriate celebrations. Modify [`src/styles.css`](src/styles.css) and [`src/components/WinOverlay.jsx`](src/components/WinOverlay.jsx):

| Tier | Visual |
|------|--------|
| **Small** | Subtle green glow on reel border, light confetti (5 particles), no shake |
| **Medium** | Gold glow on reel border, moderate confetti (15 particles), gentle shake (1 cycle) |
| **Big** | Bright gold border pulse, heavy confetti (25 particles), strong shake (2 cycles), screen edge vignette |
| **Jackpot** | Full confetti storm (40+ particles), extended shake (3 cycles), radial gold vignette, firework bursts, special jackpot sound |

The existing `impact-${winTier}` CSS classes already exist on `.slot-machine` — rework their animations from flash-based to glow/vignette/shake-based. Particle count in `WinOverlay.jsx` currently hardcoded at 10 — make it dynamic based on `winTier`.

---

## 6. Biggest Win Hall of Fame

The "Biggest Win" showcase already exists in [`src/SlotMachine.jsx`](src/SlotMachine.jsx) with a `celebrate` class. Enhance it:

- Add a persistent firework animation (CSS-only, 3-4 small bursts) when the showcase is in `celebrate` mode (new record).
- Add a "HALL OF FAME" header with a gold gradient text effect.
- Show the top 3 biggest wins (not just the single biggest). Store `topWins` array (max 3) in `GameState` persistence alongside existing `biggestWin`.
- Each entry shows: amount, symbol, timestamp formatted as relative time.

---

## Key Files to Modify

- [`src/styles.css`](src/styles.css) — Remove flash, add tier glows/vignettes, ticker styles, streak glow, balance counting animation, hall of fame styles
- [`src/SlotMachine.jsx`](src/SlotMachine.jsx) — Add `StreakCounter`, `WinsTicker`, `HallOfFame` sections; adjust particle counts
- [`src/controller/useSlotMachineController.js`](src/controller/useSlotMachineController.js) — Expose `winStreak`, enhance balance counter with rAF, expose `topWins`
- [`src/state/GameState.js`](src/state/GameState.js) — Add `topWins` array tracking, persist it
- [`src/components/WinOverlay.jsx`](src/components/WinOverlay.jsx) — Dynamic particle count by tier
- [`src/components/HUD.jsx`](src/components/HUD.jsx) — Balance counting CSS class
- [`src/audio/soundHooks.js`](src/audio/soundHooks.js) — Add balance tick sound + jackpot-specific sound
- New: `src/components/StreakCounter.jsx`, `src/components/WinsTicker.jsx`

Result: The win experience was fully overhauled by removing the blinding flash and replacing it with tiered celebration effects, plus a live wins ticker, streak multiplier display, smooth balance count-up with sound, and a persistent Hall of Fame top-3 wins system.

Learned: Building polish features works best when game-state, animation, and audio are coordinated through a single controller, and persistence (localStorage) should be extended alongside UI so new features feel cohesive across sessions.

Prompt 13:

