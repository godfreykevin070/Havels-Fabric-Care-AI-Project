export default function HealthBar({ score }: { score: number }) {
  const tone = score >= 80 ? 'good' : score >= 60 ? 'ok' : score >= 40 ? 'warn' : 'bad';
  return (
    <div className="health-bar">
      <div className={`health-fill ${tone}`} style={{ width: `${Math.max(2, score)}%` }} />
      <span className="health-value">{score.toFixed(0)}</span>
    </div>
  );
}