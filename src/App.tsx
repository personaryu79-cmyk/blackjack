import { Card } from './components/Card';
import { useBlackjack } from './hooks/useBlackjack';
import { scoreHand } from './game/score';

const money = (value: number) => `${value.toLocaleString('ko-KR')} chips`;

export default function App() {
  const { game, bet, setBet, error, deal, takeCard, hold, double, splitHand, giveUp, insure, skipInsurance, newRound } = useBlackjack();
  const playing = game.phase === 'playerTurn';
  const over = game.phase === 'roundOver';
  const dealerHidden = (playing || game.phase === 'insuranceDecision') && !over;
  const dealerScore = dealerHidden ? scoreHand(game.dealerHand.slice(0, 1)) : scoreHand(game.dealerHand);
  const playerHand = game.playerHands[game.activeHandIndex] ?? game.playerHands[0] ?? [];
  const canDouble = playing && playerHand.length === 2 && !game.doubledHands[game.activeHandIndex] && game.bankroll >= game.wagers[game.activeHandIndex];
  const canSplit = playing && game.playerHands.length === 1 && playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank && game.bankroll >= game.wagers[0];
  const canSurrender = playing && game.playerHands.length === 1 && playerHand.length === 2;

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Midnight Table home"><span className="brand-mark">♠</span><span>MIDNIGHT<span className="brand-light"> TABLE</span></span></a>
      <div className="table-meta"><span className="live-dot" /> PRIVATE TABLE <span className="meta-divider">/</span> CLASSIC BLACKJACK</div>
      <div className="wallet"><span className="wallet-label">YOUR BALANCE</span><strong>{money(game.bankroll)}</strong></div>
    </header>

    <section className="table-wrap" id="top">
      <div className={`table-felt ${playing ? 'is-live' : ''}`}>
        <div className="felt-grain" />
        <div className="table-edge" />
        <div className="table-content">
          <div className="round-indicator"><span>ROUND</span><b>{game.bet ? 'IN PLAY' : 'READY'}</b></div>
          <section className="hand-area dealer-area" aria-label="딜러 카드">
            <div className="hand-heading"><div><span className="eyebrow">HOUSE</span><h2>Dealer</h2></div><div className="score-pill"><span>SCORE</span><b>{game.dealerHand.length ? dealerHidden ? `${dealerScore} + ?` : dealerScore : '—'}</b></div></div>
            <div className="cards-row dealer-cards">
              {game.dealerHand.map((card, i) => <Card key={`dealer-${i}`} card={card} hidden={dealerHidden && i === 1} delay={i * 100} />)}
              {!game.dealerHand.length && <div className="empty-hand">Awaiting deal</div>}
            </div>
          </section>

          <div className="table-center">
            <span className="center-rule">BLACKJACK PAYS 3 TO 2 <i>✦</i> DEALER STANDS ON 17</span>
            {game.message ? <div aria-live="polite" className={`result-banner ${game.result === 'playerWin' || game.result === 'blackjack' ? 'win' : game.result === 'push' ? 'push' : 'loss'}`}><span>{game.result === 'blackjack' ? '✦ NATURAL BLACKJACK' : game.result === 'push' ? 'EVENLY MATCHED' : game.result === 'playerWin' ? 'WELL PLAYED' : 'HOUSE TAKES THIS ROUND'}</span><strong>{game.message}</strong></div> : <div className="table-emblem"><span>♠</span><small>EST. 21</small></div>}
          </div>

          <section className="hand-area player-area" aria-label="플레이어 카드">
            <div className={`player-hands count-${Math.max(1, game.playerHands.length)}`}>
              {game.playerHands.map((hand, handIndex) => <div className={`player-hand ${playing && game.activeHandIndex === handIndex ? 'active' : ''}`} key={`hand-${handIndex}`}>
                <div className="cards-row player-cards">{hand.map((card, i) => <Card key={`player-${handIndex}-${i}`} card={card} delay={i * 100} />)}</div>
                <div className="hand-heading player-heading"><div><span className="eyebrow">{game.playerHands.length > 1 ? `HAND ${handIndex + 1} · ${money(game.wagers[handIndex])}` : 'PLAYER'}</span>{game.playerHands.length === 1 && <h2>You</h2>}</div><div className="score-pill"><span>SCORE</span><b>{scoreHand(hand)}{game.surrenderedHands[handIndex] ? ' · SURRENDER' : ''}</b></div></div>
              </div>)}
              {!game.playerHands.length && <div className="cards-row player-cards"><div className="empty-hand">Your hand awaits</div></div>}
            </div>
          </section>
        </div>
      </div>
    </section>

    <section className="control-dock" aria-label="게임 조작">
      <div className="dock-info"><span className="eyebrow">CURRENT WAGER</span><strong>{money(playing || over ? game.wagers.reduce((sum, wager) => sum + wager, 0) : bet)}</strong><span className="dock-note">Minimum bet · 10 chips</span></div>
      <div className="dock-actions">
        {game.phase === 'betting' && <>
          <div className="bet-control"><label htmlFor="bet">BET</label><button aria-label="베팅 줄이기" onClick={() => setBet(Math.max(10, bet - 10))} disabled={bet <= 10}>−</button><input id="bet" type="number" min="10" step="10" max={game.bankroll} value={bet} onChange={(e) => setBet(Math.max(10, Number(e.target.value) || 10))} /><button aria-label="베팅 늘리기" onClick={() => setBet(Math.min(game.bankroll, bet + 10))} disabled={bet + 10 > game.bankroll}>+</button></div>
          <button className="button primary" onClick={deal} disabled={game.bankroll < 10}>Deal cards <span>↗</span></button>
        </>}
        {game.phase === 'insuranceDecision' && <><span className="insurance-offer">Dealer shows an Ace · Insure for {money(game.bet / 2)}?</span><button className="button secondary" onClick={skipInsurance}>No insurance</button><button className="button primary" onClick={insure} disabled={game.bet % 2 !== 0 || game.bankroll < game.bet / 2}>Take insurance</button></>}
        {playing && <>{canSurrender && <button className="button secondary" onClick={giveUp}>Surrender</button>}{canSplit && <button className="button secondary" onClick={splitHand}>Split</button>}{canDouble && <button className="button secondary" onClick={double}>Double</button>}<button className="button secondary" onClick={hold}>Stand <span>Ⅱ</span></button><button className="button primary" onClick={takeCard}>Hit <span>＋</span></button></>}
        {over && <button className="button primary" onClick={newRound}>Play another hand <span>↗</span></button>}
      </div>
    </section>
    <footer className="footer"><details className="install-help"><summary>iPhone 홈 화면에 추가</summary><div className="install-popover"><strong>앱처럼 실행하기</strong><p>Safari에서 공유 버튼을 누르고 <b>홈 화면에 추가</b>를 선택하세요. <b>웹 앱으로 열기</b>를 켜고 추가하면 전체 화면으로 실행됩니다.</p></div></details><span>♠ &nbsp; GOOD LUCK AT THE TABLE &nbsp; ♠</span><span>CLASSIC RULES · 3:2 PAYOUT</span></footer>
    {error && <div className="toast" role="alert">{error}</div>}
  </main>;
}
