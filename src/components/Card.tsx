import { useRef } from 'react';
import type { Card as PlayingCard } from '../game/types';

const symbols = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };

export function Card({ card, hidden = false, delay = 0 }: { card?: PlayingCard; hidden?: boolean; delay?: number }) {
  const wasHidden = useRef(hidden);
  const revealed = wasHidden.current && !hidden;
  wasHidden.current = hidden;
  if (hidden) return <div className="playing-card card-back" style={{ animationDelay: `${delay}ms` }} aria-label="숨겨진 카드"><span>♠</span></div>;
  if (!card) return null;
  const red = card.suit === 'hearts' || card.suit === 'diamonds';
  return <div className={`playing-card ${red ? 'red' : ''} ${revealed ? 'card-reveal' : ''}`} style={{ animationDelay: `${delay}ms` }} aria-label={`${card.suit} ${card.rank}`}>
    <span className="card-corner">{card.rank}<i>{symbols[card.suit]}</i></span>
    <span className="card-center">{symbols[card.suit]}</span>
    <span className="card-corner bottom">{card.rank}<i>{symbols[card.suit]}</i></span>
  </div>;
}
