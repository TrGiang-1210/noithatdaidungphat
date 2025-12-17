// backend/models/Translation.js
const mongoose = require('mongoose');

// Sub-schema for translation in each language
const languageTranslationSchema = new mongoose.Schema({
  value: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'ai_translated', 'human_reviewed', 'approved'],
    default: 'draft'
  },
  translatedBy: { type: String }, // 'ai' or user ID
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  lastModified: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

// Main Translation Schema
const translationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  
  // Namespace/group (e.g., 'common', 'products', 'auth')
  namespace: {
    type: String,
    required: true,
    default: 'common',
    index: true
  },
  
  // Translations for each language
  translations: {
    vi: {
      type: languageTranslationSchema,
      required: true
    },
    zh: {
      type: languageTranslationSchema,
      default: () => ({})
    }
  },
  
  // Metadata
  context: { 
    type: String,
    trim: true
  }, // Notes for translators
  
  category: { 
    type: String,
    enum: ['UI', 'email', 'notification', 'marketing', 'error', 'other'],
    default: 'other'
  },
  
  isPlural: { 
    type: Boolean, 
    default: false 
  },
  
  // Tags for organization
  tags: [{ 
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Version control
  version: { 
    type: Number, 
    default: 1 
  },
  
  history: [{
    version: Number,
    lang: String,
    oldValue: String,
    newValue: String,
    changedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    changedAt: { 
      type: Date, 
      default: Date.now 
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Compound indexes
translationSchema.index({ namespace: 1, key: 1 });
translationSchema.index({ 'translations.vi.status': 1 });
translationSchema.index({ 'translations.zh.status': 1 });
translationSchema.index({ category: 1, namespace: 1 });

// Virtual: Get completion percentage
translationSchema.virtual('completionPercentage').get(function() {
  const languages = ['vi', 'zh'];
  let completed = 0;
  
  languages.forEach(lang => {
    if (this.translations[lang]?.value && 
        this.translations[lang]?.status === 'approved') {
      completed++;
    }
  });
  
  return (completed / languages.length) * 100;
});

// Method: Get all translations for a specific language
translationSchema.statics.getByLanguage = async function(lang, namespace = null) {
  const query = {};
  if (namespace) query.namespace = namespace;
  
  const docs = await this.find(query);
  const result = {};
  
  docs.forEach(doc => {
    // Split key by dots to create nested structure
    const nestedKey = doc.key.split('.');
    let current = result;
    
    // Create nested objects
    for (let i = 0; i < nestedKey.length - 1; i++) {
      if (!current[nestedKey[i]]) {
        current[nestedKey[i]] = {};
      }
      current = current[nestedKey[i]];
    }
    
    // Set the final value
    current[nestedKey[nestedKey.length - 1]] = 
      doc.translations[lang]?.value || '';
  });
  
  return result;
};

// Method: Check if key needs AI translation
translationSchema.methods.needsAITranslation = function(lang) {
  return !this.translations[lang]?.value || 
         this.translations[lang]?.status === 'draft';
};

// Method: Update translation with history
translationSchema.methods.updateTranslation = function(lang, newValue, userId, reason = '') {
  const oldValue = this.translations[lang]?.value;
  
  // Add to history
  this.history.push({
    version: this.version,
    lang,
    oldValue,
    newValue,
    changedBy: userId,
    changedAt: new Date(),
    reason
  });
  
  // Update translation
  this.translations[lang] = {
    value: newValue,
    status: 'human_reviewed',
    reviewedBy: userId,
    lastModified: new Date()
  };
  
  this.version += 1;
  
  return this.save();
};

// Static: Get statistics by namespace
translationSchema.statics.getStatsByNamespace = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$namespace',
        total: { $sum: 1 },
        draft: {
          $sum: {
            $cond: [
              { $eq: ['$translations.zh.status', 'draft'] },
              1,
              0
            ]
          }
        },
        aiTranslated: {
          $sum: {
            $cond: [
              { $eq: ['$translations.zh.status', 'ai_translated'] },
              1,
              0
            ]
          }
        },
        reviewed: {
          $sum: {
            $cond: [
              { $eq: ['$translations.zh.status', 'human_reviewed'] },
              1,
              0
            ]
          }
        },
        approved: {
          $sum: {
            $cond: [
              { $eq: ['$translations.zh.status', 'approved'] },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

module.exports = mongoose.model('Translation', translationSchema);