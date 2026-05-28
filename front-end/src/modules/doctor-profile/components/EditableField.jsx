import React from 'react';

export default function EditableField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  helper,
  maxLength,
  rows,
  options,
  className = '',
  disabled,
}) {
  const showCount = maxLength && (type === 'text' || rows);

  return (
    <div className={`dhp-field ${className}`}>
      <label htmlFor={name}>{label}</label>
      {rows ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          rows={rows}
          maxLength={maxLength}
          className={error ? 'error' : ''}
          disabled={disabled}
        />
      ) : options ? (
        <select id={name} name={name} value={value ?? ''} onChange={onChange} disabled={disabled}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          maxLength={maxLength}
          className={error ? 'error' : ''}
          disabled={disabled}
        />
      )}
      {error && <span className="dhp-field-error">{error}</span>}
      {helper && !error && <span className="dhp-char-count">{helper}</span>}
      {showCount && (
        <span className="dhp-char-count">
          {(value || '').length}/{maxLength}
        </span>
      )}
    </div>
  );
}
