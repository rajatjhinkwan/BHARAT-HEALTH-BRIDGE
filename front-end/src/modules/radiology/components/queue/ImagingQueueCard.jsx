import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Stethoscope, Scan, User, Check, Play, FileText, Monitor } from 'lucide-react';
import { StatusChip } from '../../../laboratory/components/shared/StatusChip';
import { Button } from '../../../laboratory/components/ui/button';
import { Card, CardContent } from '../../../laboratory/components/ui/card';
import { cn } from '../../../laboratory/lib/utils';
import { patchRadiologyOrder } from '../../api/radiologyApi';
import { useRadiologyStore } from '../../store/radiologyStore';

const STEPS = [
  { status: 'Pending', label: 'Ordered' },
  { status: 'Accepted', label: 'Accepted' },
  { status: 'In Progress', label: 'Scanning' },
  { status: 'Awaiting Report', label: 'Reading' },
  { status: 'Completed', label: 'Reported' },
];

function stepIndex(status) {
  if (['Pending', 'Rejected'].includes(status)) return 0;
  if (status === 'Accepted' || status === 'Scheduled') return 1;
  if (status === 'In Progress') return 2;
  if (status === 'Awaiting Report') return 3;
  if (['Completed', 'Verified', 'Critical'].includes(status)) return 4;
  return 0;
}

const priorityBadge = {
  Emergency: 'bg-red-100 text-red-700 border-red-200',
  Urgent: 'bg-amber-100 text-amber-700 border-amber-200',
  Normal: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function ImagingQueueCard({ order, index = 0, onAction, compact, machines = [] }) {
  const { selectOrder, pushActivity, setSection } = useRadiologyStore();
  const [loadingAction, setLoadingAction] = useState(null);
  const currentIdx = stepIndex(order.status);
  const ps = priorityBadge[order.priority] || priorityBadge.Normal;

  const update = async (actionName, body) => {
    setLoadingAction(actionName);
    try {
      await patchRadiologyOrder(order.patientId, order.orderIndex, body);
      pushActivity(`${order.patientName}: ${body.status || 'updated'}`, body.isCritical ? 'critical' : 'info');
      onAction?.();
    } catch (e) {
      console.error(e);
      alert('Action failed. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className={cn(
          'overflow-hidden transition-all hover:shadow-[var(--shadow-md)] border-l-4 border-l-sky-500',
          order.isCritical && 'rad-critical-pulse border-l-red-500'
        )}
      >
        <CardContent className={cn('space-y-4 p-5', compact && 'p-4')}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--text-muted)]" />
                <h3 className="text-lg font-bold text-[var(--text-main)]">{order.patientName}</h3>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {order.mrn}
                {order.tokenNumber && (
                  <span className="ml-2 font-mono text-sky-600 font-semibold">· {order.tokenNumber}</span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold uppercase', ps)}>
                {order.priority || 'Normal'}
              </span>
              <StatusChip status={order.status} />
            </div>
          </div>

          {!compact && (
            <div className="relative my-2 flex items-center justify-between px-2 py-3 bg-[var(--surface-hover)]/30 rounded-xl border border-[var(--border)]/40">
              {STEPS.map((step, i) => {
                const active = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step.status} className="flex flex-col items-center flex-1 z-10">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                        active ? 'border-sky-500 bg-sky-500 text-white' : 'border-[var(--border)] text-[var(--text-muted)]'
                      )}
                    >
                      {active && i < currentIdx ? <Check className="h-3 w-3" /> : i + 1}
                    </div>
                    <span className={cn('mt-1 text-[9px] font-semibold uppercase', isCurrent && 'text-sky-600')}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-xl bg-sky-50/50 border border-sky-100 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sky-600 border border-sky-100">
                <Scan className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-main)]">
                  {order.type} — {order.bodyPart || 'Study'}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {order.modalityName || order.type}
                  {order.accessionNumber && ` · ${order.accessionNumber}`}
                </div>
              </div>
            </div>
            {order.clinicalQuestion && (
              <p className="mt-2 text-xs text-[var(--text-muted)] border-t border-sky-100 pt-2">
                <strong>Clinical question:</strong> {order.clinicalQuestion}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              <span className="truncate">{order.orderedBy || order.assignedDoctor || '—'}</span>
            </div>
            <div className="truncate">From: {order.referringDepartment || order.department || 'OPD'}</div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              TAT ~{order.estimatedTurnaround || 60}m
            </div>
            {order.machineName && (
              <div className="flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5" />
                {order.machineName}
              </div>
            )}
          </div>

          {!compact && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]/40">
              {order.status === 'Pending' && (
                <>
                  <Button
                    size="sm"
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                    disabled={!!loadingAction}
                    onClick={() =>
                      update('accept', {
                        status: 'Accepted',
                        performedBy: 'Radiology',
                        timelineNote: 'Imaging order accepted — patient queued for scan',
                      })
                    }
                  >
                    {loadingAction === 'accept' ? 'Accepting…' : 'Accept & Queue'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!!loadingAction}
                    onClick={() =>
                      update('reject', {
                        status: 'Rejected',
                        rejectedReason: 'Order rejected by radiology',
                      })
                    }
                  >
                    Reject
                  </Button>
                </>
              )}

              {(order.status === 'Accepted' || order.status === 'Scheduled') && (
                <div className="w-full space-y-2">
                  {machines.length > 0 && (
                    <select
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      defaultValue={order.machineCode || ''}
                      onChange={(e) => {
                        const m = machines.find((x) => x.machineCode === e.target.value);
                        if (m) {
                          update('schedule', {
                            status: 'Scheduled',
                            machineCode: m.machineCode,
                            machineName: m.name,
                          });
                        }
                      }}
                    >
                      <option value="">Assign machine…</option>
                      {machines.map((m) => (
                        <option key={m._id} value={m.machineCode}>
                          {m.name} — {m.location}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    disabled={!!loadingAction}
                    onClick={() =>
                      update('start', {
                        status: 'In Progress',
                        performedBy: 'Technologist',
                        timelineNote: 'Patient in scanner — study acquisition started',
                      })
                    }
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {loadingAction === 'start' ? 'Starting…' : 'Start Scan'}
                  </Button>
                </div>
              )}

              {order.status === 'In Progress' && (
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  disabled={!!loadingAction}
                  onClick={() =>
                    update('complete-scan', {
                      status: 'Awaiting Report',
                      performedBy: 'Technologist',
                      timelineNote: 'Scan completed — awaiting radiologist report',
                    })
                  }
                >
                  {loadingAction === 'complete-scan' ? 'Saving…' : 'Scan Complete → Send to Radiologist'}
                </Button>
              )}

              {order.status === 'Awaiting Report' && (
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  onClick={() => {
                    selectOrder(order.patientId, order.orderIndex);
                    setSection('reports');
                  }}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Enter Radiology Report
                </Button>
              )}

              {['Completed', 'Verified', 'Critical'].includes(order.status) && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    selectOrder(order.patientId, order.orderIndex);
                    setSection('reports');
                  }}
                >
                  View / Print Report
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
