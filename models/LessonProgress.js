import mongoose from 'mongoose';

const LessonProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  hasPassedPreTest: {
    type: Boolean,
    default: false
  },
  hasPassedPostTest: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  activityResults: [{
    activityId: String,
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    score: Number,
    timeSpent: Number,
    submittedAt: Date
  }]
}, {
  timestamps: true,
  collection: 'lesson_progress',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

LessonProgressSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Create compound unique index
LessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export const LessonProgress = mongoose.model('LessonProgress', LessonProgressSchema);
