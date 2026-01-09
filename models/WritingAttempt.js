import mongoose from 'mongoose';

const WritingAttemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  targetWord: {
    type: String,
    required: true,
    trim: true
  },
  imagePath: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  imageData: {
    type: String, // Base64 encoded image data
    required: false
  },
  detectedText: {
    type: String,
    default: ''
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  explanation: {
    type: String,
    default: ''
  },
  method: {
    type: String,
    enum: ['Ensemble', 'Classification', 'EasyOCR', 'YOLO', 'Claude', 'Gemini', 'ML'],
    default: 'Claude'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for faster queries
WritingAttemptSchema.index({ studentId: 1, createdAt: -1 });
WritingAttemptSchema.index({ studentId: 1, targetWord: 1 });
WritingAttemptSchema.index({ studentId: 1, isCorrect: 1 });

export const WritingAttempt = mongoose.model('WritingAttempt', WritingAttemptSchema);
