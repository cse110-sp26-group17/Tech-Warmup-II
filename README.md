# Tech-Warmup-II

Slot machine project for CSE 110 Tech Warmup II.

## Repository layout

- `src/` - React + Vite slot machine application (main runnable app)
- `plan/` - research notes and AI prompt logs
- `tests/` - legacy top-level test folder (current app tests are under `src/tests/`)
- `final-report/` - final writeup and submission artifacts

## Run the app

The app is located in `src/`, so run commands from that directory:

```bash
cd src
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

## Test

```bash
cd src
npm test
```

Current test suite uses Vitest and includes:

- `src/tests/GameState.test.js`
- `src/tests/ControllerFlow.test.js`

## Build and preview

```bash
cd src
npm run build
npm run preview
```

## Notes

- Main entry point: `src/main.jsx`
- Root component: `src/SlotMachine.jsx`
- Core game logic: `src/state/GameState.js`
- Detailed app-specific notes are in `src/README.md`