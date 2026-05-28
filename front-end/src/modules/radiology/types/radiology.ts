export type ImagingPriority = 'Normal' | 'Urgent' | 'Emergency';

export type ImagingOrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Scheduled'
  | 'In Progress'
  | 'Awaiting Report'
  | 'Completed'
  | 'Verified'
  | 'Critical'
  | 'Rejected';

export type RadiologySection =
  | 'dashboard'
  | 'incoming'
  | 'scanning'
  | 'reports'
  | 'completed'
  | 'analytics';

export interface ImagingOrder {
  orderIndex: number;
  patientId: string;
  patientName: string;
  mrn: string;
  age?: number;
  gender?: string;
  department?: string;
  assignedDoctor?: string;
  type: string;
  bodyPart?: string;
  clinicalQuestion?: string;
  status: ImagingOrderStatus | string;
  priority?: ImagingPriority;
  orderDate?: string;
  orderId?: string;
  tokenNumber?: string;
  queueId?: string;
  machineCode?: string;
  machineName?: string;
  contrast?: boolean;
  orderedBy?: string;
  findings?: Record<string, string>;
  results?: string;
  isCritical?: boolean;
  criticalFinding?: string;
  estimatedTurnaround?: number;
  modalityName?: string;
  referringDepartment?: string;
  accessionNumber?: string;
  verifiedBy?: string;
}
