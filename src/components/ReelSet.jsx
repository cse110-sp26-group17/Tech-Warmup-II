import Reel from './Reel';

export default function ReelSet({
  reelSymbols,
  spinToken,
  machineState,
  spinProfile,
  reducedMotion,
  nearMissHint,
  onReelStop,
}) {
  return (
    <section className="reel-set" aria-label="Slot machine reels">
      {reelSymbols.map((symbolName, index) => (
        <Reel
          key={`reel-${index}`}
          reelIndex={index}
          finalSymbol={symbolName}
          spinToken={spinToken}
          machineState={machineState}
          spinDuration={spinProfile.reelDurations[index]}
          reducedMotion={reducedMotion}
          nearMissHint={nearMissHint}
          onStop={onReelStop}
        />
      ))}
    </section>
  );
}
