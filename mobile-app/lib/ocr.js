import { OCR_BASE_URL, LOCAL_OCR_BASE_URL } from '@/constants/api';

const OFFLINE_PRESCRIPTIONS_DB = [
  {
    branded: { name: 'Augmentin 625 Duo', price: '₹223.50', company: 'GSK' },
    generic: { name: 'Amoxicillin & Potassium Clavulanate', price: '₹45.00' },
    savings: '₹178.50',
    dosage: '625 mg',
    frequency: 'BD',
    duration: '5 days',
    details: 'Dosage: 625 mg · Twice daily (BD) · 5 days. For bacterial infections.',
  },
  {
    branded: { name: 'Lipitor 10mg', price: '₹180.00', company: 'Pfizer' },
    generic: { name: 'Atorvastatin', price: '₹35.00' },
    savings: '₹145.00',
    dosage: '10 mg',
    frequency: 'OD',
    duration: '30 days',
    details: 'Dosage: 10 mg · Once daily at night (OD) · 30 days. For cholesterol management.',
  },
  {
    branded: { name: 'Glycomet GP2', price: '₹110.00', company: 'USV' },
    generic: { name: 'Metformin & Glimepiride', price: '₹22.00' },
    savings: '₹88.00',
    dosage: 'GP2',
    frequency: 'BD',
    duration: '30 days',
    details: 'Dosage: GP2 · Twice daily before meals (BD) · 30 days. For Type-2 Diabetes control.',
  },
  {
    branded: { name: 'Pan-D', price: '₹155.00', company: 'Alkem' },
    generic: { name: 'Pantoprazole & Domperidone', price: '₹38.00' },
    savings: '₹117.00',
    dosage: '1 capsule',
    frequency: 'OD',
    duration: '10 days',
    details: 'Dosage: 1 capsule · Once daily before breakfast (OD) · 10 days. For acidity and reflux.',
  },
  {
    branded: { name: 'Crocin Advance', price: '₹30.00', company: 'Haleon' },
    generic: { name: 'Paracetamol 650mg', price: '₹10.00' },
    savings: '₹20.00',
    dosage: '650 mg',
    frequency: 'PRN',
    duration: '3 days',
    details: 'Dosage: 650 mg · As needed (PRN), max 4 times daily · 3 days. For fever and pain relief.',
  },
];

function buildFormData(uri, fileName, isPdf) {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName || (isPdf ? 'prescription.pdf' : 'prescription.jpg'),
    type: isPdf ? 'application/pdf' : 'image/jpeg',
  });
  return formData;
}

function getOcrEndpoints() {
  const endpoints = [];
  if (__DEV__) {
    endpoints.push({ url: LOCAL_OCR_BASE_URL, timeoutMs: 45000, label: 'local' });
  }
  if (OCR_BASE_URL && !endpoints.some((e) => e.url === OCR_BASE_URL)) {
    endpoints.push({ url: OCR_BASE_URL, timeoutMs: 90000, label: 'deployed' });
  }
  return endpoints;
}

async function wakeServer(baseUrl, timeoutMs = 15000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(`${baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
  } catch (_) {
    // Cold-start wake-up is best-effort only.
  }
}

async function tryFetchOCR(baseUrl, uri, fileName, isPdf, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/ocr`, {
      method: 'POST',
      body: buildFormData(uri, fileName, isPdf),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errText = '';
      try {
        const parsedErr = await response.json();
        errText = parsedErr.detail || parsedErr.message || '';
      } catch (_) {
        try {
          errText = await response.text();
        } catch (_) {}
      }
      throw new Error(errText || `Server responded with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export function getDeterministicOfflinePrescription(uri) {
  if (!uri) return OFFLINE_PRESCRIPTIONS_DB[0];
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    hash = (hash << 5) - hash + uri.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % OFFLINE_PRESCRIPTIONS_DB.length;
  return OFFLINE_PRESCRIPTIONS_DB[index];
}

export async function scanPrescription(uri, fileName, isPdf) {
  const endpoints = getOcrEndpoints();

  for (const endpoint of endpoints) {
    try {
      if (endpoint.label === 'deployed') {
        await wakeServer(endpoint.url);
      }
      const result = await tryFetchOCR(endpoint.url, uri, fileName, isPdf, endpoint.timeoutMs);

      if (result?.status === 'success') {
        const medicines = Array.isArray(result.data) ? result.data : [result.data];
        const valid = medicines.filter(
          (m) => m && (m.medicine || m.name) && m.medicine !== 'Could not read prescription'
        );
        if (valid.length > 0) {
          return { medicines: valid, source: 'ocr', engine: result.engine || endpoint.label };
        }
      }
    } catch (err) {
      console.warn(`[OCR] ${endpoint.label} server unavailable:`, err.message);
    }
  }

  const offline = getDeterministicOfflinePrescription(uri);
  return { medicines: [offline], source: 'offline' };
}
