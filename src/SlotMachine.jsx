import { useState } from 'react';
import HUD from './components/HUD';
import ReelSet from './components/ReelSet';
import SpinButton from './components/SpinButton';
import BetControls from './components/BetControls';
import WinOverlay from './components/WinOverlay';
import SettingsOverlay from './components/SettingsOverlay';
import SymbolInfoModal from './components/SymbolInfoModal';
import { useSlotMachineController } from './controller/useSlotMachineController';

function formatCredits(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function SlotMachine() {
  const [infoOpen, setInfoOpen] = useState(false);
  const {
    balance,
    betAmount,
    betOptions,
    netGain,
    winLog,
    biggestWin,
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

  const showWinImpact = machineState === 'result' && result?.isWin;

  return (
    <div
      className={`slot-machine state-${machineState} ${showWinImpact ? 'win-impact' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
    >
      <HUD balance={balance} betAmount={betAmount} netGain={netGain} machineState={machineState} />

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
        />
      </section>

      <p className="status-line" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <section className="showcase-row" aria-label="Win showcase">
        <article className={`showcase-card ${isNewBiggestWin ? 'celebrate' : ''}`}>
          <p className="showcase-label">Biggest Win</p>
          <p className="showcase-value">
            {biggestWin ? `+${formatCredits(biggestWin.payout)} VC` : 'No big wins yet'}
          </p>
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
