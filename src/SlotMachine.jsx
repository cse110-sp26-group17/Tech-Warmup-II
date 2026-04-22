import HUD from './components/HUD';
import ReelSet from './components/ReelSet';
import SpinButton from './components/SpinButton';
import BetControls from './components/BetControls';
import WinOverlay from './components/WinOverlay';
import SettingsOverlay from './components/SettingsOverlay';
import { useSlotMachineController } from './controller/useSlotMachineController';

export default function SlotMachine() {
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
    spin,
    selectBet,
    onReelStop,
    setTurboMode,
    setAutoSpin,
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

      <SpinButton
        machineState={machineState}
        disabled={controlsLocked}
        onSpin={spin}
        turboMode={turboMode}
        onToggleTurbo={setTurboMode}
        autoSpin={autoSpin}
        onToggleAutoSpin={setAutoSpin}
      />

      <BetControls
        betOptions={betOptions}
        betAmount={betAmount}
        disabled={controlsLocked}
        balance={balance}
        onSelectBet={selectBet}
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
