import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['MATCHING', 'LINKING', 'DRAG_DROP'],
    required: true,
    index: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: true
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
  }
}, {
  timestamps: true,
  collection: 'games',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

GameSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const Game = mongoose.model('Game', GameSchema);
