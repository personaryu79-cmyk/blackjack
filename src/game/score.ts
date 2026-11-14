import type { Card } from './types';

export function scoreHand(cards: readonly Card[]): number {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') {
      total += 11;
      aces += 1;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && scoreHand(cards) === 21;
}

export function isBust(cards: readonly Card[]): boolean {
  return scoreHand(cards) > 21;
}
