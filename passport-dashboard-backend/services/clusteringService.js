const stringSimilarity = require('string-similarity');
const Post = require('../models/Post');

const assignClusterId = async (newSummary) => {
  try {
    // 1. Fetch posts from the last 48 hours that are "parents" (meaning they don't have a clusterId)
    const recentParents = await Post.find({
      clusterId: null, // Only compare against root posts
      isGibberish: false,
      postedAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } 
    });

    // If there are no recent posts, this new post is obviously a new parent
    if (recentParents.length === 0) return null;

    // 2. Extract just the summaries into an array
    const parentSummaries = recentParents.map(post => post.summary || "");

    // 3. Compare the new summary against all parent summaries
    const matchResults = stringSimilarity.findBestMatch(newSummary, parentSummaries);
    const bestMatch = matchResults.bestMatch;

    // 4. Threshold Logic: If it's a 65% match or higher, group it!
    // You can tweak this 0.65 number later depending on how strict you want the grouping
    if (bestMatch.rating > 0.65) {
      const matchedParentPost = recentParents[matchResults.bestMatchIndex];
      console.log(`🔗 Clustered! Matched with rating: ${(bestMatch.rating * 100).toFixed(1)}%`);
      return matchedParentPost._id;
    }

    // If no match is strong enough, return null (it becomes a new parent)
    return null;

  } catch (error) {
    console.error('Clustering Error:', error.message);
    return null; // Fail gracefully
  }
};

module.exports = assignClusterId;