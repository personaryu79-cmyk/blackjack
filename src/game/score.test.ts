import { describe, expect, it } from 'vitest';
import { isBlackjack, isBust, scoreHand } from './score';
import type { Card } from './types';

const c = (rank: Card['rank']): Card => ({ rank, suit: 'spades' });

describe('scoreHand', () => {
  it('scores numbered and face cards', () => expect(scoreHand([c('2'), c('10'), c('K')])).toBe(22));
  it('values aces at 11 when possible and lowers them to 1 to avoid bust', () => {
    expect(scoreHand([c('A'), c('7')])).toBe(18);
    expect(scoreHand([c('A'), c('9'), c('5')])).toBe(15);
    expect(scoreHand([c('A'), c('A'), c('9')])).toBe(21);
  });
  it('recognizes only two-card blackjack and bust', () => {
    expect(isBlackjack([c('A'), c('K')])).toBe(true);
    expect(isBlackjack([c('7'), c('7'), c('7')])).toBe(false);
    expect(isBust([c('K'), c('8'), c('5')])).toBe(true);
  });
});
