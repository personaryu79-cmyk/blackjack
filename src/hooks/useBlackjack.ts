import { useCallback, useState } from 'react';
import { buyInsurance, createInitialState, declineInsurance, doubleDown, hit, split, stand, startRound, surrender } from '../game/blackjack';
import { MIN_BET } from '../game/rules';
import type { GameState } from '../game/types';

export function useBlackjack() {
  const [game, setGame] = useState<GameState>(() => createInitialState());
  const [bet, setBet] = useState(MIN_BET);
  const [error, setError] = useState('');
  const act = useCallback((action: () => GameState) => {
    try { setError(''); setGame(action()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '게임을 진행할 수 없습니다.'); }
  }, []);
  const deal = () => act(() => startRound(game, bet));
  const takeCard = () => act(() => hit(game));
  const hold = () => act(() => stand(game));
  const double = () => act(() => doubleDown(game));
  const splitHand = () => act(() => split(game));
  const giveUp = () => act(() => surrender(game));
  const insure = () => act(() => buyInsurance(game));
  const skipInsurance = () => act(() => declineInsurance(game));
  const newRound = () => {
    setError('');
    setGame((current) => ({ ...current, phase: 'betting', playerHands: [], wagers: [], activeHandIndex: 0, stoodHands: [], surrenderedHands: [], doubledHands: [], dealerHand: [], shoe: [], bet: 0, insuranceBet: 0, result: undefined, message: undefined }));
    setBet((current) => Math.min(current, game.bankroll));
  };
  return { game, bet, setBet, error, deal, takeCard, hold, double, splitHand, giveUp, insure, skipInsurance, newRound };
}
