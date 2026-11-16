export default function ProgressBar({ percent, color = 'var(--accent)', label }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${percent}%`, background: color }} />
    </div>
  );
}
