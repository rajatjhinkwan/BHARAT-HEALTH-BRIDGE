import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import EditableField from '../components/EditableField';
import TagInput from '../components/TagInput';
import { useDoctorProfile } from '../context/DoctorProfileContext';
import { personalSchema } from '../utils/validation';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }));
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'].map((v) => ({ value: v, label: v }));

export default function PersonalSection() {
  const { doctor, saveSection, updateLocal } = useDoctorProfile();
  const personal = doctor?.personal || {};

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: personal.fullName || '',
      gender: personal.gender || '',
      age: personal.age || '',
      dateOfBirth: personal.dateOfBirth ? new Date(personal.dateOfBirth).toISOString().split('T')[0] : '',
      bloodGroup: personal.bloodGroup || '',
      bio: personal.bio || '',
      languages: personal.languages || [],
    },
    resolver: yupResolver(personalSchema),
  });

  const languages = watch('languages');
  const bio = watch('bio');
  const onSave = async (data) => {
    await saveSection({ personal: { ...data, dateOfBirth: data.dateOfBirth || undefined } });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setValue(name, value);
    updateLocal((d) => ({
      ...d,
      personal: { ...d.personal, [name]: value },
    }));
  };

  return (
    <motion.div
      className="dhp-section-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="dhp-section-header">
        <h2><User size={20} /> Personal Information</h2>
        <button type="button" className="dhp-btn dhp-btn-primary" onClick={handleSubmit(onSave)}>
          Save Section (auto-sync)
        </button>
      </div>
      <form onSubmit={handleSubmit(onSave)} className="dhp-form-grid">
        <EditableField label="Full Name" name="fullName" value={watch('fullName')} onChange={onChange} error={errors.fullName?.message} />
        <EditableField label="Gender" name="gender" value={watch('gender')} onChange={onChange} options={[{ value: '', label: 'Select' }, ...GENDERS]} />
        <EditableField label="Age" name="age" type="number" value={watch('age')} onChange={onChange} error={errors.age?.message} />
        <EditableField label="Date of Birth" name="dateOfBirth" type="date" value={watch('dateOfBirth')} onChange={onChange} />
        <EditableField label="Blood Group" name="bloodGroup" value={watch('bloodGroup')} onChange={onChange} options={[{ value: '', label: 'Select' }, ...BLOOD_GROUPS]} />
        <EditableField label="Profile Bio" name="bio" value={bio} onChange={onChange} rows={4} maxLength={500} className="full-width" error={errors.bio?.message} />
        <div className="dhp-field full-width">
          <label>Languages Spoken</label>
          <TagInput tags={languages} onChange={(langs) => { setValue('languages', langs); updateLocal((d) => ({ ...d, personal: { ...d.personal, languages: langs } })); }} />
        </div>
      </form>
    </motion.div>
  );
}
