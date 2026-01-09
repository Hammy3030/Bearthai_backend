import mongoose from 'mongoose';

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PRE_TEST', 'POST_TEST', 'NORMAL'],
    required: true,
    index: true
  },
  timeLimit: {
    type: Number
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    index: true
  },
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
  isActive: {
    type: Boolean,
    default: true
  },
  passingScore: {
    type: Number,
    default: 60
  }
}, {
  timestamps: true,
  collection: 'tests',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

TestSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const Test = mongoose.model('Test', TestSchema);
