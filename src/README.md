# Slot Machine Web App

A complete, runnable React + Vite slot machine app using the provided `GameState` class.

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- main.jsx
|-- SlotMachine.jsx
|-- styles.css
|-- components/
|-- controller/
|-- animations/
|-- audio/
|-- state/
|   `-- GameState.js
`-- tests/
    `-- GameState.test.js
```

## Features

- Uses `GameState.spinWithPayout(betAmount)` for every spin.
- HUD shows `Balance`, `Bet`, and `Last Win`.
- State flow: `idle -> spinning -> result -> payout -> idle`.
- Mobile-first layout with large bottom spin button and animated vertical reels.
- Win feedback tiers (`small`, `medium`, `big`, `jackpot`) and distinct loss feedback.
- Bet adjustment with validation and insufficient-funds handling.

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Test

Run unit tests:

```bash
npm test
```

## Build

Create a production build:

```bash
npm run build
```
