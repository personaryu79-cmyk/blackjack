export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

export type GamePhase = 'betting' | 'insuranceDecision' | 'playerTurn' | 'dealerTurn' | 'roundOver';
export type RoundResult = 'playerWin' | 'dealerWin' | 'push' | 'blackjack';

export interface GameState {
  readonly phase: GamePhase;
  readonly playerHands: readonly (readonly Card[])[];
  readonly wagers: readonly number[];
  readonly activeHandIndex: number;
  readonly stoodHands: readonly boolean[];
  readonly surrenderedHands: readonly boolean[];
  readonly doubledHands: readonly boolean[];
  readonly dealerHand: readonly Card[];
  /** Remaining cards in the current shuffled shoe. */
  readonly shoe: readonly Card[];
  /** Chips available for future bets; the active wager is deducted at deal time. */
  readonly bankroll: number;
  readonly bet: number;
  readonly insuranceBet: number;
  readonly result?: RoundResult;
  readonly message?: string;
}

export type RandomSource = () => number;

export interface GameOptions {
  readonly startingBankroll?: number;
  readonly minBet?: number;
}
