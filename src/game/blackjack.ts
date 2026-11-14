import { createDeck, drawCard, shuffleDeck } from './cards';
import { BLACKJACK_DENOMINATOR, BLACKJACK_NUMERATOR, DEALER_STANDS_ON, MIN_BET, STARTING_BANKROLL } from './rules';
import { isBlackjack, isBust, scoreHand } from './score';
import type { Card, GameOptions, GameState, RandomSource, RoundResult } from './types';

export function createInitialState(options: GameOptions = {}): GameState {
  const bankroll = options.startingBankroll ?? STARTING_BANKROLL;
  if (!Number.isSafeInteger(bankroll) || bankroll < 0) throw new Error('Starting bankroll must be a non-negative integer.');
  return { phase: 'betting', playerHands: [], wagers: [], activeHandIndex: 0, stoodHands: [], surrenderedHands: [], doubledHands: [], dealerHand: [], shoe: [], bankroll, bet: 0, insuranceBet: 0 };
}

export function startRound(state: GameState, bet: number, random: RandomSource = Math.random, options: GameOptions = {}, orderedDeck?: readonly Card[]): GameState {
  if (state.phase !== 'betting' && state.phase !== 'roundOver') throw new Error('A round is already in progress.');
  const minBet = options.minBet ?? MIN_BET;
  if (!Number.isSafeInteger(bet) || bet < minBet) throw new Error(`Bet must be an integer of at least ${minBet}.`);
  if (bet % 2 !== 0) throw new Error('Bet must be an even number of chips for half-bet rules and blackjack payouts.');
  if (bet > state.bankroll) throw new Error('Insufficient chips for this bet.');
  const shoe = orderedDeck ? [...orderedDeck] : shuffleDeck(createDeck(), random);
  const playerHand = [drawCard(shoe), drawCard(shoe)];
  const dealerHand = [drawCard(shoe), drawCard(shoe)];
  const next: GameState = { ...state, phase: 'playerTurn', playerHands: [playerHand], wagers: [bet], activeHandIndex: 0, stoodHands: [false], surrenderedHands: [false], doubledHands: [false], dealerHand, shoe, bankroll: state.bankroll - bet, bet, insuranceBet: 0, result: undefined, message: undefined };
  if (dealerHand[0].rank === 'A' && !isBlackjack(playerHand)) return { ...next, phase: 'insuranceDecision' };
  return settleOpening(next);
}

export function buyInsurance(state: GameState): GameState {
  if (state.phase !== 'insuranceDecision') throw new Error('Insurance is not available now.');
  const amount = state.bet / 2;
  if (!Number.isSafeInteger(amount)) throw new Error('Insurance requires an even-numbered main bet.');
  if (state.bankroll < amount) throw new Error('Insufficient chips for insurance.');
  return settleOpening({ ...state, bankroll: state.bankroll - amount, insuranceBet: amount });
}

export function declineInsurance(state: GameState): GameState {
  if (state.phase !== 'insuranceDecision') throw new Error('Insurance is not available now.');
  return settleOpening(state);
}

function settleOpening(state: GameState): GameState {
  if (isBlackjack(state.dealerHand)) {
    if (isBlackjack(state.playerHands[0])) return finish(state, 'push', state.bankroll + state.bet + state.insuranceBet * 3, 'Both hands have blackjack. Push.');
    return finish(state, 'dealerWin', state.bankroll + state.insuranceBet * 3, state.insuranceBet ? 'Dealer has blackjack. Insurance pays 2:1.' : 'Dealer has blackjack.');
  }
  if (isBlackjack(state.playerHands[0])) {
    const profit = state.bet * BLACKJACK_NUMERATOR / BLACKJACK_DENOMINATOR;
    if (!Number.isSafeInteger(profit)) throw new Error('Blackjack payout requires a bet divisible by 2 chips.');
    return finish(state, 'blackjack', state.bankroll + state.bet + profit, 'Blackjack! Paid 3:2.');
  }
  return { ...state, phase: 'playerTurn' };
}

export function hit(state: GameState, card?: Card): GameState {
  assertPlayerTurn(state);
  const i = state.activeHandIndex;
  const hands = state.playerHands.map((hand) => [...hand]);
  const shoe = [...state.shoe];
  hands[i].push(card ?? drawCard(shoe));
  const next = { ...state, playerHands: hands, shoe };
  if (isBust(hands[i])) return advanceHand({ ...next, stoodHands: setAt(state.stoodHands, i, true) });
  return next;
}

export function stand(state: GameState, dealerDraw?: () => Card): GameState {
  assertPlayerTurn(state);
  co