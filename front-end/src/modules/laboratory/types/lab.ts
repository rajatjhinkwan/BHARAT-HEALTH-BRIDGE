export type LabPriority = 'Normal' | 'Urgent' | 'Emergency';
export type LabOrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Sample Collected'
  | 'Processing'
  | 'Completed'
  | 'Verified'
  | 'Critical'
  | 'Rejected';

export type LabSection =
  | 'dashboard'
  | 'incoming'
  | 'sample'
  | 'processing'
  | 'reports'
  | 'completed'
  | 'analytics';

export interface LabFieldTemplate {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'select';
  min?: number;
  max?: number;
  refLow?: number;
  refHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  refText?: string;
  normalPreset?: number;
  options?: string[];
  criticalValues?: string[];
}

export interface LabTestTemplate {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  turnaroundMinutes: number;
  sampleType: string;
  fields: LabFieldTemplate[];
}

export interface LabOrder {
  orderIndex: number;
  patientId: string;
  patientName: string;
  mrn: string;
  age?: number;
  gender?: string;
  department?: string;
  assignedDoctor?: string;
  doctorName?: string;
  tests: string[];
  status: LabOrderStatus;
  priority?: LabPriority;
  orderDate?: string;
  orderId?: string;
  encounterId?: string;
  sampleType?: string;
  sampleId?: string;
  sampleStatus?: string;
  templates?: string[];
  estimatedTurnaround?: number;
  metrics?: Record<string, Record<string, string | number>>;
  interpretation?: string[];
  isCritical?: boolean;
  criticalAlerts?: { test: string; field: string; message: string }[];
  results?: string;
  verifiedBy?: string;
  reportGeneratedAt?: string;
}

export type FieldStatus = 'empty' | 'normal' | 'low' | 'high' | 'critical' | 'invalid';

export interface FieldEvaluation {
  status: FieldStatus;
  interpretation: string | null;
}
