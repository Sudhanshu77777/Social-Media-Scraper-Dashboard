const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Map frontend language names to standard ISO 639-1 codes
const languageMap = {
  'English': 'en',
  'Hindi': 'hi',
  'Punjabi': 'pa',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Arabic': 'ar',
  'Chinese': 'zh-CN',
  'Russian': 'ru',
  'Japanese': 'ja'
};

const translateText = async (text, targetLanguage) => {
  try {
    if (!genAI) {
      throw new Error('Gemini API not initialized');
    }

    console.log(`Using Gemini to translate to ${targetLanguage}...`);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a professional translator. Translate the following social media post into ${targetLanguage}.
      Provide ONLY the translated text in your response, with no introductory words, markdown, or explanations.
      
      Original Text: "${text}"
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
    
  } catch (error) {
    console.warn(`Gemini translation failed: ${error.message}. Falling back to Google Web Translate API...`);
    try {
      const langCode = languageMap[targetLanguage] || 'en';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (response.data && response.data[0]) {
        // The API returns translation lines in response.data[0]
        const translatedSegments = response.data[0].map(item => item[0]);
        const translatedResult = translatedSegments.join('').trim();
        console.log(`Successfully translated text to ${targetLanguage} using Google API.`);
        return translatedResult;
      }
      throw new Error('Invalid translation payload from Google Translate API');
    } catch (fallbackError) {
      console.error('Translation Fallback also failed:', fallbackError.message);
      // Absolute fallback to simulated translation tag
      return `[Translation to ${targetLanguage}]: ${text}`;
    }
  }
};

module.exports = translateText;