import { useState } from 'react';

export interface FeedbackValues {
  cleaning_satisfaction: number;
  fading: number;
  shrinkage: number;
  roughness: number;
  pilling: number;
  color_loss: number;
  notes: string;
}

const DEFECT_FIELDS: { key: keyof FeedbackValues; label: string }[] = [
  { key: 'fading', label: 'Fading' },
  { key: 'shrinkage', label: 'Shrinkage' },
  { key: 'roughness', label: 'Roughness' },
  { key: 'pilling', label: 'Pilling' },
  { key: 'color_loss', label: 'Colour Loss' },
];

export default function FeedbackForm({ onSubmit, submitting }: { onSubmit: (values: FeedbackValues) => void; submitting: boolean; }) {
  const [values, setValues] = useState<FeedbackValues>({
    cleaning_satisfaction: 4, fading: 0, shrinkage: 0, roughness: 0, pilling: 0, color_loss: 0, notes: '',
  });

  const update = (key: keyof FeedbackValues, value: number | string) => setValues(prev => ({ ...prev, [key]: value }));

  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); onSubmit(values); }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Rate Your Wash</h3>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cleaning Satisfaction</span>
          <strong>{values.cleaning_satisfaction} / 5</strong>
        </label>
        <input type="range" min={1} max={5} value={values.cleaning_satisfaction} onChange={(e) => update('cleaning_satisfaction', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--havells-red)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {DEFECT_FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{f.label}</span>
              <strong>{values[f.key] as number} / 3</strong>
            </label>
            <input type="range" min={0} max={3} value={values[f.key] as number} onChange={(e) => update(f.key, Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--havells-red)' }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label>Notes</label>
        <textarea rows={3} value={values.notes} onChange={(e) => update('notes', e.target.value)} placeholder="e.g. Sweater felt scratchy, jeans lost some indigo..." />
      </div>

      <button className="primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
        {submitting ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </form>
  );
}