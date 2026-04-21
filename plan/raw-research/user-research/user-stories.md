# Slot Machine Game -  User Stories

----

### User Stories by Persona

**Jordan Kim (Strategic / Risk-Oriented):**
- Story 1: Adjust Bet Size
- Story 2: View Statistics and History
- Story 3: Understand Odds and Payouts
- Story 9: Risk/Reward Adjustment Mode
- Story 12: Bet History and Strategy Tracking
- Story 15: Consistent Game Rules

**Ryan Higa (Casual / Entertainment):**
- Story 4: Clear Feedback on Outcomes
- Story 5: Single-Button Spin Mechanic
- Story 7: Visual and Audio Feedback
- Story 11: Fast Gameplay (for mobiles too)
- Story 14: Game Tutorial

**Both Personas:**
- Story 6: Error Handling
- Story 8: Balance Display and Session Tracking
- Story 10: Share Results
- Story 13: Responsive UI

### Design Priorities

1. **Speed & Responsiveness** (critical for Ryan)
2. **Transparency & Control** (critical for Jordan)
3. **Visual/Audio Polish** (important for both)
4. **Mobile Optimization** (important for Ryan)
5. **Data & Analytics** (important for Jordan)
6. **Simplicity & Intuitiveness** (important for Ryan)

-----


# USER STORIES

## USER STORY 1: Adjust Bet Size to Match Risk Tolerance (Jordan)

**As a** player who wants control over my game outcomes
**I want** to easily adjust my bet size before each spin
**So that** I can experiment with different betting strategies and feel like I have agency in the game

### Acceptance Criteria
- [ ] Bet size selector is visible and easy to adjust (slider or +/- buttons)
- [ ] Minimum and maximum bet amounts are clearly displayed
- [ ] Current bet size is highlighted before spin
- [ ] Bet size persists across multiple spins (but can be changed anytime)
- [ ] System prevents betting more than current balance
- [ ] Change in bet size immediately updates potential win payout display

### Notes
- Bet adjustment should not  interrupt gameplay flow
- Keep bet selector accessible but not cluttered
- Consider different bet ranges ( $5, $10, $25, $50+)
- Visual effects and popup messages should show how bet affects potential winnings

---

## USER STORY 2: View Game Statistics and History (Jordan)

**As a** player who wants to understand patterns
**I want** to access a stats dashboard showing my win/loss history and trends
**So that** I can analyze my gameplay and test different strategies over time

### Acceptance Criteria
- [ ] Stats dashboard shows total spins, wins, losses, and net balance change
- [ ] Session history is displayed (current session + past sessions)
- [ ] Charts/graphs shows win streak, total wins,net balance,losses etc
- [ ] Data is automatically tracked and saved,persistent if app shuts before session ends correctly.
- [ ] Stats update in real time after each spin

### Notes
- Stats should be non-judgmental (not preachy about gambling)
- Real-time updates provide immediate response to the user(sarcastic or shocke, depending on win/loss)
- Historical data helps identify patterns (even if random)
- Keep stats accessible with a button or sidebar

---

## USER STORY 3: Understand Game Odds and Payout Rules (Jordan)

**As a** player who wants transparency
**I want** to easily view the odds, RTP (Return to Player), and payout table
**So that** I understand how the game works and can make informed betting decisions

### Acceptance Criteria
- [ ] "How to Play" section explains basic rules clearly
- [ ] Payout table shows all winning combinations and their payouts
- [ ] RTP percentage is clearly displayed
- [ ] Odds of winning on each spin are explained (in plain language, not jargon)
- [ ] Information is accessible from main menu without interrupting gameplay
- [ ] Rules are written in simple, non-technical language
- [ ] Optional: Animated explanation of how slots work

### Notes
- Transparency builds trust and addresses Jordan's frustration with "black box" mechanics
- Consider modal popup or dedicated Info page
- Should address Jordan's concern: "How is the outcome determined?"
- Keep it optional—casual players won't read, but strategic players will

---

## USER STORY 4: Clear, Immediate Feedback on Game Outcomes (Ryan)

**As a** player who wants instant clarity
**I want** to immediately see if I won or lost and how much
**So that** I feel satisfied with the outcome and understand what happened

### Acceptance Criteria
- [ ] Win/loss result is prominently displayed on screen immediately after spin
- [ ] Amount won/lost is shown in large,bold text
- [ ] Win animations trigger automatically for victories (no button clicks needed)
- [ ] Sound effects play for wins and losses
- [ ] Loss is clearly indicated (no ambiguity)
- [ ] New balance is updated and visible
- [ ] Net gain/loss for the session is continuously displayed
- [ ] Jokes/response does not block the next spin (happens in parallel)

### Notes
- Feedback should be immediate, within 1 second of spin completion
- Visual + audio feedback is more satisfying than text alone
- Animation should not delay gameplay, keep spins fast
- Ryan specifically needs clarity so avoid ambiguous results

---

## USER STORY 5: Single-Button, Intuitive Spin Mechanic

**As a** casual player like Ryan who wants simplicity
**I want** to spin the slot machine with one obvious button
**So that** I don't have to figure out how to play.

### Acceptance Criteria
- [ ] One prominent "SPIN" button is the primary interaction
- [ ] Spin button is large, centered, and visually distinct
- [ ] Button is disabled during spinning (prevents accidental double-clicks)
- [ ] Button re-enables immediately when spin completes
- [ ] No other buttons required to play (bet/balance controls are separate)
- [ ] Spin initiates instantly when clicked (no lag)
- [ ] Button label is clear ("SPIN" not "Execute" or other jargon)

### Notes
- Ryan's persona emphasizes only one button as it is ismple and direct
- Disable button during spin to prevent issues
- Fast response time is critical for casual players
- Avoid nested menus or confusing navigation

---

## USER STORY 6: Prevent Invalid Actions and Handle Errors Gracefully

**As a** player (both Jordan and Ryan)
**I want** to receive clear, helpful messages when something goes wrong
**So that** I understand what happened and what to do next—without the game breaking

### Acceptance Criteria
- [ ] User is notified if balance is too low to spin (clear message, not silent)
- [ ] System prevents invalid actions (e.g., spinning with $0 balance)
- [ ] Error messages are displayed prominently but don't interrupt gameplay flow
- [ ] Messages are friendly and suggest next steps
- [ ] Error messages persist for 3-5 seconds (enough time to read)
- [ ] Game state is never stopped by errors,only user can end game session
- [ ] Repeated invalid actions don't spam error messages
- [ ] Button spam prevention: clicking spin multiple times during spin is ignored

### Notes
- Reference: https://www.dreamjackpot.com/blog/slot-malfunctions-explained
- Doubleclick protection:disable spin button while spinning
- Balance = $0 should prevent spin before it happens (not after)
- Keep error messages brief and actionable

---

## USER STORY 7: Visual and Audio Feedback for Engaging Gameplay

**As a** player like Ryan who enjoys interactive games
**I want** to see smooth animations and hear satisfying sounds during play
**So that** the game feels satisfying, engaging, and fun

### Acceptance Criteria
- [ ] Slot reels spin smoothly with no lag or stuttering
- [ ] Win animations are satisfying (reel highlighting, visual effects)
- [ ] Sound effects play for spin initiation, reel stops, and wins
- [ ] Spin sound is subtle and doesn't overwhelm
- [ ] Audio can be toggled on/off (volume control or mute)
- [ ] No animation lag
- [ ] Visual effects are consistent with game theme/branding
- [ ] Mobile devices handle animations smoothly (no frame drops)

### Notes
- Reference: https://uxmag.com/articles/designing-interface-animations-the-book-excerpt
- Keep animations under 1 second total to maintain fast gameplay
- Don't overdo effects—stay satisfying, not overwhelming
- Sound should enhance, not distract (volume default should be moderate)
- Test on various devices for performance

---

## USER STORY 8: Transparent Balance Display and Session Tracking

**As a** player (both Jordan and Ryan)
**I want** to clearly see my current balance and net gain/loss at all times
**So that** I know exactly where I stand and can make informed decisions

### Acceptance Criteria
- [ ] Current balance is displayed prominently 
- [ ] Balance updates immediately after each spin
- [ ] Net session gain/loss is shown separately, as temporarily pop up message
- [ ] Initial balance at session start is recorded
- [ ] Balance display is readable on all screen sizes
- [ ] Visual indicator for positive vs. negative gain (e.g., green/red text), golden if on a winning streak

### Notes
- Jordan wants to track "balance changes" over time
- Ryan wants simple, clear numbers, hence no complexity
- Displaying net gain/loss helps both personas understand their session performance
- Update should be instantaneous (no delay after spin result)

---

## USER STORY 9: Risk/Reward Adjustment Mode (High-Risk Betting)

**As a** thrill-seeking player like Jordan who wants higher stakes gameplay
**I want** to optionally enable a "high-risk" mode where I can bet more for bigger rewards
**So that** I can feel a greater sense of excitement and control over my potential winnings

### Acceptance Criteria
- [ ] Toggle or mode selector for "Standard" vs. "High-Risk" gameplay
- [ ] High-Risk mode increases bet range and potential payout multipliers
- [ ] Odds or frequency of winning may differ (clearly stated)
- [ ] User must explicitly opt-in to High-Risk mode
- [ ] Mode selection is saved as user preference
- [ ] Visual indicator shows which mode is active
- [ ] Return to Player (RTP) is displayed for each mode
- [ ] Mode can be switched between sessions (not permanently locked)

### Notes
- Reference: Russian Roulette style gameplay (higher risk = higher reward)
- Jordan's persona specifically mentions "risk-oriented"—this gives him control
- Must be optional and clearly explained (not default)
- Address concern: https://community.gamcare.org.uk/forum/overcoming-problem-gambling/
- Transparency about odds/RTP is critical

---

## USER STORY 10: Share Results and Celebrate Wins

**As a** player like Ryan who enjoys sharing success
**I want** to share my wins with others or commemorate big moments
**So that** I can feel part of a community and celebrate my achievements

### Acceptance Criteria
- [ ] "Share Result" button appears after a win
- [ ] Share options include social media (Twitter, Discord, email)
- [ ] Share message includes: amount won, timestamp, optional custom message
- [ ] Pre-populated share text is engaging but not misleading 
- [ ] Option to include a screenshot or result card
- [ ] Share link or text can be copied manually- [ ] Privacy: shares don't expose real balance or personal data
- [ ] Celebratory message displays on win (e.g., "Awesome win!")

### Notes
- Reference: https://wonderlandcasino.com/2025/06/30/incredible-stories-of-big-slot-machine-wins/
- Jordan may want to share to show strategy success
- Ryan may want to share for social validation
- Avoid encouragement for problem gambling (keep it celebratory, not addictive)
- Share feature should be social/fun, not pushy

---

## USER STORY 11: Fast Gameplay Loop and Mobile Optimization

**As a** casual player like Ryan who plays on mobile between activities
**I want** the game to be fast, responsive, and work smoothly on my phone
**So that** I can quickly play during breaks without frustration or lag

### Acceptance Criteria
- [ ] Spin completes within 2-3 seconds (total spin + result time)
- [ ] No lag or frame drops on mobile devices
- [ ] Touch controls are responsive (spin button feels immediate)
- [ ] Game is optimized for mobile screen sizes (vertical and horizontal)
- [ ] Load time from start to playable state is under 2 seconds
- [ ] No janky animations or stuttering during spin
- [ ] Buttons are mobile friendly 
- [ ] Works offline or with poor connectivity (or clearly indicates need for connection)

### Notes
- Ryan's context: plays during classes/between activities (needs fast cycles)
- Mobile is primary platform for casual players
- Performance is non-negotiable for user retention
- Test on low-end devices (not just flagship phones)

---

## USER STORY 12: Bet History and Strategy Tracking

**As a** strategic player like Jordan who tests different approaches
**I want** to track my past bets and their outcomes
**So that** I can analyze which bet sizes and strategies work best

### Acceptance Criteria
- [ ] Spin history shows: bet amount, result (win/loss), payout amount, timestamp
- [ ] Ability to filter history by bet size, win/loss, or date range
- [ ] Charts show correlation between bet size and win frequency
- [ ] Can mark "experiments" or label sessions (e.g., "Testing $25 bets")
- [ ] History is persisted across sessions (not cleared on logout)
- [ ] Can export history as CSV or PDF for external analysis
- [ ] Visual comparison of different strategies (e.g., side-by-side charts)
- [ ] History is accessible without interrupting gameplay

### Notes
- Jordan specifically wants to "test bets" and "understand patterns"
- This supports his goal of getting a "skill-like feeling"
- Data visualization is key (charts, not just lists)
- Optional feature—not required for casual players like Ryan

---

## USER STORY 13: Responsive UI and Readability Across Devices

**As a** any player
**I want** the game interface to be clear and readable on my device (phone, tablet, desktop)
**So that** I can comfortably play without squinting or scrolling unnecessarily

### Acceptance Criteria
- [ ] UI adapts to mobile (vertical), tablet (landscape), and desktop screens
- [ ] Text is readable without zooming
- [ ] Buttons and interactive elements are appropriately sized for each device
- [ ] Balance, spin button, and results are always visible (no excessive scrolling)
- [ ] Layout prioritizes essential elements: balance, reels, spin button, result
- [ ] Colors have sufficient contrast for accessibility
- [ ] Landscape mode works as well as portrait on mobile

### Notes
- Ryan plays on mobile—responsive design is critical for him
- Jordan may use desktop for stats review,ensure stats are readable there too
- Test on various screen sizes (iPhone, Android, iPad, desktop)
- Accessibility: ensure text contrast meets WCAG standards

---

## USER STORY 14: Game Tutorial

**As a** new player like Ryan who doesn't want to read instructions
**I want** a quick, optional tutorial that shows me how to play
**So that** I can start playing immediately without confusion

### Acceptance Criteria
- [ ] Tutorial is optional (can skip or dismiss)
- [ ] Tutorial covers: balance, spin button, results, bet adjustment
- [ ] Tutorial uses animated visuals (not just text)
- [ ] Each step is one action (tap to advance through steps)
- [ ] Tutorial takes under 1 minute to complete
- [ ] Tutorial is shown once on first session (can be re-accessed from menu)
- [ ] Tutorial doesn't block access to play (can exit anytime)

### Notes
- Reference: User Story 1 acceptance criteria (How-To/Tutorial)
- Jordan wants to understand odds/rules—separate from this casual tutorial
- Keep tutorial visual and interactive, not text-heavy
- New player experience is critical for retention

---

## USER STORY 15: Consistent Game Rules and Predictable Outcomes

**As a** strategic player like Jordan who values understanding and control
**I want** the game to follow consistent, documented rules
**So that** I can predict outcomes and develop strategies based on probability, not luck

### Acceptance Criteria
- [ ] Payout table is consistent across all sessions
- [ ] Odds/RTP are consistent and documented
- [ ] Spin outcomes are based on published probability (not manipulated)
- [ ] Rules never change without clear notification
- [ ] If rules change, all players are notified with explanation
- [ ] Seed/randomization method is consistent (no "hot" or "cold" streaks)
- [ ] Outcome calculation is transparent (how winning combos are determined)
- [ ] No hidden mechanics or surprise rule changes

### Notes
- Reference: Jordan's frustration with lack of transparency in how outcomes are determined
- Address concern from notes: "Slot Machines are false advertising"
- This directly opposes manipulative design (favors player fairness)

---