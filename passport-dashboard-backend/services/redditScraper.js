const axios = require('axios');
const Post = require('../models/Post');
const processPostText = require('./nlpService');
const assignClusterId = require('./clusteringService');

// Delay helper function to respect API limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scrapeReddit = async () => {
  console.log('Starting Reddit scrape for passport posts...');
  try {
    const response = await axios.get('https://www.reddit.com/search.json?q=passport&sort=new&t=day&limit=15', {
      headers: { 'User-Agent': 'PassportDashboardBot/1.0' }
    });

    if (!response.data || !response.data.data || !response.data.data.children) {
      console.log('No posts returned from Reddit API.');
      return;
    }

    const posts = response.data.data.children;
    let savedCount = 0;

    for (let item of posts) {
      const postData = item.data;
      const rawText = `${postData.title}\n\n${postData.selftext || ''}`.trim();

      console.log(`Analyzing Reddit post: ${postData.title.substring(0, 40)}...`);
      const nlpData = await processPostText(rawText);

      // We still assign cluster ID for non-gibberish posts
      let clusterId = null;
      if (!nlpData.isGibberish) {
        clusterId = await assignClusterId(nlpData.summary);
      }

      // Calculate engagement
      const likes = postData.ups || 0;
      const comments = postData.num_comments || 0;
      const shares = Math.floor((postData.score || 0) / 4);
      const engagement = likes + (comments * 2) + (shares * 3);

      const newPost = {
        sourceId: `reddit_${postData.id}`,
        platform: 'Reddit',
        authorHandle: postData.author || 'reddit_user',
        originalText: rawText,
        postUrl: `https://www.reddit.com${postData.permalink}`,
        postedAt: new Date(postData.created_utc * 1000),
        
        // Engagement
        likesCount: likes,
        commentsCount: comments,
        sharesCount: shares,
        engagement: engagement,

        // NLP analysis
        isGibberish: nlpData.isGibberish,
        category: nlpData.category || 'Uncategorized',
        sentiment: nlpData.sentiment || 'Neutral',
        summary: nlpData.summary || 'No summary available.',
        language: nlpData.language || 'English',
        region: nlpData.region || 'Global',
        country: nlpData.country || 'Global',
        
        clusterId: clusterId 
      };

      try {
        await Post.updateOne(
          { sourceId: newPost.sourceId },
          { $setOnInsert: newPost },
          { upsert: true }
        );
        savedCount++;
      } catch (dbError) {
        console.error('Error saving post to DB:', dbError.message);
      }

      // Pause for 1.5 seconds before processing next post to prevent hitting rate limits
      await delay(1500); 
    }

    console.log(`Reddit scrape complete. Saved/updated ${savedCount} posts.`);
  } catch (error) {
    console.error('Error fetching data from Reddit:', error.message);
  }
};

module.exports = scrapeReddit;