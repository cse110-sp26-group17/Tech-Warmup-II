import { useState } from 'react';
import HUD from './components/hud/HUD';
import ReelSet from './components/reels/ReelSet';
import SpinButton from './components/controls/SpinButton';
import BetControls from './components/controls/BetControls';
import WinOverlay from './components/overlays/WinOverlay';
import SettingsOverlay from './components/overlays/SettingsOverlay';
import SymbolInfoModal from './components/overlays/SymbolInfoModal';
import StreakCounter from './components/indicators/StreakCounter';
import LuckMeter from './components/indicators/LuckMeter';
import RecentSpins from './components/indicators/RecentSpins';
import WinsTicker from './components/feed/WinsTicker';
import { useSlotMachineController } from './hooks/useSlotMachineController';
import { formatCredits } from './utils/formatCredits';
import { formatRelativeTime } from './utils/formatRelativeTime';

export default function SlotMachine() {
  const [infoOpen, setInfoOpen] = useState(false);
  const {
    balance,
    displayedBalance,
    isBalanceCounting,
    betAmount,
    betOptions,
    winLog,
    biggestWin,
    topWins,
    meta,
    milestonePopup,
    isNewBiggestWin,
    resultMessage,
    displayedWin,
    machineState,
    result,
    winTier,
    statusMessage,
    controlsLocked,
    reelSymbols,
    spinToken,
    nearMissHint,
    soundEnabled,
    turboMode,
    autoSpin,
    settingsOpen,
    reducedMotion,
    spinProfile,
    symbolPayouts,
    recentResults,
    dailyGrantAmount,
    dailyGrantReady,
    freeRolls,
    spin,
    resetGame,
    claimDailyGrant,
    selectBet,
    onReelStop,
    setTurboMode,
    setAutoSpin,
    stopAutoSpin,
    setSettingsOpen,
    setSoundEnabled,
    setReducedMotion,
  } = useSlotMachineController();

  const showWinImpact =
    (machineState === 'result' || machineState === 'payout') && result?.isWin;

  return (
    <div
      className={`slot-machine state-${machineState} impact-${winTier} ${meta.comboMultiplier > 1 ? 'combo-active' : ''} ${showWinImpact ? 'win-impact' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
    >
      <WinsTicker />
      <HUD
        displayedBalance={displayedBalance}
        isBalanceCounting={isBalanceCounting}
        betAmount={betAmount}
        lastWinAmount={displayedWin}
        comboMultiplier={meta.comboMultiplier}
        freeRolls={freeRolls}
      />

      <section className="reel-stage">
        <button
          type="button"
          className="info-icon-button"
          aria-label="Open symbol info"
          onClick={() => setInfoOpen(true)}
        >
          i
        </button>

        <StreakCounter
          winStreak={meta.currentWinStreak}
          comboMultiplier={meta.comboMultiplier}
          variant="in-stage"
        />

        <ReelSet
          reelSymbols={reelSymbols}
          spinToken={spinToken}
          machineState={machineState}
          spinProfile={spinProfile}
          reducedMotion={reducedMotion}
          nearMissHint={nearMissHint}
          onReelStop={onReelStop}
        />

        <WinOverlay
          machineState={machineState}
          winTier={winTier}
          result={result}
          resultMessage={resultMessage}
          isNewBiggestWin={isNewBiggestWin}
          displayedWin={displayedWin}
          reducedMotion={reducedMotion}
          milestonePopup={milestonePopup}
          winStreak={meta.currentWinStreak}
          comboMultiplier={meta.comboMultiplier}
        />
      </section>

      <p className="status-line" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <section className={`insight-row ${freeRolls > 0 ? 'free-roll-ready' : ''}`} aria-label="Spin insights">
        <LuckMeter lossStreak={meta.currentLossStreak} />
        <RecentSpins recentResults={recentResults} />
      </section>

      <section className="action-zone" aria-label="Primary actions">
        <BetControls
          betOptions={betOptions}
          betAmount={betAmount}
          disabled={controlsLocked}
          balance={balance}
          onSelectBet={selectBet}
        />

        <SpinButton
          machineState={machineState}
          disabled={controlsLocked}
          onSpin={spin}
          turboMode={turboMode}
          onToggleTurbo={setTurboMode}
          autoSpin={autoSpin}
          onToggleAutoSpin={setAutoSpin}
          onStopAutoSpin={stopAutoSpin}
          lossStreak={meta.currentLossStreak}
        />
      </section>

      <details className="stats-drawer">
        <summary>Stats &amp; History</summary>

        <section className="stats-drawer-body" aria-label="Win showcase and performance">
          <div className="quick-stats" role="status" aria-live="polite">
            <p className="quick-stat">Spins: {formatCredits(meta.totalSpins)}</p>
            <p className={`quick-stat ${meta.currentWinStreak >= 3 ? 'hot-streak' : ''}`}>
              Streak: {meta.currentWinStreak > 0 ? `W ${meta.currentWinStreak}` : `L ${meta.currentLossStreak}`}
            </p>
            <p className="quick-stat">Next Bonus: {meta.nextMilestoneIn}</p>
            <p className="quick-stat jackpot">
              Jackpot: {formatCredits(meta.progressiveJackpotPool, { maximumFractionDigits: 2 })} VC
            </p>
            <p className={`temp-pill tone-${meta.machineTemperature.tone}`}>{meta.machineTemperature.label}</p>
          </div>

          <div className="showcase-row">
            <article className={`showcase-card hall-of-fame ${isNewBiggestWin ? 'celebrate' : ''}`}>
              <p className="showcase-hall-title">Hall of Fame</p>
              <p className="showcase-label">Biggest Win Ever</p>
              <p className="showcase-value">
                {biggestWin ? `+${formatCredits(biggestWin.payout)} VC` : 'No big wins yet'}
              </p>
              {topWins.length > 0 ? (
                <div className="hall-of-fame-list">
                  {topWins.map((entry, index) => (
                    <p key={`${entry.timestamp}-${index}`} className="hall-of-fame-item">
                      #{index + 1} +{formatCredits(entry.payout)} VC{' '}
                      {typeof entry.symbolName === 'string' ? entry.symbolName.toUpperCase() : 'WIN'} ·{' '}
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                  ))}
                </div>
              ) : null}
              {isNewBiggestWin ? (
                <div className="hall-fireworks" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
            </article>

            <article className="showcase-card win-log">
              <p className="showcase-label">Win Log (Gains Only)</p>
              <div className="win-log-list" aria-live="polite">
                {winLog.length === 0 ? (
                  <p className="win-log-empty">No wins yet. Spin to start a streak.</p>
                ) : (
                  winLog.slice(0, 6).map((entry, index) => (
                    <p key={`${entry.timestamp}-${index}`} className="win-log-item">
                      +{formatCredits(entry.payout)} VC x{entry.multiplier}
                    </p>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      </details>

      <section className="action-row" aria-label="Game actions">
        <button
          type="button"
          className={`action-button daily-grant ${dailyGrantReady ? 'ready' : 'claimed'}`}
          disabled={!dailyGrantReady}
          onClick={claimDailyGrant}
        >
          {dailyGrantReady ? `Daily VC Grant +${dailyGrantAmount}` : 'Daily Grant Claimed'}
        </button>
        {balance === 0 ? (
          <button type="button" className="action-button reset" onClick={resetGame}>
            Reset Game
          </button>
        ) : null}
      </section>

      <SymbolInfoModal
        open={infoOpen}
        betAmount={betAmount}
        symbolPayouts={symbolPayouts}
        onClose={() => setInfoOpen(false)}
      />

      <SettingsOverlay
        open={settingsOpen}
        soundEnabled={soundEnabled}
        reducedMotion={reducedMotion}
        onToggleOpen={setSettingsOpen}
        onToggleSound={setSoundEnabled}
        onToggleReducedMotion={setReducedMotion}
      />
    </div>
  );
}
