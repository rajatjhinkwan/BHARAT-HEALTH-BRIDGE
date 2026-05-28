import React from 'react';
import { useForm } from 'react-hook-form';
import { Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import EditableField from '../components/EditableField';
import TagInput from '../components/TagInput';
import { useDoctorProfile } from '../context/DoctorProfileContext';

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Dermatology', 'Gynecology', 'Emergency Medicine', 'Radiology', 'Oncology',
];

export default function ProfessionalSection() {
  const { doctor, saveSection, updateLocal } = useDoctorProfile();
  const pro = doctor?.professional || {};

  const { watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      medicalRegistrationNumber: pro.medicalRegistrationNumber || '',
      doctorId: pro.doctorId || '',
      specialization: pro.specialization || '',
      superSpecialization: pro.superSpecialization || '',
      experienceYears: pro.experienceYears || '',
      consultationFees: pro.consultationFees || '',
      hospitalName: pro.hospitalName || 'Bharat Health Bridge',
      department: pro.department || '',
      qualifications: pro.qualifications || [],
      degrees: pro.degrees || [],
      specializations: pro.specializations || [],
    },
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setValue(name, value);
    updateLocal((d) => ({
      ...d,
      professional: { ...d.professional, [name]: value },
    }));
  };

  const onSave = async (data) => {
    await saveSection({
      professional: {
        ...data,
        experienceYears: Number(data.experienceYears) || 0,
        consultationFees: Number(data.consultationFees) || 0,
      },
    });
  };

  return (
    <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dhp-section-header">
        <h2><Briefcase size={20} /> Professional Details</h2>
        <button type="button" className="dhp-btn dhp-btn-primary" onClick={handleSubmit(onSave)}>Save Section</button>
      </div>
      <form className="dhp-form-grid">
        <EditableField label="Medical Registration No." name="medicalRegistrationNumber" value={watch('medicalRegistrationNumber')} onChange={onChange} />
        <EditableField label="Doctor ID" name="doctorId" value={watch('doctorId')} onChange={onChange} disabled />
        <EditableField
          label="Primary Specialization"
          name="specialization"
          value={watch('specialization')}
          onChange={onChange}
          options={[{ value: '', label: 'Select' }, ...SPECIALIZATIONS.map((s) => ({ value: s, label: s }))]}
        />
        <EditableField label="Super Specialization" name="superSpecialization" value={watch('superSpecialization')} onChange={onChange} />
        <EditableField label="Experience (Years)" name="experienceYears" type="number" value={watch('experienceYears')} onChange={onChange} />
        <EditableField label="Consultation Fees (₹)" name="consultationFees" type="number" value={watch('consultationFees')} onChange={onChange} />
        <EditableField label="Hospital / Clinic" name="hospitalName" value={watch('hospitalName')} onChange={onChange} />
        <EditableField label="Department" name="department" value={watch('department')} onChange={onChange} />
        <div className="dhp-field full-width">
          <label>Qualifications</label>
          <TagInput
            tags={watch('qualifications')}
            onChange={(q) => { setValue('qualifications', q); updateLocal((d) => ({ ...d, professional: { ...d.professional, qualifications: q } })); }}
            placeholder="e.g. MBBS, MD"
          />
        </div>
        <div className="dhp-field full-width">
          <label>Degrees</label>
          <TagInput
            tags={watch('degrees')}
            onChange={(deg) => { setValue('degrees', deg); updateLocal((d) => ({ ...d, professional: { ...d.professional, degrees: deg } })); }}
          />
        </div>
        <div className="dhp-field full-width">
          <label>Additional Specializations</label>
          <TagInput
            tags={watch('specializations')}
            onChange={(s) => { setValue('specializations', s); updateLocal((d) => ({ ...d, professional: { ...d.professional, specializations: s } })); }}
          />
        </div>
      </form>
    </motion.div>
  );
}
