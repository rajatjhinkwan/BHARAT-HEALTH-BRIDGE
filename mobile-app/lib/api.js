import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

export async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) headers.Authorization = `Bearer ${parsed.token}`;
    }
  } catch (_) {}
  return headers;
}

async function handleBypassFetch(path, options = {}) {
  // Artificial slight network delay for native feel
  await new Promise((resolve) => setTimeout(resolve, 30));

  if (path === '/patient/dashboard') {
    try {
      const stored = await SecureStore.getItemAsync('bypass_dashboard');
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    return {
      patient: {
        id: '6a11ccafeabe0dded8939815',
        patientName: 'Rahul Sharma',
        email: 'rahul.demo@bhb.in',
        phone: '+919876543210',
        dob: '12-08-1998',
        gender: 'Male',
        address: 'Dehradun, Uttarakhand',
        bloodGroup: 'O+',
        allergies: 'Peanuts, Dust',
        chronicIllness: 'Asthma',
        symptoms: 'Vitamin D, Zinc',
        emergencyContactName: 'Aarti Sharma',
        emergencyContactPhone: '+91 98765 00000',
        aadharCardId: '123456789012',
        profileImage: null
      },
      upcomingAppointments: [
        {
          id: 'apt_1',
          doctorName: 'Dr. Ramesh Chaudhary',
          appointmentDate: '2026-05-28',
          appointmentTime: '10:30 AM',
          department: 'Cardiology',
          reason: 'Routine ECG Checkup',
          status: 'CONFIRMED'
        }
      ],
      recentPrescriptions: [
        {
          id: 'pr_1',
          doctorName: 'Dr. Ramesh Chaudhary',
          date: '2026-05-15',
          diagnosis: 'Mild hypertension'
        }
      ]
    };
  }

  if (path.startsWith('/history/patient/')) {
    return [
      {
        _id: 'rec_01',
        type: 'prescription',
        title: 'Post-OPD Orthopedics Prescription',
        doctor: 'Dr. Kartikay Jhinkwan',
        hospital: 'Chamoli Badrinath Clinic',
        createdAt: '2026-05-15T10:00:00Z',
        prescriptionDetails: {
          diagnosis: 'Muscle spasm and minor swelling in lumbar region.',
          medicines: [
            { name: 'Aceclofenac 100mg', dosage: '1-0-1', duration: '5 Days' },
            { name: 'Pantocid 40mg', dosage: '1-0-0 (Empty Stomach)', duration: '5 Days' }
          ],
          notes: 'Avoid heavy lifting. Apply hot gel compresses thrice daily.'
        },
        accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
      },
      {
        _id: 'rec_02',
        type: 'lab_report',
        title: 'Complete Blood Count (CBC)',
        doctor: 'Dr. Anoop Chauhan',
        hospital: 'Karanprayag Pathology',
        createdAt: '2026-05-14T08:30:00Z',
        ocrText: 'Hemoglobin: 14.2 g/dL (Normal), RBC Count: 4.8 million/mcL (Normal), Platelets: 250,000 /mcL.',
        accessControl: { locked: true, approvedDoctors: ['Dr. Kartikay Jhinkwan'], approvedHospitals: [] }
      },
      {
        _id: 'rec_03',
        type: 'voice_note',
        title: 'Cardiology Consultation Audio',
        doctor: 'Dr. Ganesh Singh Parihar',
        hospital: 'Almora General Hospital',
        createdAt: '2026-04-12T16:45:00Z',
        voiceNoteDetails: {
          transcript: 'Normal ECG rhythm. Systolic BP 120, Diastolic 80. Recommended routine cardio screening in six months.',
          duration: 42
        },
        accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
      },
      {
        _id: 'rec_04',
        type: 'mri',
        title: 'Lumbar Spine MRI Scan',
        doctor: 'Dr. Surendra Singh Rawat',
        hospital: 'Almora Scan & Diagnostics',
        createdAt: '2026-05-13T11:20:00Z',
        ocrText: 'MRI Scan Lumbar Spine L4-L5: Mild disc bulge noted. No nerve root impingement detected.',
        accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
      },
      {
        _id: 'rec_05',
        type: 'x_ray',
        title: 'Chest PA View X-Ray',
        doctor: 'Dr. Surendra Singh Rawat',
        hospital: 'Bharat Health Bridge',
        createdAt: '2026-05-12T09:15:00Z',
        ocrText: 'Chest X-Ray: Lung fields are clear. Cardiothoracic ratio is normal. No pleural effusion or pneumothorax.',
        accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
      },
      {
        _id: 'rec_06',
        type: 'voice_note',
        title: 'Pulmonology Consultation Audio',
        doctor: 'Dr. Kartikay Jhinkwan',
        hospital: 'Chamoli Badrinath Clinic',
        createdAt: '2026-05-16T14:30:00Z',
        voiceNoteDetails: {
          transcript: 'Chest is clear. Continue taking the prescribed asthma inhaler once daily. Avoid dust triggers.',
          duration: 25
        },
        accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
      },
      {
        _id: 'rec_07',
        type: 'lab_report',
        title: 'Lipid Profile Report',
        doctor: 'Dr. Anoop Chauhan',
        hospital: 'Karanprayag Pathology',
        createdAt: '2026-05-11T10:45:00Z',
        ocrText: 'Cholesterol: 185 mg/dL (Desirable), HDL: 52 mg/dL (Normal), LDL: 110 mg/dL (Optimal), Triglycerides: 115 mg/dL.',
        accessControl: { locked: false, approvedDoctors: [], approvedHospitals: [] }
      }
    ];
  }


  if (path.startsWith('/appointments')) {
    if (options.method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      try {
        let currentDashboard = null;
        const stored = await SecureStore.getItemAsync('bypass_dashboard');
        if (stored) {
          currentDashboard = JSON.parse(stored);
        } else {
          currentDashboard = {
            patient: {
              id: '6a11ccafeabe0dded8939815',
              patientName: 'Rahul Sharma',
              email: 'rahul.demo@bhb.in',
              phone: '+919876543210',
              dob: '12-08-1998',
              gender: 'Male',
              address: 'Dehradun, Uttarakhand',
              bloodGroup: 'O+',
              allergies: 'Peanuts, Dust',
              chronicIllness: 'Asthma',
              symptoms: 'Vitamin D, Zinc',
              emergencyContactName: 'Aarti Sharma',
              emergencyContactPhone: '+91 98765 00000',
              aadharCardId: '123456789012'
            },
            upcomingAppointments: [],
            recentPrescriptions: []
          };
        }

        const newApt = {
          id: `apt_${Date.now()}`,
          doctorName: body.doctorId === 'doc_1' || body.doctorId === 1 ? 'Dr. Rahul Negi' : body.doctorId === 'doc_4' || body.doctorId === 4 ? 'Dr. Rajat Jhinkwan' : 'Dr. Suresh Rawat',
          appointmentDate: body.appointmentDate || '2026-05-28',
          appointmentTime: body.appointmentTime || '10:30 AM',
          department: body.department || 'General Medicine',
          reason: body.reason || 'Routine consultation',
          status: 'BOOKED'
        };

        currentDashboard.upcomingAppointments = [newApt, ...(currentDashboard.upcomingAppointments || [])];
        await SecureStore.setItemAsync('bypass_dashboard', JSON.stringify(currentDashboard));
      } catch (e) {
        console.warn('Bypass save appointment failed:', e);
      }
      return { success: true, message: 'Appointment booked successfully offline!' };
    }
    return [];
  }

  if (path === '/users/profile' && options.method === 'PATCH') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    try {
      let currentDashboard = null;
      const stored = await SecureStore.getItemAsync('bypass_dashboard');
      if (stored) {
        currentDashboard = JSON.parse(stored);
      } else {
        currentDashboard = {
          patient: {
            id: '6a11ccafeabe0dded8939815',
            patientName: 'Rahul Sharma',
            email: 'rahul.demo@bhb.in',
            phone: '+919876543210',
            dob: '12-08-1998',
            gender: 'Male',
            address: 'Dehradun, Uttarakhand',
            bloodGroup: 'O+',
            allergies: 'Peanuts, Dust',
            chronicIllness: 'Asthma',
            symptoms: 'Vitamin D, Zinc',
            emergencyContactName: 'Aarti Sharma',
            emergencyContactPhone: '+91 98765 00000',
            aadharCardId: '123456789012'
          },
          upcomingAppointments: [],
          recentPrescriptions: []
        };
      }

      currentDashboard.patient = {
        ...currentDashboard.patient,
        ...body,
        patientName: body.name || currentDashboard.patient.patientName,
        symptoms: body.currentMedications || currentDashboard.patient.symptoms
      };

      await SecureStore.setItemAsync('bypass_dashboard', JSON.stringify(currentDashboard));
    } catch (e) {
      console.warn('Bypass save profile failed:', e);
    }
    return { success: true, message: 'Profile updated offline!' };
  }

  if (path === '/donors/sos' && options.method === 'POST') {
    return { success: true, message: 'SOS broadcasted successfully offline!' };
  }

  return {};
}

export async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders();
  
  // Try live server connection first
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data;
    } else {
      // Fallback to bypass handler if using bypass token
      if (headers.Authorization === 'Bearer dev_bypass_token') {
        return handleBypassFetch(path, options);
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || 'Request failed');
    }
  } catch (err) {
    // If server is offline/unreachable and we have bypass token, use local mock system
    if (headers.Authorization === 'Bearer dev_bypass_token') {
      console.warn('BHB Backend Server offline. Falling back to local offline bypass:', err.message);
      return handleBypassFetch(path, options);
    }
    throw err;
  }
}

export async function getPatientDashboard() {
  return apiFetch('/patient/dashboard');
}

export async function listHospitals(params = '') {
  const base = params ? (params.startsWith('?') ? params : `?${params}`) : '';
  const sep = base ? (base.includes('?') ? '&' : '?') : '?';
  const url = `${API_BASE_URL}/hospitals${base}${sep}state=Uttarakhand&limit=200`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to load hospitals (${res.status})`);
  }
  if (!Array.isArray(data)) throw new Error('Invalid hospital response');
  return data;
}

export async function listDonors(query = '') {
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        return [
          { _id: 'd_1', name: 'Kartikay Rana', phone: '9872448447', district: 'Chamoli', city: 'Badrinath', bloodType: 'B+', verified: true, latitude: 30.74, longitude: 79.49 },
          { _id: 'd_2', name: 'Ajay Rawat', phone: '9837773381', district: 'Chamoli', city: 'Badrinath', bloodType: 'B+', verified: true, latitude: 30.743, longitude: 79.492 },
          { _id: 'd_3', name: 'Anoop Singh Rawat', phone: '9897868387', district: 'Chamoli', city: 'Badrinath', bloodType: 'B+', verified: true, latitude: 30.745, longitude: 79.491 },
          { _id: 'd_4', name: 'Saurabh Singh Negi', phone: '9764838688', district: 'Chamoli', city: 'Badrinath', bloodType: 'B+', verified: true, latitude: 30.741, longitude: 79.494 },
          { _id: 'd_5', name: 'Anoop Chauhan', phone: '9639552836', district: 'Chamoli', city: 'Karanprayag', bloodType: 'B+', verified: true, latitude: 30.25, longitude: 79.21 },
          { _id: 'd_6', name: 'Deepak Bisht', phone: '9557624375', district: 'Chamoli', city: 'Karanprayag', bloodType: 'B+', verified: true, latitude: 30.252, longitude: 79.215 },
          { _id: 'd_7', name: 'Shashank Rana', phone: '9557450816', district: 'Chamoli', city: 'Badrinath', bloodType: 'B-', verified: true, latitude: 30.742, longitude: 79.493 },
          { _id: 'd_8', name: 'Vinod Joshi', phone: '9627128777', district: 'Almora', city: 'Almora', bloodType: 'A+', verified: true, latitude: 29.58, longitude: 79.64 }
        ];
      }
    }
  } catch (_) {}

  return apiFetch(`/donors${query}`);
}

export async function getPatientHistory(patientId) {
  return apiFetch(`/history/patient/${patientId}`);
}

export async function listAppointments(patientId) {
  return apiFetch(`/appointments?patientId=${patientId}`);
}

export async function bookAppointment(body) {
  return apiFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getDoctorAvailability(doctorId, date) {
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        return {
          slots: [
            { time: '9:00 AM', available: true },
            { time: '9:30 AM', available: true },
            { time: '10:00 AM', available: false },
            { time: '10:30 AM', available: true },
            { time: '11:00 AM', available: true },
            { time: '11:30 AM', available: false },
            { time: '12:00 PM', available: true },
            { time: '12:30 PM', available: true },
            { time: '2:00 PM', available: true },
            { time: '2:30 PM', available: true },
            { time: '3:00 PM', available: false },
            { time: '3:30 PM', available: true },
            { time: '4:00 PM', available: true }
          ]
        };
      }
    }
  } catch (_) {}

  const res = await fetch(
    `${API_BASE_URL}/appointments/availability?doctorId=${encodeURIComponent(doctorId)}&date=${date}`
  );
  return res.json();
}

export async function listDoctors(department) {
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        return [
          { employeeId: 1, name: 'Dr. Anoop Chauhan', department: 'Cardiology', specialization: 'Cardiology' },
          { employeeId: 2, name: 'Dr. Ramesh Chaudhary', department: 'Cardiology', specialization: 'Cardiology' },
          { employeeId: 3, name: 'Dr. Vinod Bisht', department: 'Cardiology', specialization: 'Cardiology' },
          { employeeId: 4, name: 'Dr. Rajat Jhinkwan', department: 'Neurology', specialization: 'Neurology' },
          { employeeId: 5, name: 'Dr. Kartikay Jhinkwan', department: 'Orthopedics', specialization: 'Orthopedics' }
        ];
      }
    }
  } catch (_) {}

  const q = department ? `?department=${encodeURIComponent(department)}` : '';
  const res = await fetch(`${API_BASE_URL}/doctors${q}`);
  return res.json();
}

export async function listDepartments() {
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        return ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'ENT', 'Dermatology', 'Eye Care', 'Gastroenterology'];
      }
    }
  } catch (_) {}

  const res = await fetch(`${API_BASE_URL}/departments`);
  return res.json();
}

export async function updateProfile(body) {
  return apiFetch('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadAvatar(uri) {
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        try {
          let currentDashboard = null;
          const stored = await SecureStore.getItemAsync('bypass_dashboard');
          if (stored) {
            currentDashboard = JSON.parse(stored);
          } else {
            currentDashboard = {
              patient: {
                id: '6a11ccafeabe0dded8939815',
                patientName: 'Rahul Sharma',
                email: 'rahul.demo@bhb.in',
                phone: '+919876543210',
                dob: '12-08-1998',
                gender: 'Male',
                address: 'Dehradun, Uttarakhand',
                bloodGroup: 'O+',
                allergies: 'Peanuts, Dust',
                chronicIllness: 'Asthma',
                symptoms: 'Vitamin D, Zinc',
                emergencyContactName: 'Aarti Sharma',
                emergencyContactPhone: '+91 98765 00000',
                aadharCardId: '123456789012'
              },
              upcomingAppointments: [],
              recentPrescriptions: []
            };
          }
          currentDashboard.patient.profileImage = uri;
          await SecureStore.setItemAsync('bypass_dashboard', JSON.stringify(currentDashboard));
        } catch (e) {
          console.warn('Bypass save avatar failed:', e);
        }
        return { avatar: uri };
      }
    }
  } catch (_) {}

  const uriParts = uri.split('/');
  const filename = uriParts[uriParts.length - 1];
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image';

  const formData = new FormData();
  formData.append('avatarFile', {
    uri: uri,
    name: filename,
    type,
  });

  const headers = await getAuthHeaders();
  delete headers['Content-Type'];

  const res = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PATCH',
    body: formData,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');
  return data;
}

export async function uploadHealthCard(uri, healthCardType) {
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        try {
          let currentDashboard = null;
          const stored = await SecureStore.getItemAsync('bypass_dashboard');
          if (stored) {
            currentDashboard = JSON.parse(stored);
          } else {
            currentDashboard = {
              patient: {
                id: '6a11ccafeabe0dded8939815',
                patientName: 'Rahul Sharma',
                email: 'rahul.demo@bhb.in',
                phone: '+919876543210',
                dob: '12-08-1998',
                gender: 'Male',
                address: 'Dehradun, Uttarakhand',
                bloodGroup: 'O+',
                allergies: 'Peanuts, Dust',
                chronicIllness: 'Asthma',
                symptoms: 'Vitamin D, Zinc',
                emergencyContactName: 'Aarti Sharma',
                emergencyContactPhone: '+91 98765 00000',
                aadharCardId: '123456789012'
              },
              upcomingAppointments: [],
              recentPrescriptions: []
            };
          }
          currentDashboard.patient.healthCardImage = uri;
          currentDashboard.patient.healthCardType = healthCardType;
          await SecureStore.setItemAsync('bypass_dashboard', JSON.stringify(currentDashboard));
        } catch (e) {
          console.warn('Bypass save health card failed:', e);
        }
        return { healthCardImage: uri, healthCardType };
      }
    }
  } catch (_) {}

  const uriParts = uri.split('/');
  const filename = uriParts[uriParts.length - 1];
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image';

  const formData = new FormData();
  formData.append('healthCardFile', {
    uri: uri,
    name: filename,
    type,
  });
  formData.append('healthCardType', healthCardType);

  const headers = await getAuthHeaders();
  delete headers['Content-Type'];

  const res = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PATCH',
    body: formData,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');
  return data;
}

export async function uploadAadharCard(uri, aadharId) {
  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        try {
          let currentDashboard = null;
          const stored = await SecureStore.getItemAsync('bypass_dashboard');
          if (stored) {
            currentDashboard = JSON.parse(stored);
          } else {
            currentDashboard = {
              patient: {
                id: '6a11ccafeabe0dded8939815',
                patientName: 'Rahul Sharma',
                email: 'rahul.demo@bhb.in',
                phone: '+919876543210',
                dob: '12-08-1998',
                gender: 'Male',
                address: 'Dehradun, Uttarakhand',
                bloodGroup: 'O+',
                allergies: 'Peanuts, Dust',
                chronicIllness: 'Asthma',
                symptoms: 'Vitamin D, Zinc',
                emergencyContactName: 'Aarti Sharma',
                emergencyContactPhone: '+91 98765 00000',
                aadharCardId: '123456789012'
              },
              upcomingAppointments: [],
              recentPrescriptions: []
            };
          }
          currentDashboard.patient.aadharCardImage = uri;
          currentDashboard.patient.aadharCardId = aadharId;
          await SecureStore.setItemAsync('bypass_dashboard', JSON.stringify(currentDashboard));
        } catch (e) {
          console.warn('Bypass save aadhar failed:', e);
        }
        return { aadharCardImage: uri, aadharCardId: aadharId };
      }
    }
  } catch (_) {}

  const uriParts = uri.split('/');
  const filename = uriParts[uriParts.length - 1];
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image';

  const formData = new FormData();
  formData.append('aadharFile', {
    uri: uri,
    name: filename,
    type,
  });
  formData.append('aadharCardId', aadharId);

  const headers = await getAuthHeaders();
  delete headers['Content-Type'];

  const res = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PATCH',
    body: formData,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');
  return data;
}

export async function getLiveQueue(department) {
  if (!department) return { waiting: [], inConsultation: [], completed: [] };

  try {
    const raw = await SecureStore.getItemAsync('auth_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token === 'dev_bypass_token') {
        // Offline bypass: return realistic mock queue
        return {
          department,
          date: new Date().toISOString().split('T')[0],
          waiting: [
            { queueId: 'Q-mock-1', tokenNumber: 'GEN-001', patientName: 'Rahul Sharma', mrn: 'UHID-2026-DEMO', time: '10:00', status: 'WAITING', priorityLevel: 'LOW', symptoms: 'Routine checkup' },
            { queueId: 'Q-mock-2', tokenNumber: 'GEN-002', patientName: 'Priya Patel', mrn: 'UHID-2026-0042', time: '10:15', status: 'WAITING', priorityLevel: 'MEDIUM', symptoms: 'Fever & headache' },
            { queueId: 'Q-mock-3', tokenNumber: 'GEN-003', patientName: 'Amit Singh', mrn: 'UHID-2026-0099', time: '10:30', status: 'WAITING', priorityLevel: 'LOW', symptoms: 'Follow-up visit' },
          ],
          inConsultation: [
            { queueId: 'Q-mock-0', tokenNumber: 'GEN-000', patientName: 'Suresh Rawat', mrn: 'UHID-2026-0011', time: '09:30', status: 'IN_CONSULTATION', doctor: 'Dr. Rahul Negi', priorityLevel: 'HIGH', symptoms: 'Chest pain' },
          ],
          completed: [],
        };
      }
    }
  } catch (_) {}

  return apiFetch(`/workflow/queue/live?department=${encodeURIComponent(department)}`);
}

export async function broadcastDonorSOS(body) {
  return apiFetch('/donors/sos', { method: 'POST', body: JSON.stringify(body) });
}

