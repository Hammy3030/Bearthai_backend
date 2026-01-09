import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  school: {
    type: String
  },
  name: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'teachers',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

TeacherSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const Teacher = mongoose.model('Teacher', TeacherSchema);
