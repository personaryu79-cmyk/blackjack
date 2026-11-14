# Project guide

## Design boundaries

- Keep cards, scoring, rules, state transitions, and settlement in `src/game/`. These modules must remain independent of React and browser UI concerns.
- Keep React state integration in `src/hooks/` and rendering in `src/components/` or `src/App.tsx`.
- Avoid adding dependencies unless the current stack cannot reasonably support the feature.
- Keep the documented game behavior in `README.md` aligned with `src/game/` and the UI.

## Game engine conventions

- Keep actions immutable: return a new `GameState` and do not mutate cards or arrays held by the input state.
- Validate the phase and action preconditions in the engine, even if the UI hides unavailable controls.
- Use the existing shoe for every draw in a round so cards cannot reappear before the shoe is exhausted.
- Keep random behavior controllable in tests by injecting an ordered deck, a card, or a dealer draw function where appropriate.
- Keep payout calculations in integer chips. Update `rules.ts` and the tests when changing payout or wager rules.
- Keep optional blackjack rules explicit and isolated in named actions; do not silently change basic Hit, Stand, or settlement behavior.

## UI and accessibility

- Preserve responsive behavior for narrow mobile screens as well as desktop layouts.
- Respect `prefers-reduced-motion` for new animations.
- Keep controls operable with keyboard focus and give icon-only controls accessible labels.
- Do not expose the dealer's hidden card or total before the round ends.

## Verification

- Run `npm test` after game engine or UI behavior changes.
- Run `npm run build` before considering a change complete; it includes TypeScript checking.
- Verify PWA behavior with `npm run build` followed by `npm run preview`. The development server alone does not validate the production service worker.
- Add focused Vitest cases for new game rules, invalid actions, scoring, and chip settlement.
