import type { Card, Rank, RandomSource, Suit } from './types';

export const SUITS: readonly Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
export const RANKS: readonly Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

export function shuffleDeck(deck: readonly Card[], random: RandomSource = Math.random): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawCard(deck: Card[]): Card {
  const card = deck.pop();
  if (!card) throw new Error('Cannot draw from an empty deck.');
  return card;
}
