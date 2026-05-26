require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const Post = require('./models/Post');

// Import scraper services
const scrapeReddit = require('./services/redditScraper');
const scrapeYouTube = require('./services/youtubeScraper');
const generateMockPosts = require('./services/mockScraper');
const translateText = require('./services/translationService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    // Run scraper and generator immediately once on startup to seed the database
    runAllScrapers();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Orchestrated Scraping Routine
const runAllScrapers = async () => {
  console.log('Running unified scraping process...');
  try {
    await Promise.allSettled([
      scrapeReddit(),
      scrapeYouTube(),
      generateMockPosts()
    ]);
    console.log('Unified scraping run complete.');
  } catch (err) {
    console.error('Error during scheduled scrape run:', err);
  }
};

// --- CRON JOBS ---
// Schedule all scrapers to run every 2 hours
cron.schedule('0 */2 * * *', () => {
  console.log('Running scheduled scrapers (2-hour interval)...');
  runAllScrapers();
});

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Passport Dashboard API is running smooth.' });
});

// --- ADVANCED SEARCH & FILTERED FEED ENDPOINT ---
app.get('/api/posts', async (req, res) => {
  try {
    const { search, platform, category, sentiment, language, country, isGibberish, sortBy, sortOrder } = req.query;

    const query = {};

    // Gibberish Filter (active feed vs spam bin)
    query.isGibberish = isGibberish === 'true';

    // Platform Filter
    if (platform && platform !== 'All') {
      query.platform = platform;
    }

    // Category Filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sentiment Filter
    if (sentiment && sentiment !== 'All') {
      query.sentiment = sentiment;
    }

    // Language Filter
    if (language && language !== 'All') {
      query.language = language;
    }

    // Country/Region Filter
    if (country && country !== 'All') {
      query.country = country;
    }

    // Keyword Search across original content, author handle, and AI summary
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { originalText: searchRegex },
        { authorHandle: searchRegex },
        { summary: searchRegex }
      ];
    }

    // Sorting parameters
    const sort = {};
    const field = sortBy === 'engagement' ? 'engagement' : 'postedAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    sort[field] = order;

    const posts = await Post.find(query)
                            .sort(sort)
                            .limit(100); // Larger limit for dynamic scrolling

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// --- TRANSLATION ENDPOINT ---
app.post('/api/translate', async (req, res) => {
  const { postId, targetLanguage } = req.body;

  if (!postId || !targetLanguage) {
    return res.status(400).json({ success: false, message: 'postId and targetLanguage are required.' });
  }

  try {
    // 1. Find the post in the database
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    // 2. Check if we already translated this post into this language
    if (post.translations && post.translations.has(targetLanguage)) {
      return res.status(200).json({ 
        success: true, 
        translatedText: post.translations.get(targetLanguage),
        cached: true 
      });
    }

    // 3. If not cached, call the Gemini Translation Service
    console.log(`Translating post ${postId} to ${targetLanguage}...`);
    const translatedText = await translateText(post.originalText, targetLanguage);

    // 4. Save the new translation to the database
    post.translations.set(targetLanguage, translatedText);
    await post.save();

    // 5. Send it back to the client
    res.status(200).json({ 
      success: true, 
      translatedText,
      cached: false 
    });

  } catch (error) {
    console.error('Translation Route Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during translation.' });
  }
});

// --- CLUSTERED THREADS ENDPOINT (WITH FILTERS) ---
app.get('/api/clusters', async (req, res) => {
  try {
    const { search, platform, category, sentiment, language, country, isGibberish, sortBy, sortOrder } = req.query;

    const matchStage = { 
      clusterId: null, // Only fetch parent posts
      isGibberish: isGibberish === 'true'
    };

    // Platform Filter
    if (platform && platform !== 'All') {
      matchStage.platform = platform;
    }

    // Category Filter
    if (category && category !== 'All') {
      matchStage.category = category;
    }

    // Sentiment Filter
    if (sentiment && sentiment !== 'All') {
      matchStage.sentiment = sentiment;
    }

    // Language Filter
    if (language && language !== 'All') {
      matchStage.language = language;
    }

    // Country Filter
    if (country && country !== 'All') {
      matchStage.country = country;
    }

    // Search keyword
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStage.$or = [
        { originalText: searchRegex },
        { authorHandle: searchRegex },
        { summary: searchRegex }
      ];
    }

    // Sorting
    const sortStage = {};
    const field = sortBy === 'engagement' ? 'engagement' : 'postedAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortStage[field] = order;

    // Aggregation pipeline to join child posts
    const clusteredPosts = await Post.aggregate([
      { $match: matchStage },
      { $sort: sortStage },
      {
        $lookup: {
          from: "posts", // Name of the collection in DB
          localField: "_id",
          foreignField: "clusterId",
          as: "thread" // Children list
        }
      },
      { $limit: 50 }
    ]);

    res.status(200).json({
      success: true,
      count: clusteredPosts.length,
      data: clusteredPosts
    });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// --- STATS / AGGREGATION ENDPOINT FOR CHARTS ---
app.get('/api/stats', async (req, res) => {
  try {
    const totalActive = await Post.countDocuments({ isGibberish: false });
    const totalGibberish = await Post.countDocuments({ isGibberish: true });

    // Platform counts
    const platformCounts = await Post.aggregate([
      { $match: { isGibberish: false } },
      { $group: { _id: "$platform", count: { $sum: 1 } } }
    ]);

    // Category counts
    const categoryCounts = await Post.aggregate([
      { $match: { isGibberish: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // Sentiment counts
    const sentimentCounts = await Post.aggregate([
      { $match: { isGibberish: false } },
      { $group: { _id: "$sentiment", count: { $sum: 1 } } }
    ]);

    // Country counts
    const countryCounts = await Post.aggregate([
      { $match: { isGibberish: false, country: { $ne: 'Global' } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalActive,
        totalGibberish,
        platforms: platformCounts,
        categories: categoryCounts,
        sentiments: sentimentCounts,
        countries: countryCounts
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// --- MANUAL SCRAPE TRIGGER ENDPOINT ---
app.post('/api/scrape/trigger', async (req, res) => {
  console.log('Manual scraping run triggered...');
  try {
    await runAllScrapers();
    res.status(200).json({ 
      success: true, 
      message: 'Scrape completed successfully across all networks.' 
    });
  } catch (error) {
    console.error('Manual scraping error:', error);
    res.status(500).json({ success: false, message: 'Scraping failed.' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;