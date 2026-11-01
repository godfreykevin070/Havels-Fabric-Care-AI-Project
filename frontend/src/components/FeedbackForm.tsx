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
  { key: 'roughness', label: 'Roughness / harsh feel' },
  { key: 'pilling', label: 'Pilling' },
  { key: 'color_loss', label: 'Colour loss' },
];

export default function FeedbackForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: FeedbackValues) => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<FeedbackValues>({
    cleaning_satisfaction: 4,
    fading: 0,
    shrinkage: 0,
    roughness: 0,
    pilling: 0,
    color_loss: 0,
    notes: '',
  });

  const update = (key: keyof FeedbackValues, value: number | string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="card feedback-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <h2>How did the wash turn out?</h2>

      <label className="slider-row">
        <span>Cleaning satisfaction (1–5)</span>
        <input
          type="range"
          min={1}
          max={5}
          value={values.cleaning_satisfaction}
          onChange={(e) => update('cleaning_satisfaction', Number(e.target.value))}
        />
        <strong>{values.cleaning_satisfaction}</strong>
      </label>

      {DEFECT_FIELDS.map((f) => (
        <label className="slider-row" key={f.key}>
          <span>{f.label} (0–3)</span>
          <input
            type="range"
            min={0}
            max={3}
            value={values[f.key] as number}
            onChange={(e) => update(f.key, Number(e.target.value))}
          />
          <strong>{values[f.key] as number}</strong>
        </label>
      ))}

      <label className="text-row">
        <span>Notes</span>
        <textarea
          rows={2}
          value={values.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="e.g. sweater felt scratchy, jeans lost indigo"
        />
      </label>

      <button className="primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit feedback'}
      </button>
    </form>
  );
}