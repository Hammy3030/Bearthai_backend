import mongoose from 'mongoose';

const ClassroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'classrooms',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ClassroomSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const Classroom = mongoose.model('Classroom', ClassroomSchema);