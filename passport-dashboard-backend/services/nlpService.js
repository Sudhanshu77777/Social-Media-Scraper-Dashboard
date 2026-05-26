const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API if key is available
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Local Keyword-based Fallback Parser
const runLocalNLP = (text) => {
  const lowercaseText = text.toLowerCase();
  
  // 1. Gibberish & Spam Filter
  let isGibberish = false;
  // Rule A: Too short or too long single word with no spaces
  if (text.length < 12 && !text.includes(' ')) isGibberish = true;
  // Rule B: Repeating characters
  if (/(.)\1{5,}/.test(lowercaseText)) isGibberish = true;
  // Rule C: Spam/Fraud Agent links
  if (
    lowercaseText.includes('buy fake passport') ||
    lowercaseText.includes('novelty passport') ||
    lowercaseText.includes('whatsapp +') && (lowercaseText.includes('passport') || lowercaseText.includes('visa')) ||
    lowercaseText.includes('telegram @') && lowercaseText.includes('fake')
  ) {
    // We mark spam/fraud posts as gibberish/spam to block them, 
    // or categorise under Scams/Fraud. Let's make it gibberish for blocking unless it's a warning about a scam.
    isGibberish = true;
  }
  // Rule D: Plain keyboard smash
  if (/^[bcdfghjklmnpqrstvwxyz]{6,}$/.test(lowercaseText)) isGibberish = true;

  // 2. Language Detection
  let language = 'English';
  if (/[\u0900-\u097F]/.test(text)) {
    // Check Devangari script - could be Hindi or Marathi. We'll default to Hindi or Punjabi.
    language = 'Hindi';
  } else if (/[\u0A00-\u0A7F]/.test(text)) {
    language = 'Punjabi';
  } else if (lowercaseText.includes('pasaporte') || lowercaseText.includes('cita') || lowercaseText.includes('renovación')) {
    language = 'Spanish';
  } else if (lowercaseText.includes('passeport') || lowercaseText.includes('rendez-vous')) {
    language = 'French';
  } else if (lowercaseText.includes('reisepass') || lowercaseText.includes('termin')) {
    language = 'German';
  } else if (/[\u0600-\u06FF]/.test(text)) {
    language = 'Arabic';
  } else if (/[\u4e00-\u9fa5]/.test(text)) {
    language = 'Chinese';
  } else if (/[\u0400-\u04FF]/.test(text)) {
    language = 'Russian';
  } else if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) {
    language = 'Japanese';
  }

  // 3. Category Detection
  let category = 'Uncategorized';
  if (lowercaseText.includes('renew') || lowercaseText.includes('expire') || lowercaseText.includes('renov')) {
    category = 'Renewal';
  } else if (lowercaseText.includes('appointment') || lowercaseText.includes('slot') || lowercaseText.includes('date') || lowercaseText.includes('booking') || lowercaseText.includes('cita') || lowercaseText.includes('rendez-vous') || lowercaseText.includes('termin')) {
    category = 'Appointments';
  } else if (lowercaseText.includes('tatkal') || lowercaseText.includes('tatkaal') || lowercaseText.includes('urgent') || lowercaseText.includes('fast-track')) {
    category = 'Tatkal';
  } else if (lowercaseText.includes('visa') || lowercaseText.includes('embassy') || lowercaseText.includes('consulate') || lowercaseText.includes('vfs')) {
    category = 'Visa';
  } else if (lowercaseText.includes('delay') || lowercaseText.includes('cancel') || lowercaseText.includes('stuck') || lowercaseText.includes('lost') || lowercaseText.includes('stolen') || lowercaseText.includes('issue') || lowercaseText.includes('problem')) {
    category = 'Travel Issues';
  } else if (lowercaseText.includes('official') || lowercaseText.includes('government') || lowercaseText.includes('announces') || lowercaseText.includes('ministry') || lowercaseText.includes('mea') || lowercaseText.includes('mfa') || lowercaseText.includes('announcement')) {
    category = 'Government Announcements';
  } else if (lowercaseText.includes('scam') || lowercaseText.includes('fraud') || lowercaseText.includes('fake') || lowercaseText.includes('agent') || lowercaseText.includes('cheat')) {
    category = 'Scams/Fraud';
  } else if (lowercaseText.includes('news') || lowercaseText.includes('report') || lowercaseText.includes('headline') || lowercaseText.includes('newspaper') || lowercaseText.includes('press')) {
    category = 'News';
  } else if (lowercaseText.includes('experience') || lowercaseText.includes('finally') || lowercaseText.includes('happy') || lowercaseText.includes('got my') || lowercaseText.includes('successful') || lowercaseText.includes('thanks')) {
    category = 'Personal Experiences';
  } else if (lowercaseText.includes('apply') || lowercaseText.includes('application') || lowercaseText.includes('fresh') || lowercaseText.includes('form') || lowercaseText.includes('documents') || lowercaseText.includes('apply for')) {
    category = 'Application';
  }

  // 4. Sentiment Detection
  let sentiment = 'Neutral';
  const posWords = ['great', 'happy', 'easy', 'fast', 'thanks', 'excellent', 'smooth', 'quick', 'love', 'helpful', 'success'];
  const negWords = ['bad', 'worst', 'slow', 'delay', 'frustrated', 'scam', 'cheat', 'fail', 'stuck', 'waiting', 'angry', 'horrible', 'error', 'broken'];
  let posCount = 0;
  let negCount = 0;
  posWords.forEach(w => { if (lowercaseText.includes(w)) posCount++; });
  negWords.forEach(w => { if (lowercaseText.includes(w)) negCount++; });

  if (posCount > negCount) sentiment = 'Positive';
  else if (negCount > posCount) sentiment = 'Negative';

  // 5. Region / Country Detection
  let region = 'Global';
  let country = 'Global';

  const locations = [
    { country: 'India', regions: ['Mumbai', 'Delhi', 'Bengaluru', 'Bangalore', 'Hyderabad', 'Chennai', 'Punjab', 'Kolkata', 'Kerala', 'Chandigarh', 'Jalandhar'] },
    { country: 'USA', regions: ['New York', 'California', 'Texas', 'Washington', 'Chicago', 'San Francisco', 'Florida', 'Boston'] },
    { country: 'Canada', regions: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'] },
    { country: 'UK', regions: ['London', 'Manchester', 'Birmingham', 'Scotland'] },
    { country: 'Australia', regions: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] }
  ];

  for (let loc of locations) {
    if (lowercaseText.includes(loc.country.toLowerCase())) {
      country = loc.country;
    }
    for (let r of loc.regions) {
      if (lowercaseText.includes(r.toLowerCase())) {
        region = r;
        country = loc.country; // Set matching country too
        break;
      }
    }
  }

  // 6. Summary Generation (~30 words)
  let cleanText = text.replace(/[\n\r]+/g, ' ').trim();
  let words = cleanText.split(/\s+/);
  let summary = words.length > 25 ? words.slice(0, 25).join(' ') + '...' : cleanText;

  return {
    isGibberish,
    category,
    sentiment,
    summary,
    language,
    region,
    country
  };
};

const processPostText = async (text) => {
  try {
    if (!genAI) {
      console.log('No Gemini API key configured. Using local NLP parser fallback.');
      return runLocalNLP(text);
    }

    console.log('Calling Gemini AI for text analysis...');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Analyze the following social media post text. It is related to passports, visas, or travel.
      Return a valid JSON object matching this schema with no markdown markup:
      {
        "isGibberish": boolean (true if the post is nonsense keyboard-smash, completely spam/bot links like 'buy passport fake', repeating patterns, or not relevant to passport/visa processes),
        "category": string (must be exactly one of: 'Application', 'Renewal', 'Appointments', 'Tatkal', 'Visa', 'Travel Issues', 'Government Announcements', 'Scams/Fraud', 'News', 'Personal Experiences', or 'Uncategorized'),
        "sentiment": string (must be exactly one of: 'Positive', 'Neutral', 'Negative'),
        "summary": string (a short, concise summary of the post, around 25-30 words),
        "language": string (detected original language name, e.g., 'English', 'Hindi', 'Punjabi', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Russian', 'Japanese', or others),
        "region": string (detected city/state/region mentioned, or 'Global' if none),
        "country": string (detected country mentioned, or 'Global' if none)
      }

      Post Text: "${text.replace(/"/g, '\\"')}"
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up markdown markers if any
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(responseText);

    // Validate the response has required keys, otherwise fall back to local parser values
    const validCategories = ['Application', 'Renewal', 'Appointments', 'Tatkal', 'Visa', 'Travel Issues', 'Government Announcements', 'Scams/Fraud', 'News', 'Personal Experiences', 'Uncategorized'];
    const validSentiments = ['Positive', 'Neutral', 'Negative'];

    if (!validCategories.includes(parsed.category)) parsed.category = 'Uncategorized';
    if (!validSentiments.includes(parsed.sentiment)) parsed.sentiment = 'Neutral';
    if (typeof parsed.isGibberish !== 'boolean') parsed.isGibberish = false;

    return parsed;

  } catch (error) {
    console.error('NLP Processing Error via Gemini:', error.message);
    console.log('Falling back to local NLP parser...');
    try {
      return runLocalNLP(text);
    } catch (fallbackError) {
      console.error('Fallback NLP Error:', fallbackError.message);
      return {
        isGibberish: false,
        category: 'Uncategorized',
        sentiment: 'Neutral',
        summary: text.substring(0, 100) + '...',
        language: 'English',
        region: 'Global',
        country: 'Global'
      };
    }
  }
};

module.exports = processPostText;