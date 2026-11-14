import { describe, expect, it } from 'vitest';
import { buyInsurance, createInitialState, declineInsurance, doubleDown, hit, resolveRound, split, stand, startRound, surrender } from './blackjack';
import type { Card, GameState } from './types';

const c = (rank: Card['rank']): Card => ({ rank, suit: 'hearts' });
const state = (player: Card[], dealer: Card[], bet = 10): GameState => ({
  phase: 'playerTurn', playerHands: [player], wagers: [bet], activeHandIndex: 0, stoodHands: [false], surrenderedHands: [false], doubledHands: [false], dealerHand: dealer, shoe: [], bankroll: 990, bet, insuranceBet: 0,
});

describe('blackjack engine', () => {
  it('prevents invalid bets and actions in the wrong phase', () => {
    const initial = createInitialState({ startingBankroll: 100 });
    expect(() => startRound(initial, 0)).toThrow();
    expect(() => startRound(initial, 11)).toThrow();
    expect(() => startRound(initial, 110)).toThrow();
    expect(() => hit(initial, c('2'))).toThrow();
  });

  it('settles a player blackjack at 3:2', () => {
    const initial = createInitialState({ startingBankroll: 100 });
    // Ordered deck is supplied bottom-first, matching pop() draw order.
    const result = startRound(initial, 10, Math.random, { minBet: 1 }, [c('2'), c('7'), c('K'), c('A')]);
    expect(result.result).toBe('blackjack');
    expect(result.bankroll).toBe(115);
  });

  it('loses immediately when the player busts', () => {
    const result = hit(state([c('K'), c('8')], [c('6'), c('10')]), c('5'));
    expect(result.result).toBe('dealerWin');
    expect(result.bankroll).toBe(990);
  });

  it('pays wins, returns pushes, and retains losing wagers', () => {
    expect(resolveRound(state([c('10'), c('9')], [c('10'), c('8')])).bankroll).toBe(1010);
    expect(resolveRound(state([c('10'), c('8')], [c('10'), c('8')])).bankroll).toBe(1000);
    expect(resolveRound(state([c('10'), c('7')], [c('10'), c('9')])).bankroll).toBe(990);
    expect(resolveRound(state([c('10'), c('9')], [c('K'), c('Q'), c('5')])).result).toBe('playerWin');
  });

  it('draws for the dealer below 17 and stands at 17 or higher', () => {
    let draws = 0;
    const result = stand(state([c('10'), c('8')], [c('10'), c('6')]), () => {
      draws += 1;
      return c('2');
    });
    expect(draws).toBe(1);
    expect(result.dealerHand).toHaveLength(3);
  });

  it('doubles the wager, takes exactly one card, and ends that hand', () => {
    const result = doubleDown({ ...state([c('10'), c('7')], [c('10'), c('6')]), shoe: [c('2')] }, c('4'));
    expect(result.wagers).toEqual([20]);
    expect(result.playerHands[0]).toHaveLength(3);
    expect(result.doubledHands[0]).toBe(true);
    expect(result.phase).toBe('roundOver');
  });

  it('splits matching pairs into two separately wagered hands', () => {
    const result = split({ ...state([c('8'), c('8')], [c('10'), c('6')]), shoe: [c('2'), c('3'), c('2')] });
    expect(result.playerHands).toHaveLength(2);
    expect(result.wagers).toEqual([10, 10]);
    expect(result.bankroll).toBe(980);
    const next = stand(result);
    expect(next.activeHandIndex).toBe(1);
  });

  it('offers insurance against an ace and pays it when dealer has blackjack', () => {
    const initial = createInitialState({ startingBankroll: 100 });
    const dealt = startRound(initial, 10, Math.random, { minBet: 1 }, [c('2'), c('K'), c('A'), c('9'), c('10')]);
    expect(dealt.phase).toBe('insuranceDecision');
    const result = buyInsurance(dealt);
    expect(result.result).toBe('dealerWin');
    expect(result.bankroll).toBe(100);
  });

  it('allows declining insurance and returning half the wager on late surrender', () => {
    const initial = createInitialState({ startingBankroll: 100 });
    const offered = startRound(initial, 10, Math.random, { minBet: 1 }, [c('2'), c('K'), c('A'), c('9'), c('10')]);
    expect(declineInsurance(offered).phase).toBe('roundOver');
    expect(surrender(state([c('10'), c('8')], [c('K'), c('9')])).bankroll).toBe(995);
  });
});
