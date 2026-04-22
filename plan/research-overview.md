# Research overview

This document summarizes the research collected under `plan/raw-research/`, organized by the three strands used in this project: **domain research** (how slot systems work), **user research** (who plays and what they need), and **UX research** (how successful apps look and behave). 

## Domain research

**Systems architecture and implementation (`domain-research/domain-research.md`)**  
Covers the separation of game logic from presentation: deterministic outcomes via RNG, reel models (independent vs. strip-based), configurable paylines, modular paytables, betting and balance flow, a clear idle → spin → result → payout state machine, edge-case handling, and testing hooks. It also notes UX engagement patterns (near-miss, fast feedback) and explicit guidance for modular code and AI-assisted prompting so implementations stay maintainable.

**Core mechanics and economics (`domain-research/domain-research2.md`)**  
Explains reels, symbols, continuous RNG, virtual reel mapping, independence of spins, result-first animation, paylines and payout tables, bet levels, RTP, volatility, and house edge in plain language. It also catalogs special symbols and features (wilds, scatters, multipliers, free spins, cascades, near-miss) and common app affordances such as auto-spin and balance display.

**Features and player psychology (`domain-research/domain-research-functions.md`)**  
Defines relevant terminology (illusion of control, gambler’s fallacy, progression effect) and ties product features (stopping devices, win pacing, daily rewards, synchronized reels, leaderboards, leveling, bonus triggers) to retention and perceived skill. It closes with psychological risks such as prolonged play driven by control illusions and near-miss dopamine effects.

## User research

**Persona: Jordan Kim (`user-research/persona1.md`)**  
Represents a strategic, data-minded player who wants adjustable risk, transparent rules, history and statistics, and a sense of progression. Frustrations center on opaque odds and lack of control surfaces.

**Persona: Ryan Higa (`user-research/persona2.md`)**  
Represents a casual, mobile-first player who wants minimal cognitive load, one obvious spin action, fast and polished feedback, and short sessions. Frustrations center on clutter, slow loops, and unclear outcomes.

**User stories (`user-research/user-stories.md`)**  
Maps fifteen detailed user stories to both personas (and shared needs), with acceptance criteria covering bet control, stats, odds transparency, feedback, single-button spin, errors, balance, sharing, responsive UI, tutorial, and consistent rules. It also ranks design priorities (speed, transparency, polish, mobile, analytics, simplicity) to guide sequencing.

## UX research

**Slot app patterns and build-ready requirements (`ux-research/ux-research1.md`)**  
Synthesizes visual language (color, typography, symbols), the fast spin cycle and primary controls, tiered audio and visual win feedback, HUD and navigation patterns, psychological patterns used in the genre, mobile layout and haptics, thematic cohesion, a recommended end-to-end flow, accessibility expectations, and explicit must/should/nice-to-have UX requirements plus prompting constraints for consistent, state-aware UI implementation.

## Team roster 
1. Jorell Jusay - User Stories 1, 3, 4
2. 

