import { normalizeDepartment } from './departments.js';

export function todayDateString() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const yyyy = istDate.getFullYear();
  const mm = String(istDate.getMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Case-insensitive department match for legacy queue rows. */
export function departmentQuery(dept) {
  const canonical = normalizeDepartment(dept);
  const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: new RegExp(`^${escaped}$`, 'i') };
}

export function emitQueueUpdated(req, department) {
  const io = req.app.get('io');
  if (!io) return;
  const dept = normalizeDepartment(department);
  io.emit('queueUpdated', { department: dept });
}

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function sortQueueByPriority(nodes) {
  return [...nodes].sort((a, b) => {
    const pA = PRIORITY_ORDER[a.priorityLevel] ?? 4;
    const pB = PRIORITY_ORDER[b.priorityLevel] ?? 4;
    return pA - pB || new Date(a.createdAt) - new Date(b.createdAt);
  });
}

export async function enrichQueueNodes(nodes, Patient) {
  if (!nodes.length) return [];
  const ids = nodes.map((n) => n.patientId).filter(Boolean);
  const patients = await Patient.find({ _id: { $in: ids } }).select(
    'age gender symptoms priority patientName mrn'
  );
  const byId = new Map(patients.map((p) => [p._id.toString(), p]));

  return nodes.map((n) => {
    const doc = n.toObject ? n.toObject() : { ...n };
    const p = byId.get(doc.patientId?.toString());
    if (p) {
      doc.age = p.age;
      doc.gender = p.gender;
      doc.symptoms = doc.symptoms || p.symptoms;
      doc.patientPriority = p.priority;
    }
    return doc;
  });
}

export function isDoctorRole(role) {
  const r = (role || '').toLowerCase();
  return ['doctor', 'medical_director'].includes(r);
}
