# Midnight Table Blackjack

A browser based, single player blackjack game built with React, TypeScript, and Vite. The game runs without a backend and can be installed as a Progressive Web App (PWA).

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run the Vitest game engine tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build` | Type check and create the production build in `dist/` |
| `npm run preview` | Serve the production build locally, including its generated service worker |

To check offline behavior, build and preview the app, open it once while online so the service worker can cache the app shell, then reload with the browser offline. The regular Vite development server does not exercise production service worker behavior.

## Game rules implemented

- Number cards are worth their rank, face cards are worth 10, and an Ace counts as 11 or 1 to avoid going over 21.
- A natural blackjack is an Ace and a ten-valued card in the first two cards. It pays 3:2. Main wagers must be even integer chip amounts so the blackjack payout and half-wager rules settle without fractional chips.
- The player may Hit or Stand. The dealer stands on every 17, including soft 17.
- Double Down is available on a two-card hand when the player has enough chips. The wager is doubled, exactly one card is dealt, and that hand stands.
- Split is available once per round for a pair of the same rank. Each hand receives one card and has its own wager. Split Aces receive one card each and stand automatically. Double Down is allowed on other split hands.
- When the dealer's visible card is an Ace, the player may buy Insurance for half the original wager. Insurance pays 2:1 when the dealer has blackjack.
- Late Surrender is available on the original two-card hand after an opening dealer blackjack check. Half the wager is returned.
- Chips are deducted when a wager is placed. A winning hand returns its wager plus an equal amount in winnings; a push returns the wager.
- The initial bankroll is 1,000 chips and the minimum main wager is 10 chips.

This is a learning project. Rule details such as resplitting, surrender variants, and casino-specific table limits are not implemented.

## Project structure

```text
src/
  game/          Pure TypeScript cards, scoring, rules, engine, and engine tests
  hooks/         React state adapter for the game engine
  components/    Reusable UI elements, including playing cards
  styles/        Table layout, responsive rules, and animations
  App.tsx        Blackjack table and controls
public/          PWA icon
```

The game engine does not depend on React. `startRound` accepts an ordered deck for deterministic scenarios, while Hit and dealer play draw from the remaining shuffled shoe.

## PWA

The production build generates a web app manifest and service worker with `vite-plugin-pwa`. The app shell and static build assets are precached. Google Fonts are cached at runtime when available; system font fallbacks keep the interface usable offline. The service worker updates automatically when a new production version is available.

### Install on iPhone

1. Open the live site in Safari: <https://personaryu79-cmyk.github.io/blackjack/>.
2. Tap **Share**, then **Add to Home Screen**.
3. Turn on **Open as Web App**, then tap **Add**. Launch the game from its new Home Screen icon for the standalone app view.

The page includes an iPhone Home Screen icon, standalone web app metadata, and safe-area spacing for the status bar and home indicator. These are the iOS-specific settings Apple documents for Home Screen web apps. See [Apple's iPhone instructions](https://support.apple.com/guide/iphone/iphea86e5236/ios) and [Safari web app configuration](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

The GitHub Actions workflow in `.github/workflows/deploy.yml` runs tests and deploys `dist/` to GitHub Pages on pushes to `main`. Vite uses relative asset paths so the app also works at a repository subpath URL. Once Pages deployment finishes, GitHub shows the live URL in the `github-pages` environment and in the deployment workflow summary.
