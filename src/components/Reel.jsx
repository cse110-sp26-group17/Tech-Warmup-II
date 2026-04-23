import { useEffect, useState } from 'react';
import { getRandomSymbol, MACHINE_STATES, SYMBOL_DISPLAY } from '../animations/reelAnimation';

export default function Reel({
  reelIndex,
  finalSymbol,
  spinToken,
  machineState,
  spinDuration,
  reducedMotion,
  nearMissHint,
  onStop,
}) {
  const [displaySymbol, setDisplaySymbol] = useState(finalSymbol);
  const [ghostTop, setGhostTop] = useState(getRandomSymbol());
  const [ghostBottom, setGhostBottom] = useState(getRandomSymbol());
  const [isSpinningVisual, setIsSpinningVisual] = useState(false);
  const [showNearMiss, setShowNearMiss] = useState(false);

  useEffect(() => {
    if (machineState !== MACHINE_STATES.SPINNING) {
      setDisplaySymbol(finalSymbol);
    }
  }, [finalSymbol, machineState]);

  useEffect(() => {
    if (machineState !== MACHINE_STATES.SPINNING) {
      return;
    }

    let rollIntervalId;
    let stopTimerId;
    let nearMissTimerId;
    let finalizeTimerId;

    const stopWithFinalSymbol = () => {
      setDisplaySymbol(finalSymbol);
      setGhostTop(getRandomSymbol());
      setGhostBottom(getRandomSymbol());
      setIsSpinningVisual(false);
      setShowNearMiss(false);
      onStop(reelIndex);
    };

    if (reducedMotion) {
      setDisplaySymbol(finalSymbol);
      setIsSpinningVisual(false);
      setShowNearMiss(false);
      stopTimerId = setTimeout(() => onStop(reelIndex), spinDuration);
      return () => clearTimeout(stopTimerId);
    }

    setIsSpinningVisual(true);
    rollIntervalId = setInterval(() => {
      setGhostTop(getRandomSymbol());
      setDisplaySymbol(getRandomSymbol());
      setGhostBottom(getRandomSymbol());
    }, 85);

    stopTimerId = setTimeout(() => {
      clearInterval(rollIntervalId);

      if (nearMissHint && nearMissHint.reelIndex === reelIndex) {
        setShowNearMiss(true);
        setDisplaySymbol(nearMissHint.previewSymbol);

        nearMissTimerId = setTimeout(() => {
          setDisplaySymbol(nearMissHint.finalMissSymbol ?? finalSymbol);
          finalizeTimerId = setTimeout(() => {
            stopWithFinalSymbol();
          }, 60);
        }, nearMissHint.previewDurationMs);
      } else {
        stopWithFinalSymbol();
      }
    }, spinDuration);

    return () => {
      clearInterval(rollIntervalId);
      clearTimeout(stopTimerId);
      clearTimeout(nearMissTimerId);
      clearTimeout(finalizeTimerId);
    };
  }, [machineState, spinToken, spinDuration, finalSymbol, nearMissHint, reducedMotion, onStop, reelIndex]);

  const visibleSymbol = SYMBOL_DISPLAY[displaySymbol];
  const topSymbol = SYMBOL_DISPLAY[ghostTop];
  const bottomSymbol = SYMBOL_DISPLAY[ghostBottom];

  return (
    <article
      className={`reel ${isSpinningVisual ? 'is-spinning' : ''} ${showNearMiss ? 'near-miss slow-stop' : ''}`}
      aria-label={`Reel ${reelIndex + 1}: ${visibleSymbol.label}`}
    >
      <div className={`reel-strip ${isSpinningVisual ? 'rolling' : ''}`}>
        <div className="reel-cell ghost">
          <span className="symbol-code">{topSymbol.code}</span>
          <span className="symbol-label">{topSymbol.label}</span>
        </div>
        <div className="reel-cell main">
          <span className="symbol-code">{visibleSymbol.code}</span>
          <span className="symbol-label">{visibleSymbol.label}</span>
        </div>
        <div className="reel-cell ghost">
          <span className="symbol-code">{bottomSymbol.code}</span>
          <span className="symbol-label">{bottomSymbol.label}</span>
        </div>
      </div>

      {showNearMiss ? <p className="near-miss-banner">SO CLOSE!</p> : null}
    </article>
  );
}
