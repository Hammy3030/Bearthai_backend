import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['TEACHER', 'STUDENT'],
    default: 'TEACHER',
    index: true
  },
  name: {
    type: String,
    required: true
  },
  school: {
    type: String
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpiry: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'users',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for id field
UserSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const User = mongoose.model('User', UserSchema);