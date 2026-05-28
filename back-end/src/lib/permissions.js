export function getWorkflowContext(user) {
  const role = (user.role || '').toUpperCase();
  const department = user.department || user.assignedWard || '';
  
  let dashboard = '/patient';
  let queueScope = 'self';
  let workflowAccess = 'portal';
  
  const permissions = {
    canViewEMR: false,
    canEditPrescription: false,
    canCreateReferral: false,
    canAccessBilling: false,
    canManageStaff: false,
    canConfigureOT: false,
    canViewAuditLogs: false,
    canDispenseMeds: false,
    canUploadLabReports: false,
    canUploadRadiologyReports: false,
    canRecordVitals: false,
    canAdministerMeds: false,
    canAssignBeds: false,
    canRegisterPatient: false,
    canBookAppointment: false,
    canGenerateTokens: false,
    canViewSelfHistory: false
  };

  if (['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ADMIN', 'MEDICAL_DIRECTOR'].includes(role)) {
    dashboard = '/admin';
    queueScope = 'global';
    workflowAccess = 'all';
    Object.assign(permissions, {
      canViewEMR: true,
      canAccessBilling: true,
      canManageStaff: true,
      canConfigureOT: true,
      canViewAuditLogs: true,
      canUploadLabReports: true,
      canUploadRadiologyReports: true,
      canCreateReferral: true,
    });
  } else if (role === 'DOCTOR') {
    dashboard = '/doctor';
    queueScope = department || 'General Medicine';
    workflowAccess = 'clinical';
    const perms = {
      canViewEMR: true,
      canEditPrescription: true,
      canCreateReferral: true,
    };
    if ((department || '').toLowerCase() === 'radiology') {
      dashboard = '/radiology';
      perms.canUploadRadiologyReports = true;
    }
    Object.assign(permissions, perms);
  } else if (role === 'NURSE') {
    dashboard = '/nurse-station';
    queueScope = department || 'General Ward';
    workflowAccess = 'ward';
    const perms = {
      canViewEMR: true,
      canRecordVitals: true,
      canAdministerMeds: true,
      canAssignBeds: true,
    };
    if ((department || '').toLowerCase() === 'radiology') {
      dashboard = '/radiology';
      perms.canUploadRadiologyReports = true;
    }
    Object.assign(permissions, perms);
  } else if (role === 'RECEPTIONIST') {
    dashboard = '/reception';
    queueScope = 'global';
    workflowAccess = 'registration';
    Object.assign(permissions, {
      canAccessBilling: true,
      canRegisterPatient: true,
      canBookAppointment: true,
      canGenerateTokens: true
    });
  } else if (['RADIOLOGY_TECH', 'RADIOLOGIST'].includes(role)) {
    dashboard = '/radiology';
    queueScope = 'radiology';
    workflowAccess = 'radiology';
    Object.assign(permissions, {
      canViewEMR: true,
      canUploadRadiologyReports: true,
    });
  } else if (['LAB_TECH', 'LAB_TECHNICIAN'].includes(role)) {
    dashboard = '/lab';
    queueScope = 'diagnostics';
    workflowAccess = 'laboratory';
    Object.assign(permissions, {
      canViewEMR: true,
      canUploadLabReports: true,
    });
  } else if (['PHARMACIST', 'PHARMACY_MANAGER'].includes(role)) {
    dashboard = '/pharmacy';
    queueScope = 'pharmacy';
    workflowAccess = 'pharmacy';
    Object.assign(permissions, {
      canAccessBilling: true,
      canDispenseMeds: true
    });
  } else if (role === 'PATIENT') {
    dashboard = '/patient';
    queueScope = 'self';
    workflowAccess = 'portal';
    Object.assign(permissions, {
      canViewSelfHistory: true,
      canBookAppointment: true
    });
  }

  return {
    role,
    department,
    permissions,
    dashboard,
    queueScope,
    workflowAccess
  };
}
