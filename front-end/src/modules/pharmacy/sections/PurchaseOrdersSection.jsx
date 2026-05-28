import { useState } from 'react';
import { usePharmacyStore } from '../store/pharmacyStore';
import { createPurchaseOrder, receivePurchaseOrder } from '../api/pharmacyApi';

export default function PurchaseOrdersSection() {
  const { purchaseOrders, medicines, reorderSuggestions } = usePharmacyStore();
  const [creating, setCreating] = useState(false);

  const createFromLowStock = async () => {
    setCreating(true);
    const items = (reorderSuggestions || []).slice(0, 3).map((r) => {
      const med = medicines.find((m) => m.medicineId === r.medicineId);
      return { medicineId: med?.id || med?._id, name: r.name, quantity: r.suggestedQty, unitPrice: med?.unitPrice || 0 };
    });
    await createPurchaseOrder({
      supplierName: 'MedSupply India',
      items,
      status: 'sent',
      expectedDate: new Date(Date.now() + 86400000 * 5),
    });
    setCreating(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Purchase Orders</h1>
        <button type="button" className="ph-btn ph-btn--primary" disabled={creating} onClick={createFromLowStock}>
          Auto-reorder low stock
        </button>
      </div>
      <div className="ph-table-wrap" style={{ marginTop: '1rem' }}>
        <table className="ph-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Items</th>
              <th>Expected</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((o) => (
              <tr key={o._id}>
                <td>{o.orderId}</td>
                <td>{o.supplierName}</td>
                <td><span className={`ph-status ph-status--${o.status === 'received' ? 'healthy' : 'low_stock'}`}>{o.status}</span></td>
                <td>{(o.items || []).length}</td>
                <td>{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : '—'}</td>
                <td>
                  {o.status !== 'received' && (
                    <button type="button" className="ph-btn" onClick={() => receivePurchaseOrder(o._id)}>
                      Receive stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
