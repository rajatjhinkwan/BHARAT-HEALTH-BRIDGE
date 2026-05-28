import React from 'react';

export default function ToggleSwitch({ checked, onChange, id, label }) {
  return (
    <label className="dhp-toggle" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="dhp-toggle-slider" aria-label={label} />
    </label>
  );
}
