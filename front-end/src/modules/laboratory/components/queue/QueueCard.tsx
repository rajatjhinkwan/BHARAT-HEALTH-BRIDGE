import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Stethoscope, TestTube, User, Check, AlertCircle, Play, FileText, Droplet } from 'lucide-react';
import { formatDistanceToNow } from '../../lib/dateFormat';
import type { LabOrder } from '../../types/lab';
import { priorityStyles } from '../../lib/formEngine';
import { StatusChip } from '../shared/StatusChip';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { patchLabOrder } from '../../api/labApi';
import { useLabStore, orderKey } from '../../store/labStore';

interface Props {
  order: LabOrder;
  index?: number;
  onAction?: () => void;
  compact?: boolean;
}

const STEPS_LIST = [
  { status: 'Pending', label: 'Ordered' },
  { status: 'Accepted', label: 'Accepted' },
  { status: 'Sample Collected', label: 'Sampled' },
  { status: 'Processing', label: 'In Lab' },
  { status: 'Completed', label: 'Reported' },
];

const getStepIndex = (status: string) => {
  if (['Pending', 'Rejected'].includes(status)) return 0;
  if (status === 'Accepted') return 1;
  if (status === 'Sample Collected') return 2;
  if (status === 'Processing') return 3;
  if (['Completed', 'Verified', 'Critical'].includes(status)) return 4;
  return 0;
};

export function QueueCard({ order, index = 0, onAction, compact }: Props) {
  const { selectOrder, pushActivity, setSection } = useLabStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const ps = priorityStyles(order.priority);
  const currentIdx = getStepIndex(order.status);

  const update = async (actionName: string, body: Record<string, unknown>) => {
    setLoadingAction(actionName);
    try {
      if (!order.patientId.startsWith('mock')) {
        await patchLabOrder(order.patientId, order.orderIndex, body);
      }
      pushActivity(
        `${order.patientName}: ${body.status || 'updated'}`,
        body.status === 'Critical' ? 'critical' : 'info'
      );
      onAction?.();
    } catch (e) {
      console.error(e);
      alert('Action failed, please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className={cn(
          'overflow-hidden transition-all hover:shadow-[var(--shadow-md)] border-l-4',
          ps.border,
          order.isCritical && 'lab-critical-pulse border-red-500'
        )}
        style={{ boxShadow: order.priority === 'Emergency' ? ps.glow : undefined }}
      >
        <CardContent className={cn('space-y-4 p-5', compact && 'p-4')}>
          {/* Header Block */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">
                  {order.patientName}
                </h3>
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)] mt-0.5">
                {order.mrn} · {order.age}y {order.gender}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-extrabold tracking-wide uppercase', ps.badge)}>
                {order.priority || 'Normal'}
              </span>
              <StatusChip status={order.status} />
            </div>
          </div>

          {/* Workflow Timeline */}
          {!compact && (
            <div className="relative my-4 flex items-center justify-between px-2 pt-2 pb-1 bg-[var(--surface-hover)]/30 rounded-xl p-3 border border-[var(--border)]/40">
              <div className="absolute left-6 right-6 top-6 h-0.5 bg-[var(--border)]" />
              <div
                className="absolute left-6 h-0.5 bg-[var(--primary)] transition-all duration-300"
                style={{
                  width: `calc(${(currentIdx / 4) * 100}% - ${currentIdx === 4 ? '12px' : '0px'})`,
                  right: 'auto',
                }}
              />
              {STEPS_LIST.map((stepItem, i) => {
                const active = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={stepItem.status} className="relative z-10 flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300 bg-[var(--surface)]',
                        active
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                          : 'border-[var(--border)] text-[var(--text-muted)]',
                        isCurrent && 'scale-115 ring-4 ring-[var(--primary-light)] ring-offset-0'
                      )}
                    >
                      {active && i < currentIdx ? <Check className="h-3 w-3" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        'mt-1.5 text-[9px] font-semibold uppercase tracking-wider transition-colors',
                        isCurrent ? 'font-bold text-[var(--primary)]' : 'text-[var(--text-muted)]'
                      )}
                    >
                      {stepItem.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm rounded-xl border border-[var(--border)]/40 bg-[var(--background)] p-3">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Stethoscope className="h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span className="truncate font-medium">{order.assignedDoctor || order.doctorName || '—'}</span>
            </div>
            <div className="font-semibold text-[var(--text-main)] truncate">{order.department || 'OPD'}</div>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Clock className="h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span>{order.orderDate ? formatDistanceToNow(order.orderDate) : 'Just now'}</span>
            </div>
            <div className="font-medium text-[var(--text-muted)]">
              TAT Target: <span className="text-[var(--text-main)] font-semibold">~{order.estimatedTurnaround || 60}m</span>
            </div>
          </div>

          {/* Test Panels */}
          <div className="rounded-xl bg-[var(--primary-light)]/20 border border-[var(--primary)]/10 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              <TestTube className="h-4 w-4" />
              Requested Investigations
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {order.tests.map((t) => (
                <li
                  key={t}
                  className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--text-main)] shadow-sm"
                >
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--text-muted)] font-medium pt-2 border-t border-[var(--border)]/30">
              <span>Specimen: <strong className="text-[var(--text-main)]">{order.sampleType || 'Blood'}</strong></span>
              {order.sampleId && (
                <span>Vial ID: <strong className="font-mono text-[var(--primary)]">{order.sampleId}</strong></span>
              )}
            </div>
          </div>

          {/* Action Footer */}
          {!compact && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]/40">
              {order.status === 'Pending' && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 flex-1 justify-center"
                    disabled={loadingAction !== null}
                    onClick={() =>
                      update('accept', {
                        status: 'Accepted',
                        timelineNote: 'Order accepted by laboratory and queued for sample collection',
                      })
                    }
                  >
                    {loadingAction === 'accept' ? 'Accepting...' : 'Accept Order'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-red-500/30 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold flex items-center gap-1.5"
                    disabled={loadingAction !== null}
                    onClick={() =>
                      update('reject', {
                        status: 'Rejected',
                        rejectedReason: 'Rejected by pathology lab (duplicate or incorrect request)',
                        timelineNote: 'Order rejected by laboratory staff',
                      })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-50"
                    disabled={loadingAction !== null}
                    onClick={() =>
                      update('priority', {
                        priority: order.priority === 'Emergency' ? 'Normal' : 'Emergency',
                      })
                    }
                  >
                    {order.priority === 'Emergency' ? 'Mark Normal' : 'Mark Urgent'}
                  </Button>
                </>
              )}

              {order.status === 'Accepted' && (
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1.5 w-full justify-center"
                  disabled={loadingAction !== null}
                  onClick={() => {
                    const sampleId = `SMP-${Date.now().toString(36).toUpperCase()}`;
                    update('collect', {
                      status: 'Sample Collected',
                      sampleStatus: 'Collected',
                      sampleId,
                      collectionCompletedAt: new Date().toISOString(),
                      timelineNote: `Specimen collected. Label ID: ${sampleId}`,
                    }).then(() => {
                      setSection('sample');
                    });
                  }}
                >
                  <Droplet className="h-4 w-4" />
                  {loadingAction === 'collect' ? 'Registering...' : 'Collect Specimen / Print Label'}
                </Button>
              )}

              {order.status === 'Sample Collected' && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex items-center justify-center gap-1.5 border-teal-500/20 text-teal-600 hover:bg-teal-50 font-semibold"
                    onClick={() => {
                      setSection('sample');
                    }}
                  >
                    Verify & Print Label
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-1.5"
                    disabled={loadingAction !== null}
                    onClick={() => {
                      update('process', {
                        status: 'Processing',
                        processingStartedAt: new Date().toISOString(),
                        timelineNote: 'Specimen verified and loaded into hematology/chemistry analyzer',
                      }).then(() => {
                        selectOrder(order.patientId, order.orderIndex);
                        setSection('reports');
                      });
                    }}
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    {loadingAction === 'process' ? 'Starting...' : 'Start Processing'}
                  </Button>
                </div>
              )}

              {order.status === 'Processing' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 w-full justify-center shadow-[0_0_12px_rgba(37,99,235,0.15)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => {
                    selectOrder(order.patientId, order.orderIndex);
                    setSection('reports');
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Enter Test Results
                </Button>
              )}

              {['Completed', 'Verified', 'Critical'].includes(order.status) && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 w-full justify-center shadow-sm"
                  onClick={() => {
                    selectOrder(order.patientId, order.orderIndex);
                    setSection('reports');
                    setTimeout(() => {
                      window.print();
                    }, 400);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Print Finalized Lab Report
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
