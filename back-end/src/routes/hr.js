import { Router } from 'express';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { authenticate, validatePermission } from '../middleware/auth.js';

const router = Router();

const STAFF_ROLES = new Set([
  'doctor',
  'nurse',
  'receptionist',
  'lab_tech',
  'pharmacist',
  'pharmacy_manager',
  'inventory_manager',
  'hospital_admin',
  'super_admin',
  'medical_director',
  'admin',
]);

const ROLE_LABELS = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  lab_tech: 'Lab Technician',
  pharmacist: 'Pharmacist',
  pharmacy_manager: 'Pharmacy Manager',
  inventory_manager: 'Inventory Manager',
  hospital_admin: 'Hospital Admin',
  super_admin: 'Super Admin',
  medical_director: 'Medical Director',
  admin: 'Administrator',
};

const DEFAULT_SHIFT = {
  doctor: '09:00 AM',
  nurse: '06:00 AM',
  receptionist: '09:30 AM',
  lab_tech: '09:00 AM',
  pharmacist: '09:00 AM',
  pharmacy_manager: '09:00 AM',
  inventory_manager: '09:00 AM',
  hospital_admin: '08:30 AM',
  super_admin: '08:30 AM',
};

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function formatRole(role) {
  return ROLE_LABELS[role] || role?.replace(/_/g, ' ') || 'Staff';
}

function formatTimeIN() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatLeaveDates(start, end) {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const s = new Date(start).toLocaleDateString('en-IN', opts);
  const e = new Date(end).toLocaleDateString('en-IN', opts);
  return s === e ? s : `${s} – ${e}`;
}

async function getStaffUsers() {
  return User.find({
    employeeId: { $exists: true, $ne: null, $ne: '' },
    role: { $in: [...STAFF_ROLES] },
  })
    .select('name employeeId role department specialization assignedWard')
    .sort({ department: 1, name: 1 })
    .lean();
}

async function ensureTodayAttendance() {
  const date = todayKey();
  const staff = await getStaffUsers();
  for (const user of staff) {
    const existing = await Attendance.findOne({ employeeId: user.employeeId, date });
    if (!existing) {
      await Attendance.create({
        employeeId: user.employeeId,
        userId: user._id,
        date,
        status: 'not_arrived',
        shiftStart: DEFAULT_SHIFT[user.role] || '09:00 AM',
        timeIn: '',
      });
    }
  }
}

async function seedLeaveRequestsIfEmpty() {
  const count = await LeaveRequest.countDocuments();
  if (count > 0) return;

  const staff = await getStaffUsers();
  const byId = Object.fromEntries(staff.map((s) => [s.employeeId, s]));
  const samples = [
    { employeeId: 'DOC-CARD-123', leaveType: 'Casual Leave', daysFromNow: 14, span: 2, status: 'pending' },
    { employeeId: 'NUR-ICU-123', leaveType: 'Sick Leave', daysFromNow: -5, span: 1, status: 'approved' },
    { employeeId: 'LAB-123', leaveType: 'Earned Leave', daysFromNow: 20, span: 5, status: 'pending' },
    { employeeId: 'REC-123', leaveType: 'Casual Leave', daysFromNow: 8, span: 0, status: 'pending' },
  ];

  for (const sample of samples) {
    const user = byId[sample.employeeId];
    if (!user) continue;
    const start = new Date();
    start.setDate(start.getDate() + sample.daysFromNow);
    const end = new Date(start);
    end.setDate(end.getDate() + sample.span);
    await LeaveRequest.create({
      employeeId: user.employeeId,
      userId: user._id,
      staffName: user.name,
      role: formatRole(user.role),
      department: user.department || user.assignedWard || '',
      leaveType: sample.leaveType,
      startDate: start,
      endDate: end,
      status: sample.status,
    });
  }
}

const hrGuard = [authenticate, validatePermission('canManageStaff')];

router.get('/attendance/today', hrGuard, async (req, res) => {
  try {
    await ensureTodayAttendance();
    const date = todayKey();
    const [staff, records] = await Promise.all([
      getStaffUsers(),
      Attendance.find({ date }).lean(),
    ]);
    const byEmployee = Object.fromEntries(records.map((r) => [r.employeeId, r]));

    const personnel = staff.map((user) => {
      const att = byEmployee[user.employeeId];
      const status = att?.status || 'not_arrived';
      return {
        id: user.employeeId,
        name: user.name,
        dept: user.department || user.assignedWard || 'General',
        role: formatRole(user.role),
        status:
          status === 'present'
            ? 'Present'
            : status === 'leave'
              ? 'Leave'
              : status === 'late'
                ? 'Late'
                : 'Not Arrived',
        shiftStart: att?.shiftStart || DEFAULT_SHIFT[user.role] || '09:00 AM',
        timeIn: att?.timeIn || (status === 'present' || status === 'late' ? '--' : '--'),
        details: att?.leaveReason || '',
        returnDate: att?.returnDate || '',
      };
    });

    res.json({ date, personnel });
  } catch (error) {
    console.error('HR attendance error:', error);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
});

router.patch('/attendance/:employeeId', hrGuard, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, leaveReason, returnDate } = req.body;
    const date = todayKey();

    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    const statusMap = {
      Present: 'present',
      'Not Arrived': 'not_arrived',
      Leave: 'leave',
      Late: 'late',
    };
    const mapped = statusMap[status] || status;
    if (!['present', 'not_arrived', 'leave', 'late'].includes(mapped)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const update = {
      status: mapped,
      updatedBy: req.user.name || req.user.employeeId,
    };

    if (mapped === 'present' || mapped === 'late') {
      update.timeIn = formatTimeIN();
    } else if (mapped === 'not_arrived') {
      update.timeIn = '';
    }

    if (mapped === 'leave') {
      update.leaveReason = leaveReason || 'Leave';
      update.returnDate = returnDate || '';
      update.timeIn = '';
    } else {
      update.leaveReason = '';
      update.returnDate = '';
    }

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date },
      {
        $set: {
          ...update,
          userId: user._id,
          shiftStart: DEFAULT_SHIFT[user.role] || '09:00 AM',
        },
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true, record });
  } catch (error) {
    console.error('HR update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

router.get('/leave-requests', hrGuard, async (req, res) => {
  try {
    await seedLeaveRequestsIfEmpty();
    const requests = await LeaveRequest.find().sort({ createdAt: -1 }).lean();
    res.json(
      requests.map((lr) => ({
        id: lr._id.toString(),
        name: lr.staffName,
        role: lr.role,
        type: lr.leaveType,
        dates: formatLeaveDates(lr.startDate, lr.endDate),
        status: lr.status,
        department: lr.department,
        employeeId: lr.employeeId,
      }))
    );
  } catch (error) {
    console.error('HR leave list error:', error);
    res.status(500).json({ error: 'Failed to load leave requests' });
  }
});

router.patch('/leave-requests/:id', hrGuard, async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve or reject' });
    }

    const lr = await LeaveRequest.findById(req.params.id);
    if (!lr) return res.status(404).json({ error: 'Leave request not found' });

    lr.status = action === 'approve' ? 'approved' : 'rejected';
    lr.reviewedBy = req.user.name || req.user.employeeId;
    lr.reviewedAt = new Date();
    await lr.save();

    if (action === 'approve') {
      const today = todayKey();
      const start = new Date(lr.startDate);
      const end = new Date(lr.endDate);
      const cursor = new Date(start);
      while (cursor <= end) {
        const date = cursor.toISOString().split('T')[0];
        if (date >= today) {
          await Attendance.findOneAndUpdate(
            { employeeId: lr.employeeId, date },
            {
              $set: {
                userId: lr.userId,
                status: 'leave',
                leaveReason: lr.leaveType,
                returnDate: new Date(lr.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
                timeIn: '',
                shiftStart: '--',
                updatedBy: req.user.name || req.user.employeeId,
              },
            },
            { upsert: true }
          );
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    res.json({
      ok: true,
      request: {
        id: lr._id.toString(),
        status: lr.status,
      },
    });
  } catch (error) {
    console.error('HR leave review error:', error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

router.get('/roster-summary', hrGuard, async (req, res) => {
  try {
    const staff = await getStaffUsers();
    const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    res.json({
      month,
      staffCount: staff.length,
      shiftTypes: ['Morning', 'Evening', 'Night'],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load roster summary' });
  }
});

export default router;
