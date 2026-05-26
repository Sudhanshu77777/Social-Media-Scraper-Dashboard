const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // --- Raw Data from Scraper ---
  sourceId: { 
    type: String, 
    required: true, 
    unique: true // Prevents duplicate entries from repeated scraping
  },
  platform: { 
    type: String, 
    enum: ['Twitter', 'Reddit', 'Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok', 'Other'],
    required: true 
  },
  authorHandle: { type: String, required: true },
  originalText: { type: String, required: true },
  postUrl: { type: String, required: true },
  postedAt: { type: Date, required: true }, // When the user actually posted it

  // --- Engagement Metrics ---
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 }, // likes + comments*2 + shares*3 or simple total

  // --- Processed Data from NLP/LLM ---
  isGibberish: { type: Boolean, default: false },
  category: { 
    type: String, 
    enum: ['Application', 'Renewal', 'Appointments', 'Tatkal', 'Visa', 'Travel Issues', 'Government Announcements', 'Scams/Fraud', 'News', 'Personal Experiences', 'Uncategorized'],
    default: 'Uncategorized'
  },
  sentiment: { 
    type: String, 
    enum: ['Positive', 'Neutral', 'Negative'],
    default: 'Neutral'
  },
  summary: { type: String, maxlength: 500 }, // Generous limit for summary
  language: { type: String, default: 'English' }, // Original post language
  region: { type: String, default: 'Global' },   // Detected region (city, state, etc.)
  country: { type: String, default: 'Global' },  // Detected country

  clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, // Links to a parent post if duplicate/similar

  // --- Localization ---
  translations: {
    type: Map,
    of: String, // e.g., { "es": "texto en español", "hi": "हिंदी पाठ" }
    default: {}
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model('Post', postSchema);