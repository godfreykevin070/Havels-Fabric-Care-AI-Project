export default function HealthBar({ score }: { score: number }) {
  const tone = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';
  return (
    <div className="health-bar">
      <div className={`health-fill ${tone}`} style={{ width: `${Math.max(2, score)}%` }} />
    </div>
  );
}