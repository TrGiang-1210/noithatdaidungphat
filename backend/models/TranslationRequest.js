// backend/models/TranslationRequest.js
const mongoose = require('mongoose');

const translationRequestSchema = new mongoose.Schema({
  translationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Translation',
    required: true
  },
  
  sourceLang: { 
    type: String, 
    required: true,
    enum: ['vi', 'zh']
  },
  
  targetLang: { 
    type: String, 
    required: true,
    enum: ['vi', 'zh']
  },
  
  sourceText: { 
    type: String, 
    required: true 
  },
  
  // AI Translation result
  aiResult: { type: String },
  aiProvider: { 
    type: String, 
    enum: ['claude', 'gpt', 'google'], 
    default: 'claude' 
  },
  aiConfidence: { 
    type: Number,
    min: 0,
    max: 1
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'reviewed'],
    default: 'pending',
    index: true
  },
  
  // Human review
  humanTranslation: { type: String },
  reviewNote: { type: String },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { type: Date },
  
  // Error handling
  error: { type: String },
  retryCount: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
translationRequestSchema.index({ translationId: 1, status: 1 });
translationRequestSchema.index({ createdAt: -1 });

// Method: Mark as reviewed
translationRequestSchema.methods.markAsReviewed = function(userId, humanTranslation, note) {
  this.status = 'reviewed';
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.humanTranslation = humanTranslation;
  this.reviewNote = note;
  return this.save();
};

// Static method: Get pending requests
translationRequestSchema.statics.getPendingRequests = function(limit = 10) {
  return this.find({ status: 'pending' })
    .limit(limit)
    .sort({ createdAt: 1 });
};

module.exports = mongoose.model('TranslationRequest', translationRequestSchema);