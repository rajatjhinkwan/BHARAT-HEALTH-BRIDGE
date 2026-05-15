import React, { useState } from 'react';
import { PackageSearch, AlertTriangle, ArrowDownUp, RefreshCw, PlusCircle, Search } from 'lucide-react';

const mockInventory = [
  { id: 'MED-001', brandName: 'Augmentin 625 Duo', genericName: 'Amoxicillin + Clavulanic Acid', form: 'Tablet', stock: 120, reorderPoint: 50, price: 200, category: 'Antibiotic' },
  { id: 'MED-002', brandName: 'Dolo 650', genericName: 'Paracetamol', form: 'Tablet', stock: 15, reorderPoint: 100, price: 30, category: 'Analgesic' },
  { id: 'MED-003', brandName: 'Calpol 250', genericName: 'Paracetamol', form: 'Syrup', stock: 45, reorderPoint: 30, price: 40, category: 'Analgesic' },
  { id: 'MED-004', brandName: 'Pan 40', genericName: 'Pantoprazole', form: 'Tablet', stock: 500, reorderPoint: 150, price: 130, category: 'Antacid' },
  { id: 'MED-005', brandName: 'Monocef 1g', genericName: 'Ceftriaxone', form: 'Injection', stock: 8, reorderPoint: 20, price: 60, category: 'Antibiotic' }
];

export default function InventoryManagement() {
  const [inventory] = useState(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  
  const getStockStatus = (stock, reorder) => {
     if (stock <= 0) return { label: 'Out of Stock', color: 'var(--danger)' };
     if (stock <= reorder) return { label: 'Low Stock', color: 'var(--warning)' };
     return { label: 'In Stock', color: 'var(--success)' };
  };

  const handleReorder = (id) => {
     alert(`Purchase Order (PO) sequence triggered for ${id}. System logic will check configured suppliers for best price.`);
  };

  const filteredInventory = inventory.filter(item => 
      item.brandName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    card: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' },
    td: { padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: '500' },
    searchBox: { display: 'flex', alignItems: 'center', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 1rem', width: '350px' },
    input: { border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', marginLeft: '0.5rem' }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.card}>
        <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <PackageSearch size={36} color="var(--primary)" />
                <div>
                   <h1 style={{ margin: 0 }}>Inventory Master Data</h1>
                   <p style={{ margin: 0, color: 'var(--text-muted)' }}>FEFO-enabled automated stock tracking logic</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={styles.searchBox}>
                   <Search size={18} color="var(--text-muted)" />
                   <input 
                      style={styles.input} 
                      placeholder="Search Branded or Generic..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem' }}>
                   <PlusCircle size={18} /> Add Medicine
                </button>
            </div>
        </div>

        <table style={styles.table}>
            <thead>
               <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Brand Name (Drug)</th>
                  <th style={styles.th}>Generic Composition</th>
                  <th style={styles.th}>Form</th>
                  <th style={styles.th}>Stock Level</th>
                  <th style={styles.th}>Alert Status</th>
                  <th style={styles.th}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {filteredInventory.map(item => {
                  const status = getStockStatus(item.stock, item.reorderPoint);
                  return (
                     <tr key={item.id}>
                        <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.id}</td>
                        <td style={styles.td}>
                           <div style={{ fontWeight: 'bold' }}>{item.brandName}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MRP: ₹{item.price}</div>
                        </td>
                        <td style={{ ...styles.td, fontSize: '0.9rem', color: 'var(--primary)' }}>{item.genericName}</td>
                        <td style={{ ...styles.td, color: 'var(--text-muted)' }}>{item.form}</td>
                        <td style={styles.td}>
                           <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.stock}</span>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ Min {item.reorderPoint}</div>
                        </td>
                        <td style={styles.td}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: status.color, background: `${status.color}20`, padding: '0.3rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold', width: 'fit-content' }}>
                              {status.label === 'Low Stock' && <AlertTriangle size={14}/>}
                              {status.label}
                           </div>
                        </td>
                        <td style={styles.td}>
                           {item.stock <= item.reorderPoint && (
                               <button onClick={() => handleReorder(item.id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <RefreshCw size={14}/> Auto-PO
                               </button>
                           )}
                        </td>
                     </tr>
                  );
               })}
            </tbody>
        </table>
      </div>
    </div>
  );
}
