import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  type: {
    type: String,
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
    default: 'INFO'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  collection: 'notifications',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

NotificationSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Index for createdAt for sorting
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
