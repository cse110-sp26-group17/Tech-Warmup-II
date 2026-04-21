 Domain Research – Slot Machine Systems 

1. Core System Model

A slot machine is not animation-driven. It is a deterministic system where outcomes are decided instantly using randomness, and animation is only visual feedback.

Core components:
- Reel Model: determines symbol positions
- RNG Engine: generates outcomes
- Payline Evaluator: checks for wins
- Payout System: updates balance
- State Machine: controls game flow

---

2. RNG (Random Number Generator)

The outcome of a spin is determined before any animation occurs.

Simple RNG
Uses uniform randomness:
- Each symbol has equal probability
- Easy to implement but unrealistic

Example:
- Randomly select a symbol from a list

Weighted RNG
Uses different probabilities for each symbol:
- Common symbols appear more often
- Rare symbols (e.g., jackpot) appear less often

Benefits:
- Creates realistic gameplay
- Allows control over win frequency

Key Insight:
If randomness is not explicitly defined, AI tends to default to uniform randomness.

---

3. Reel System Design

Model A: Independent Random Reels
- Each reel independently selects symbols
- Simpler to implement
- Less realistic

Model B: Reel Strips
- Each reel has a fixed sequence of symbols
- RNG selects a position on the strip

Benefits:
- Better probability control
- More realistic behavior

---

4. Paylines System

A payline is a predefined path across reels used to determine winning combinations.

Types of paylines:
- Horizontal
- Diagonal
- Zig-zag
- Multiple line systems

Example structure:
- Each payline defines which row to check per reel

Key Insight:
Paylines should be configurable rather than hardcoded.

---

5. Paytable (Game Balance System)

The paytable defines:
- Symbol values
- Winning combinations
- Payout multipliers

Example logic:
- Matching symbols across a payline yields a payout
- Different symbols have different values

Importance:
- Controls difficulty and reward frequency
- Directly affects player experience

---

6. Game State Machine

A state machine controls the flow of the game.

Typical states:
- idle
- spinning
- result
- payout

State flow:
idle → spinning → result → payout → idle

Benefits:
- Prevents invalid actions (e.g., spinning twice)
- Makes UI predictable
- Simplifies debugging and testing

---

7. Betting & Economy System

Core variables:
- Player balance
- Bet amount
- Payout multiplier

Flow:
1. Player places bet
2. Balance decreases
3. Spin occurs
4. Win is calculated
5. Balance is updated

Edge cases:
- Bet exceeds balance
- Balance reaches zero
- Extremely large payouts

---

8. UX & Psychological Design

Key engagement features:

Positive Reinforcement:
- Win animations
- Sound effects
- Visual feedback

Near-Miss Effect:
- Almost winning increases engagement

Fast Feedback Loop:
- Quick spins and results

Engineering Implication:
Game logic should be separated from animation.

---

9. Error Handling & Edge Cases

Examples:
- Invalid bet input
- Rapid button clicking
- UI out of sync with game state
- Unexpected RNG behavior

Importance:
Handling these improves robustness and reliability.

---

10. Testing Considerations

Unit Tests:
- RNG output range
- Payline evaluation correctness
- Payout calculation

Edge Case Tests:
- No win scenarios
- Maximum payout
- Multiple winning paylines

---

Key Insights for Implementation

- RNG determines outcomes instantly; animation is separate
- Weighted randomness is needed for realistic gameplay
- Paylines should be configurable, not hardcoded
- A state machine is critical for clean architecture
- Paytable defines game balance and should be modular
- UX features (animations, sound) improve engagement
- Edge cases must be handled explicitly

---

 How This Impacts AI Prompting

- Must explicitly request modular architecture
- Must include:
  - RNG module
  - Reel system
  - Payline evaluator
  - Paytable configuration
- Must avoid:
  - Hardcoded logic
  - Large monolithic functions
- Must enforce:
  - State-based flow
  - Separation of concerns
