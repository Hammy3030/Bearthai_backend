import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Support both Number (single choice) and Array (multiple choice)
    required: true
  },
  isMultipleChoice: {
    type: Boolean,
    default: false
  },
  explanation: {
    type: String
  },
  imageUrl: {
    type: String
  },
  audioUrl: {
    type: String
  },
  orderIndex: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true,
  collection: 'questions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

QuestionSchema.virtual('id').get(function() {
  return this._id.toString();
});

export const Question = mongoose.model('Question', QuestionSchema);
