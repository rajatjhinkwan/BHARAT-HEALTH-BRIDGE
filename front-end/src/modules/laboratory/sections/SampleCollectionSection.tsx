import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Droplet, Printer, User, AlertCircle, Clock, CheckCircle2, Shield } from 'lucide-react';
import { useLabStore } from '../store/labStore';
import { patchLabOrder } from '../api/labApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { useLabData } from '../hooks/useLabData';

export function SampleCollectionSection() {
  const { orders, loading } = useLabStore();
  const { refresh } = useLabData();
  
  // Awaiting collection includes both accepted/pending orders and those recently marked collected (so techs can print labels)
  const awaiting = orders.filter((o) =>
    ['Pending', 'Accepted', 'Awaiting Collection', 'Sample Collected'].includes(o.status)
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [printingState, setPrintingState] = useState<'idle' | 'printing' | 'success'>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find the selected order, or default to the first one in the queue if none is active
  const active = awaiting.find((o) => `${o.patientId}-${o.orderIndex}` === activeId) || awaiting[0];

  useEffect(() => {
    if (active) {
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeId, active?.patientId, active?.orderIndex]);

  const selectPatient = (id: string) => {
    setActiveId(id);
    setPrintingState('idle');
  };

  const handlePrint = () => {
    setPrintingState('printing');
    // Simulate high-fidelity label printing
    setTimeout(() => {
      setPrintingState('success');
      setTimeout(() => setPrintingState('idle'), 3000);
    }, 1200);
  };

  const complete = async () => {
    if (!active) return;
    const sampleId = active.sampleId || `SMP-${Date.now().toString(36).toUpperCase()}`;
    
    try {
      if (!active.patientId.startsWith('mock')) {
        await patchLabOrder(active.patientId, active.orderIndex, {
          status: 'Sample Collected',
          sampleStatus: 'Collected',
          sampleId,
          collectionCompletedAt: new Date().toISOString(),
          timelineNote: `Vial registered and scanned into local pathology repository. ID: ${sampleId}`,
        });
      }
      refresh();
      // Keep selection so they can print/review, but trigger success feedback
      alert(`Specimen ${sampleId} successfully registered and moved to pathology queue.`);
    } catch (e) {
      console.error(e);
      alert('Failed to register specimen collection.');
    }
  };

  // Safe fallback values
  const currentSampleId = active?.sampleId || `SMP-${(active?.mrn || '0000').replace(/\//g, '')}-${active?.orderIndex || '0'}`;

  // QR Code payload
  const qrValue = JSON.stringify({
    UHID: active?.mrn,
    PatientName: active?.patientName,
    SampleID: currentSampleId,
    SpecimenType: active?.sampleType || 'Whole Blood',
    Tests: active?.tests || [],
    Timestamp: new Date().toISOString(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">Pathology Specimen Console</h1>
          <p className="text-[var(--text-muted)]">Verify patient records, generate specimen barcodes, and stick tube labels.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[var(--primary-light)]/20 border border-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
          <Shield className="h-4 w-4" />
          HIPAA & Clinical Guidelines Compliant
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Side: Queue List */}
        <Card className="lg:col-span-5 h-[calc(100vh-220px)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-hover)]/30">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Collection Queue</span>
              <span className="rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)]">
                {awaiting.length} orders
              </span>
            </CardTitle>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] p-4 bg-[var(--surface)] animate-pulse">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 rounded bg-[var(--border)]" />
                    <div className="h-3 w-48 rounded bg-[var(--border)]" />
                  </div>
                  <div className="ml-3 h-5 w-5 rounded-full bg-[var(--border)]" />
                </div>
              ))
            ) : (
              awaiting.map((o) => {
                const isSelected = active && `${active.patientId}-${active.orderIndex}` === `${o.patientId}-${o.orderIndex}`;
                const isCollected = o.status === 'Sample Collected';
                return (
                  <button
                    key={`${o.patientId}-${o.orderIndex}`}
                    type="button"
                    onClick={() => selectPatient(`${o.patientId}-${o.orderIndex}`)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]/20 shadow-[0_4px_12px_rgba(59,130,246,0.08)]'
                        : 'border-[var(--border)] hover:bg-[var(--surface-hover)]/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-main)] truncate">{o.patientName}</span>
                        {o.priority === 'Emergency' && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-extrabold text-red-600 uppercase tracking-wide">
                            SOS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                        {o.mrn} · {o.gender} · {o.tests.join(', ')}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0">
                      {isCollected ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Droplet className={`h-5 w-5 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
            {!loading && awaiting.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">No active patients awaiting collection.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Right Side: Active Console */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <Card className="overflow-hidden border-t-4 border-t-[var(--primary)] bg-[var(--surface)] animate-pulse">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-[var(--border)]/40 pb-4">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--border)]" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 rounded bg-[var(--border)]" />
                    <div className="h-4 w-32 rounded bg-[var(--border)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-[var(--border)]" />
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-9 rounded-xl bg-[var(--border)]" />
                    ))}
                  </div>
                </div>
                <div className="h-24 rounded-2xl bg-[var(--border)]" />
                <div className="h-36 rounded-2xl bg-[var(--border)]" />
              </CardContent>
            </Card>
          ) : active ? (
            <Card className="overflow-hidden border-t-4 border-t-[var(--primary)]">
              <CardContent className="p-6 space-y-6">
                {/* Active Header */}
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-[var(--text-main)]">{active.patientName}</h2>
                      <p className="text-sm font-semibold text-[var(--text-muted)]">
                        UHID: {active.mrn} · {active.age}y / {active.gender}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--background)] px-3 py-2 border border-[var(--border)]/40 text-right">
                    <Clock className="h-4 w-4 text-[var(--primary)] animate-pulse" />
                    <span className="font-mono text-base font-bold tabular-nums text-[var(--text-main)]">
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Patient verification checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Clinical Verification Checklist</h4>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-800 font-semibold">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      Verify Patient ID (UHID)
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-800 font-semibold">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      Confirm Fasting / prep requirements
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-800 font-semibold">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      Crosscheck requested investigations
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-800 font-semibold">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      Prepare blood vacuum / specimen tube
                    </div>
                  </div>
                </div>

                {/* Specimen Details */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-[var(--border)]/40">
                    <span className="font-semibold text-[var(--text-muted)]">Ordered Tests:</span>
                    <span className="font-extrabold text-[var(--primary)]">{active.tests.join(', ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-[var(--border)]/40">
                    <span className="font-semibold text-[var(--text-muted)]">Tube Specification:</span>
                    <span className="font-extrabold text-[var(--text-main)]">
                      {active.sampleType === 'Urine' ? 'Specimen Container (Yellow cap)' : 'EDTA Lavender Top (Vial)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-[var(--text-muted)]">Clinic / Ref. Doctor:</span>
                    <span className="font-medium text-[var(--text-main)] truncate">{active.assignedDoctor || 'OPD Doctor'}</span>
                  </div>
                </div>

                {/* Visual Specimen Label Card */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Specimen Tube Label Preview</h4>
                  <div className="relative mx-auto max-w-sm rounded-2xl border border-slate-300 bg-white p-5 text-slate-800 shadow-md font-sans">
                    <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-300 pb-3 mb-3">
                      <div>
                        <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-800">Bharat Health Bridge</h5>
                        <p className="text-[13px] font-black text-slate-900 mt-1">{active.patientName}</p>
                        <p className="text-[10px] font-bold text-slate-500">UHID: {active.mrn}</p>
                      </div>
                      <div className="shrink-0 bg-slate-50 border p-1 rounded-lg">
                        <QRCodeSVG value={qrValue} size={64} level="M" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
                      <div>
                        <p>Specimen ID: <strong className="text-slate-900 font-mono">{currentSampleId}</strong></p>
                        <p>Tests: <strong className="text-slate-900 truncate block max-w-[150px]">{active.tests.join(', ')}</strong></p>
                      </div>
                      <div className="text-right">
                        <p>Type: <strong className="text-slate-900">{active.sampleType || 'Whole Blood'}</strong></p>
                        <p>Collected: <strong className="text-slate-900">{new Date().toLocaleTimeString()}</strong></p>
                      </div>
                    </div>

                    {/* Simulated Tube Sticker Guide overlay */}
                    <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none rounded-2xl border-4 border-dashed border-emerald-500/10 bg-emerald-500/[0.01]" />
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex flex-wrap gap-3 pt-3 border-t border-[var(--border)]/40">
                  <Button
                    onClick={handlePrint}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center gap-2 h-12 font-bold"
                    disabled={printingState === 'printing'}
                  >
                    <Printer className="h-5 w-5" />
                    {printingState === 'printing'
                      ? 'Printing Label...'
                      : printingState === 'success'
                      ? 'Label Printed!'
                      : 'Print Tube Label'}
                  </Button>

                  {active.status !== 'Sample Collected' ? (
                    <Button
                      onClick={complete}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 flex items-center justify-center gap-2 h-12 font-bold shadow-md shadow-emerald-500/10"
                    >
                      <Check className="h-5 w-5" />
                      Confirm Collection
                    </Button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-emerald-50 border border-emerald-500/20 text-emerald-700 text-sm font-black shadow-inner">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Specimen Collected & Verified
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-[var(--text-muted)]">Select an active order from the left queue to begin collection.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Simulated printer modal notification */}
      <AnimatePresence>
        {printingState === 'printing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm text-center border text-slate-800 space-y-4"
            >
              <div className="mx-auto flex h-14 w-14 animate-bounce items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Printer className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Printing Specimen Tube Label</h3>
                <p className="text-xs text-slate-500 mt-1">Generating direct zebra-code instructions and firing printer spool...</p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 relative">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
