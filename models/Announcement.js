import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true,
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'announcements',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

AnnouncementSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Index for createdAt for sorting
AnnouncementSchema.index({ createdAt: -1 });

export const Announcement = mongoose.model('Announcement', AnnouncementSchema);
