import { useState } from 'react';
import { usePharmacyStore } from '../store/pharmacyStore';
import { submitReturn } from '../api/pharmacyApi';

export default function ReturnsSection() {
  const { medicines } = usePharmacyStore();
  const [form, setForm] = useState({ medicineId: '', quantity: 1, reason: '', patientName: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitReturn(form);
    setForm({ medicineId: '', quantity: 1, reason: '', patientName: '' });
    alert('Return processed — stock updated');
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Returns & Refunds</h1>
      <form className="ph-panel" style={{ maxWidth: 480 }} onSubmit={handleSubmit}>
        <div className="ph-form-group">
          <label>Medicine</label>
          <select className="ph-select" required value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })}>
            <option value="">Select…</option>
            {medicines.map((m) => (
              <option key={m.id || m._id} value={m.id || m._id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="ph-form-group">
          <label>Quantity</label>
          <input type="number" className="ph-input" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} />
        </div>
        <div className="ph-form-group">
          <label>Patient (optional)</label>
          <input className="ph-input" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
        </div>
        <div className="ph-form-group">
          <label>Reason</label>
          <input className="ph-input" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Damaged / wrong issue / refund" />
        </div>
        <button type="submit" className="ph-btn ph-btn--primary">Process return</button>
      </form>
    </div>
  );
}
