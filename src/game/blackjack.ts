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
  const stoodHands = setAt(state.stoodHands, state.activeHandIndex, true);
  return advanceHand({ ...state, stoodHands }, dealerDraw);
}

export function doubleDown(state: GameState, card?: Card): GameState {
  assertPlayerTurn(state);
  const i = state.activeHandIndex;
  const hand = state.playerHands[i];
  if (hand.length !== 2 || state.doubledHands[i] || state.stoodHands[i]) throw new Error('Double Down is only available on the first two cards.');
  const extra = state.wagers[i];
  if (state.bankroll < extra) throw new Error('Insufficient chips to double this wager.');
  const hands = state.playerHands.map((cards) => [...cards]);
  const shoe = [...state.shoe];
  hands[i].push(card ?? drawCard(shoe));
  const next = { ...state, playerHands: hands, shoe, bankroll: state.bankroll - extra, wagers: setAt(state.wagers, i, extra * 2), doubledHands: setAt(state.doubledHands, i, true), stoodHands: setAt(state.stoodHands, i, true) };
  return advanceHand(next);
}

export function split(state: GameState): GameState {
  assertPlayerTurn(state);
  const i = state.activeHandIndex;
  const hand = state.playerHands[i];
  if (state.playerHands.length !== 1 || hand.length !== 2 || hand[0].rank !== hand[1].rank) throw new Error('Split requires a matching pair and is allowed once per round.');
  if (state.bankroll < state.wagers[i]) throw new Error('Insufficient chips to split this hand.');
  const shoe = [...state.shoe];
  const left = [hand[0], drawCard(shoe)];
  const right = [hand[1], drawCard(shoe)];
  const aces = hand[0].rank === 'A';
  const next = { ...state, playerHands: [left, right], wagers: [state.wagers[0], state.wagers[0]], stoodHands: [aces, aces], surrenderedHands: [false, false], doubledHands: [false, false], activeHandIndex: 0, shoe, bankroll: state.bankroll - state.wagers[0] };
  return aces ? advanceHand(next) : next;
}

export function surrender(state: GameState): GameState {
  assertPlayerTurn(state);
  const i = state.activeHandIndex;
  if (state.playerHands.length !== 1 || state.playerHands[i].length !== 2 || state.doubledHands[i]) throw new Error('Late surrender is only available on the original two-card hand.');
  const returned = state.wagers[i] / 2;
  if (!Number.isSafeInteger(returned)) throw new Error('Surrender requires an even-numbered wager.');
  return finish({ ...state, surrenderedHands: setAt(state.surrenderedHands, i, true), stoodHands: setAt(state.stoodHands, i, true) }, 'dealerWin', state.bankroll + returned, 'You surrendered. Half your bet is returned.');
}

export function resolveRound(state: GameState): GameState {
  const dealerScore = scoreHand(state.dealerHand);
  let bankroll = state.bankroll;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  state.playerHands.forEach((hand, i) => {
    const wager = state.wagers[i];
    if (state.surrenderedHands[i]) { bankroll += wager / 2; losses += 1; return; }
    if (isBust(hand)) { losses += 1; return; }
    if (isBust(state.dealerHand) || scoreHand(hand) > dealerScore) { bankroll += wager * 2; wins += 1; return; }
    if (scoreHand(hand) === dealerScore) { bankroll += wager; pushes += 1; return; }
    losses += 1;
  });
  const result: RoundResult = wins && !losses && !pushes ? 'playerWin' : losses && !wins && !pushes ? 'dealerWin' : wins || losses ? 'push' : 'push';
  const message = state.playerHands.length > 1 ? `Split hands settled: ${wins} won, ${losses} lost, ${pushes} pushed.` : isBust(state.playerHands[0]) ? 'Player busts.' : result === 'playerWin' ? (isBust(state.dealerHand) ? 'Dealer busts. You win.' : 'You win.') : result === 'dealerWin' ? 'Dealer wins.' : 'Push.';
  return finish(state, result, bankroll, message);
}

function advanceHand(state: GameState, dealerDraw?: () => Card): GameState {
  if (state.stoodHands.some((stood) => !stood)) {
    const nextIndex = state.stoodHands.findIndex((stood, i) => !stood && i > state.activeHandIndex);
    return { ...state, activeHandIndex: nextIndex >= 0 ? nextIndex : state.stoodHands.findIndex((stood) => !stood) };
  }
  const dealerHand = [...state.dealerHand];
  const shoe = [...state.shoe];
  if (state.playerHands.some((hand, i) => !isBust(hand) && !state.surrenderedHands[i])) {
    while (scoreHand(dealerHand) < DEALER_STANDS_ON) dealerHand.push(dealerDraw ? dealerDraw() : drawCard(shoe));
  }
  return resolveRound({ ...state, phase: 'dealerTurn', dealerHand, shoe });
}

function setAt<T>(items: readonly T[], index: number, value: T): T[] {
  return items.map((item, i) => i === index ? value : item);
}

function finish(state: GameState, result: RoundResult, bankroll: number, message: string): GameState {
  return { ...state, phase: 'roundOver', result, bankroll, message };
}

function assertPlayerTurn(state: GameState): void {
  if (state.phase !== 'playerTurn') throw new Error('Player action is not allowed in the current phase.');
}
