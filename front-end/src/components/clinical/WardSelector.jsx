import { getWardOptions, toDisplayLabel, setStoredWard } from '../../utils/wards';

export default function WardSelector({ value, onChange, showLabel = true, className = '' }) {
  const options = getWardOptions();

  const handleChange = (e) => {
    const key = e.target.value;
    setStoredWard(key);
    onChange(key);
  };

  return (
    <div className={`ward-selector-container ${className}`}>
      {showLabel && <label className="ward-select-label">Select ward / department</label>}
      <select className="ward-select-dropdown" value={value} onChange={handleChange}>
        {options.map((o) => (
          <option key={o.key} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="ward-select-subtitle">{toDisplayLabel(value)} · Command Center</span>
    </div>
  );
}
