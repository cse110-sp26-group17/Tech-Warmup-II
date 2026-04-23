import { useState } from 'react';
import HUD from './components/HUD';
import ReelSet from './components/ReelSet';
import SpinButton from './components/SpinButton';
import BetControls from './components/BetControls';
import WinOverlay from './components/WinOverlay';
import SettingsOverlay from './components/SettingsOverlay';
import SymbolInfoModal from './components/SymbolInfoModal';
import StreakCounter from './components/StreakCounter';
import WinsTicker from './components/WinsTicker';
import { useSlotMachineController } from './controller/useSlotMachineController';
import { formatCredits } from './utils/formatCredits';

function formatRelativeTime(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return 'just now';
  }

  const elapsedMs = timestamp - Date.now();
  const elapsedMinutes = Math.round(elapsedMs / 60000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(elapsedMinutes) < 60) {
    return formatter.format(elapsedMinutes, 'minute');
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) {
    return formatter.format(elapsedHours, 'hour');
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return formatter.format(elapsedDays, 'day');
}

export default function SlotMachine() {
  const [infoOpen, setInfoOpen] = useState(false);
  const {
    balance,
    displayedBalance,
    isBalanceCounting,
    betAmount,
    betOptions,
    netGain,
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
    dailyGrantAmount,
    dailyGrantReady,
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
        netGain={netGain}
        meta={meta}
      />

      <StreakCounter winStreak={meta.currentWinStreak} comboMultiplier={meta.comboMultiplier} />

      <section className="reel-stage">
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

      <section className="showcase-row" aria-label="Win showcase">
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
      </section>

      <section className="action-row" aria-label="Game actions">
        <button type="button" className="action-button" onClick={() => setInfoOpen(true)}>
          Info
        </button>
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

      <BetControls
        betOptions={betOptions}
        betAmount={betAmount}
        disabled={controlsLocked}
        balance={balance}
        onSelectBet={selectBet}
      />

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
