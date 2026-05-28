export const STATUS_LABELS = {
  healthy: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
};

export function statusClass(status) {
  return `ph-status ph-status--${status || 'healthy'}`;
}

export function exportCsv(rows, filename = 'inventory.csv') {
  if (!rows || rows.length === 0) return;
  
  const columns = [
    { label: 'Medicine ID', key: 'medicineId' },
    { label: 'Medicine Name', key: 'name' },
    { label: 'Generic Name', key: 'genericName' },
    { label: 'Category', key: 'category' },
    { label: 'Stock Quantity', key: 'stockQuantity' },
    { label: 'Minimum Stock', key: 'minimumStock' },
    { label: 'Expiry Date', key: 'expiryDate', format: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { label: 'Selling Price (INR)', key: 'sellingPrice', format: (v) => `₹${v ?? 0}` },
    { label: 'Rack Location', key: 'rackLocation' },
    { label: 'Status', key: 'status', format: (v) => {
        const labels = {
          healthy: 'In Stock',
          low_stock: 'Low Stock',
          out_of_stock: 'Out of Stock',
          expiring_soon: 'Expiring Soon',
          expired: 'Expired',
        };
        return labels[v] || v || '—';
      }
    }
  ];

  const headers = columns.map(c => `"${c.label}"`).join(',');
  const lines = rows.map(row => 
    columns.map(c => {
      let val = row[c.key];
      if (c.format) {
        val = c.format(val);
      }
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  const csv = [headers, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
