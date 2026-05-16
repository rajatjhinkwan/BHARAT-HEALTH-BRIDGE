import mongoose from 'mongoose'

const familyMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: {
      type: String,
      enum: ['Father', 'Mother', 'Child', 'Grandfather', 'Self', 'Wife'],
      required: true,
    },
    status: { type: String, enum: ['good', 'due', 'alert', 'caregiver'], required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model('FamilyMember', familyMemberSchema)
