export default function SettingsOverlay({
  open,
  soundEnabled,
  reducedMotion,
  onToggleOpen,
  onToggleSound,
  onToggleReducedMotion,
}) {
  return (
    <aside className={`settings-panel ${open ? 'is-open' : ''}`} aria-label="Settings">
      <button
        type="button"
        className="settings-toggle"
        onClick={() => onToggleOpen(!open)}
        aria-label={open ? 'Close settings' : 'Open settings'}
      >
        {open ? 'Close' : 'Settings'}
      </button>

      {open ? (
        <div className="settings-content">
          <label className="settings-row">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => onToggleSound(event.target.checked)}
            />
            <span>Sound Enabled</span>
          </label>
          <label className="settings-row">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => onToggleReducedMotion(event.target.checked)}
            />
            <span>Reduced Motion</span>
          </label>
        </div>
      ) : null}
    </aside>
  );
}
