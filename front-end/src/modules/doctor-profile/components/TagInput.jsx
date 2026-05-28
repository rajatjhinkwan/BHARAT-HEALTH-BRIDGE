import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ tags = [], onChange, placeholder = 'Add and press Enter' }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
      setInput('');
    }
  };

  const remove = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid var(--dhp-border)', borderRadius: '12px' }}
        />
        <button type="button" className="dhp-btn dhp-btn-ghost" onClick={add}>
          Add
        </button>
      </div>
      <div className="dhp-tags">
        {tags.map((tag) => (
          <span key={tag} className="dhp-tag">
            {tag}
            <button type="button" onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
