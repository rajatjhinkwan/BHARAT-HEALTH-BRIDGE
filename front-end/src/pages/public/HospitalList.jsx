import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';

import { API_BASE_URL } from '../../config';

const MOCK_HOSPITALS = [
    { _id: '1', name: 'City Central Hospital', city: 'Delhi', address: 'Connaught Place', phone: '+91 98765 43210', type: 'Multispecialty', bedsAvail: 45 },
    { _id: '2', name: 'Global Care Clinic', city: 'Mumbai', address: 'Bandra West', phone: '+91 91234 56789', type: 'Private', bedsAvail: 0 },
    { _id: '3', name: 'Apex Heart Institute', city: 'Bengaluru', address: 'Koramangala', phone: '+91 99887 76655', type: 'Specialty', bedsAvail: 12 },
    { _id: '4', name: 'LifeLine General', city: 'Delhi', address: 'South Ex', phone: '+91 99999 88888', type: 'General', bedsAvail: 8 },
];

export default function HospitalList() {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch(`${API_BASE_URL}/hospitals?state=Uttarakhand&limit=200`)
            .then(r => {
                if (!r.ok) throw new Error('API failed');
                return r.json();
            })
            .then(data => {
                setHospitals(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.warn('Backend unavailable, using mock data', err);
                setTimeout(() => {
                    setHospitals(MOCK_HOSPITALS);
                    setLoading(false);
                }, 800);
            });
    }, []);

    const filteredHospitals = hospitals.filter(h =>
        h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.district?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const styles = {
        container: {
            padding: '4rem 2rem',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: '80vh'
        },
        headerRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '3rem',
            flexWrap: 'wrap',
            gap: '2rem'
        },
        title: {
            fontSize: '2.5rem',
            margin: '0 0 0.5rem 0',
            fontWeight: 800,
            letterSpacing: '-1px'
        },
        subtitle: {
            color: 'var(--text-muted)',
            margin: 0,
            fontSize: '1.1rem'
        },
        searchWrap: {
            position: 'relative',
            minWidth: '350px',
            flex: '1 1 auto',
            maxWidth: '500px'
        },
        searchIcon: {
            position: 'absolute',
            left: '1.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
        },
        searchInput: {
            width: '100%',
            padding: '1rem 1rem 1rem 3.5rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            outline: 'none',
            fontSize: '1.05rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '2rem'
        },
        loadingState: {
            textAlign: 'center',
            padding: '5rem',
            fontSize: '1.25rem',
            color: 'var(--text-muted)'
        }
    };

    return (
        <div style={styles.container} className="animate-fade-in-up">
            <div style={styles.headerRow}>
                <div>
                    <h1 style={styles.title}>Partner Hospitals</h1>
                    <p style={styles.subtitle}>159 government & private facilities across Uttarakhand with live map navigation.</p>
                </div>
                <div style={styles.searchWrap}>
                    <Search style={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Search by city, name, or speciality..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                </div>
            </div>

            {loading ? (
                <div style={styles.loadingState}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                    <p>Loading hospital database...</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {filteredHospitals.map(h => (
                        <HospitalCard key={h._id || h.name} hospital={h} />
                    ))}
                </div>
            )}

            {!loading && filteredHospitals.length === 0 && (
                <div style={styles.loadingState}>
                    No hospitals found matching your search term.
                </div>
            )}
        </div>
    );
}

function HospitalCard({ hospital }) {
    const availableBeds = hospital.bedsAvail ?? hospital.bed_count ?? 10;
    const isAvailable = availableBeds > 0;

    const openMaps = () => {
        if (hospital.latitude != null && hospital.longitude != null) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`,
                '_blank'
            );
        }
    };

    const styles = {
        card: {
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'all 0.2s',
            cursor: 'pointer'
        },
        topInfo: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        typeBadge: {
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
        },
        statusBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: isAvailable ? 'var(--success)' : 'var(--danger)',
            backgroundColor: isAvailable ? 'var(--success-light)' : 'var(--danger-light)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)'
        },
        name: {
            margin: '0.5rem 0 0 0',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-main)'
        },
        detailsWrap: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: 1
        },
        detailItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-muted)',
            fontSize: '0.95rem'
        },
        bottomRow: {
            borderTop: '1px solid var(--border)',
            paddingTop: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem'
        },
        bedCount: {
            display: 'flex',
            flexDirection: 'column'
        },
        bedNumber: {
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            lineHeight: 1.1
        },
        bedLabel: {
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
        },
        bookBtn: {
            padding: '0.75rem 1.5rem'
        }
    };

    return (
        <div style={styles.card} onMouseOver={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(-5px)', boxShadow: 'var(--shadow-md)', borderColor: 'var(--divider)' })} onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: 'var(--shadow)', borderColor: 'var(--border)' })}>
            <div style={styles.topInfo}>
                <span style={styles.typeBadge}>{hospital.type || 'GENERAL'}</span>
                <div style={styles.statusBadge}>
                    {isAvailable ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {isAvailable ? 'Available' : 'Full'}
                </div>
            </div>

            <h3 style={styles.name}>{hospital.name}</h3>

            <div style={styles.detailsWrap}>
                <div style={styles.detailItem}>
                    <MapPin size={18} color="var(--primary)" />
                    {hospital.city}, {hospital.address || 'India'}
                </div>
                <div style={styles.detailItem}>
                    <Phone size={18} color="var(--primary)" />
                    {hospital.phone || '+91 - Not Provided'}
                </div>
            </div>

            <div style={styles.bottomRow}>
                <div style={styles.bedCount}>
                    <span style={styles.bedNumber}>{availableBeds}</span>
                    <span style={styles.bedLabel}>Avail. Beds</span>
                </div>
                <button
                    type="button"
                    className="btn-primary"
                    style={styles.bookBtn}
                    onClick={(e) => { e.stopPropagation(); openMaps(); }}
                >
                    Navigate
                </button>
            </div>
        </div>
    );
}
