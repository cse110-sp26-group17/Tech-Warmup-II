import { useState } from 'react';
import HUD from './components/HUD';
import ReelSet from './components/ReelSet';
import SpinButton from './components/SpinButton';
import BetControls from './components/BetControls';
import WinOverlay from './components/WinOverlay';
import SettingsOverlay from './components/SettingsOverlay';
import SymbolInfoModal from './components/SymbolInfoModal';
import { useSlotMachineController } from './controller/useSlotMachineController';

export default function SlotMachine() {
  const [infoOpen, setInfoOpen] = useState(false);
  const {
    balance,
    betAmount,
    betOptions,
    netGain,
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
    spin,
    resetGame,
    selectBet,
    onReelStop,
    setTurboMode,
    setAutoSpin,
    stopAutoSpin,
    setSettingsOpen,
    setSoundEnabled,
    setReducedMotion,
  } = useSlotMachineController();

  return (
    <div className={`slot-machine state-${machineState} ${reducedMotion ? 'reduced-motion' : ''}`}>
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
          displayedWin={displayedWin}
          reducedMotion={reducedMotion}
        />
      </section>

      <p className="status-line" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <section className="action-row" aria-label="Game actions">
        <button type="button" className="action-button" onClick={() => setInfoOpen(true)}>
          Info
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
