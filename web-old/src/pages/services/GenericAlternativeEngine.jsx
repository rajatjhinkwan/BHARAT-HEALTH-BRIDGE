import React, { useState } from 'react';
import { Sparkles, UploadCloud, Search, ArrowRight, Pill, ShieldCheck, IndianRupee } from 'lucide-react';

export default function GenericAlternativeEngine() {
  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const mockAlternativeEngine = (search) => {
      return {
         scannedBrand: search || 'Augmentin 625 Duo',
         saltComposition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
         brandedPrice: 200,
         alternatives: [
            { id: 1, name: 'Amoxyclav 625', type: 'Generic', price: 65, manufacturer: 'Jan Aushadhi', inStock: true },
            { id: 2, name: 'Moxikind-CV 625', type: 'Branded Generic', price: 155, manufacturer: 'Mankind', inStock: true },
            { id: 3, name: 'Advent 625', type: 'Branded', price: 180, manufacturer: 'Cipla', inStock: false }
         ]
      };
  };

  const handleSearch = () => {
      setAnalyzing(true);
      setTimeout(() => {
          setResults(mockAlternativeEngine(query));
          setAnalyzing(false);
      }, 1500);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
      e.preventDefault();
      setQuery('Prescription_OCR_Extracted');
      handleSearch();
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
    header: { textAlign: 'center', marginBottom: '3rem' },
    uploadZone: { background: 'var(--surface-hover)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '2rem' },
    searchBar: { display: 'flex', gap: '1rem', background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' },
    input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '1.1rem', padding: '0.5rem' },
    card: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2rem', border: '1px solid var(--border)', marginBottom: '1rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
    th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' },
    td: { padding: '1rem', borderBottom: '1px solid var(--border)' },
    badge: (type) => ({ padding: '0.3rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', background: type === 'Generic' ? 'var(--success-light)' : (type === 'Branded' ? 'rgba(255,255,255,0.05)' : 'var(--primary-light)'), color: type === 'Generic' ? 'var(--success)' : (type === 'Branded' ? '#cbd5e1' : 'var(--primary)'), border: `1px solid ${type === 'Generic' ? 'var(--success)' : (type === 'Branded' ? '#475569' : 'var(--primary)')}` })
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
         <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '9999px', fontWeight: 'bold', marginBottom: '1rem' }}>
            <Sparkles size={16} /> Advanced Pharmacological Engine
         </div>
         <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0' }}>Generic Alternative Finder</h1>
         <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Upload a prescription or search a branded medicine to find chemically equivalent, cost-effective generic alternatives.</p>
      </div>

      <div 
         style={styles.uploadZone}
         onDragOver={handleDragOver}
         onDrop={handleDrop}
         onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
         onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
         <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
         <h3 style={{ margin: '0 0 0.5rem 0' }}>Drop Prescription Image/PDF via OCR</h3>
         <p style={{ color: 'var(--text-muted)', margin: 0 }}>Auto-extracts medicines and crosses them against generic salts.</p>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>- OR -</div>

      <div style={styles.searchBar}>
         <Search size={24} color="var(--text-muted)" style={{ marginLeft: '0.5rem', marginTop: '0.5rem' }} />
         <input 
            style={styles.input} 
            placeholder="Type Branded Medicine Name (e.g. Augmentin 625, Dolo 650)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
         />
         <button onClick={handleSearch} disabled={analyzing} className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius)' }}>
            {analyzing ? 'Analyzing Salt Mapping...' : 'Find Equivalents'}
         </button>
      </div>

      {results && (
         <div style={{ marginTop: '3rem' }} className="animate-fade-in-up">
            <div style={styles.card}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}><Pill size={20} color="var(--primary)"/> Input Profile</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center' }}>
                  <div>
                     <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{results.scannedBrand}</div>
                     <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginTop: '0.5rem' }}>Salt: {results.saltComposition}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Reference MRP</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{results.brandedPrice}.00</div>
                  </div>
               </div>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
               <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-hover)' }}>
                  <ShieldCheck size={20} color="var(--success)"/> <h3 style={{ margin: 0 }}>Approved Substitutes (Exact Salt Match)</h3>
               </div>
               <table style={styles.table}>
                  <thead>
                     <tr>
                        <th style={styles.th}>Substitute Name</th>
                        <th style={styles.th}>Classification</th>
                        <th style={styles.th}>Manufacturer</th>
                        <th style={styles.th}>Unit Price (₹)</th>
                        <th style={styles.th}>Patient Savings</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}></th>
                     </tr>
                  </thead>
                  <tbody>
                     {results.alternatives.map(alt => {
                        const savings = results.brandedPrice - alt.price;
                        const savingsPct = Math.round((savings / results.brandedPrice) * 100);
                        
                        return (
                           <tr key={alt.id} style={{ background: alt.type === 'Generic' ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                              <td style={{ ...styles.td, fontWeight: 'bold' }}>{alt.name}</td>
                              <td style={styles.td}><span style={styles.badge(alt.type)}>{alt.type}</span></td>
                              <td style={{ ...styles.td, color: 'var(--text-muted)' }}>{alt.manufacturer}</td>
                              <td style={{ ...styles.td, fontSize: '1.1rem', fontWeight: 'bold' }}>₹{alt.price}</td>
                              <td style={styles.td}>
                                 {savings > 0 ? (
                                    <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                       <IndianRupee size={14}/> Save {savings} ({savingsPct}%)
                                    </span>
                                 ) : '-'}
                              </td>
                              <td style={styles.td}>
                                 {alt.inStock ? 
                                    <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold' }}>● In Stock</span> : 
                                    <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 'bold' }}>● OOS</span>
                                 }
                              </td>
                              <td style={styles.td}>
                                 <button disabled={!alt.inStock} className="btn-secondary" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Recommend <ArrowRight size={14}/>
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      )}
    </div>
  );
}
