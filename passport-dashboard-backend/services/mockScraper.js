const Post = require('../models/Post');
const assignClusterId = require('./clusteringService');

const generateMockPosts = async () => {
  console.log('Generating simulated social media posts from Twitter/X, Instagram, Facebook, LinkedIn, and TikTok...');
  let savedCount = 0;

  // Hand-crafted high-fidelity posts from the last 24 hours
  const mockTemplates = [
    // 1. Twitter - Renewal (English)
    {
      sourceId: 'mock_tw_01',
      platform: 'Twitter',
      authorHandle: 'traveler_sam',
      originalText: 'Finally got around to submitting my passport renewal form today. The online portal was surprisingly smooth. Hopefully, the dispatch is fast!',
      postUrl: 'https://twitter.com/traveler_sam/status/1785938',
      likesCount: 142,
      commentsCount: 18,
      sharesCount: 12,
      category: 'Renewal',
      sentiment: 'Positive',
      summary: 'User successfully submitted their passport renewal form online, praising the smooth portal process and hoping for fast dispatch.',
      language: 'English',
      region: 'Global',
      country: 'Global'
    },
    // 2. Twitter - Appointments (Hindi)
    {
      sourceId: 'mock_tw_02',
      platform: 'Twitter',
      authorHandle: 'amit_sharma99',
      originalText: 'पासपोर्ट अपॉइंटमेंट के लिए दिल्ली में अगले 2 महीने तक कोई स्लॉट खाली नहीं है। क्या कोई तत्काल योजना का उपयोग करने का तरीका बता सकता है? तत्काल में कितना समय लगता है?',
      postUrl: 'https://twitter.com/amit_sharma99/status/1785939',
      likesCount: 88,
      commentsCount: 34,
      sharesCount: 8,
      category: 'Appointments',
      sentiment: 'Negative',
      summary: 'User complains that there are no passport slots available in Delhi for the next 2 months and asks how Tatkal booking works.',
      language: 'Hindi',
      region: 'Delhi',
      country: 'India'
    },
    // 3. Twitter - Appointments Cluster A1 (English) - Parent post
    {
      sourceId: 'mock_tw_cluster_parent',
      platform: 'Twitter',
      authorHandle: 'delhidiaries',
      originalText: 'Unbelievable! Just booked my passport appointment slot in Delhi for tomorrow morning. Slots seem to open up around 4 PM daily. Check now!',
      postUrl: 'https://twitter.com/delhidiaries/status/1785940',
      likesCount: 310,
      commentsCount: 45,
      sharesCount: 89,
      category: 'Appointments',
      sentiment: 'Positive',
      summary: 'Delhi passport appointment slots open daily around 4 PM; user successfully booked an appointment for tomorrow.',
      language: 'English',
      region: 'Delhi',
      country: 'India'
    },
    // 4. Twitter - Appointments Cluster A2 (English) - Child 1
    {
      sourceId: 'mock_tw_cluster_child1',
      platform: 'Twitter',
      authorHandle: 'rohit_kumar',
      originalText: 'Just booked my passport appointment in Delhi for tomorrow! Pro tip: Check the portal at 4 PM, that is when new slots are released.',
      postUrl: 'https://twitter.com/rohit_kumar/status/1785941',
      likesCount: 45,
      commentsCount: 6,
      sharesCount: 12,
      category: 'Appointments',
      sentiment: 'Positive',
      summary: 'Delhi passport appointment slots open daily around 4 PM; user successfully booked an appointment for tomorrow.',
      language: 'English',
      region: 'Delhi',
      country: 'India'
    },
    // 5. Twitter - Appointments Cluster A3 (English) - Child 2
    {
      sourceId: 'mock_tw_cluster_child2',
      platform: 'Twitter',
      authorHandle: 'neha_travels',
      originalText: 'Delhi passport slots open at 4 PM every day. Just secured my appointment slot for tomorrow morning. Go check the website!',
      postUrl: 'https://twitter.com/neha_travels/status/1785942',
      likesCount: 22,
      commentsCount: 3,
      sharesCount: 4,
      category: 'Appointments',
      sentiment: 'Positive',
      summary: 'Delhi passport appointment slots open daily around 4 PM; user successfully booked an appointment for tomorrow.',
      language: 'English',
      region: 'Delhi',
      country: 'India'
    },
    // 6. Instagram - Personal Experience (German)
    {
      sourceId: 'mock_ig_01',
      platform: 'Instagram',
      authorHandle: 'globetrotter_clara',
      originalText: 'Mein neuer Reisepass ist da! Nach nur 10 Tagen Wartezeit konnte ich ihn heute im Rathaus abholen. Jetzt kann die Weltreise kommen! 😍✈️ #passport #happy',
      postUrl: 'https://instagram.com/p/C67GdhSj',
      likesCount: 1205,
      commentsCount: 92,
      sharesCount: 15,
      category: 'Personal Experiences',
      sentiment: 'Positive',
      summary: 'Creator is happy about receiving their new German passport in just 10 days, ready for their upcoming world travel.',
      language: 'German',
      region: 'Global',
      country: 'Germany'
    },
    // 7. Instagram - Travel Issues (Punjabi)
    {
      sourceId: 'mock_ig_02',
      platform: 'Instagram',
      authorHandle: 'singh_travels',
      originalText: 'ਮੈਂ ਆਪਣੇ ਪਾਸਪੋਰਟ ਰੀਨਿਊਲ ਲਈ ਜਲੰਧਰ ਕੇਂਦਰ ਵਿੱਚ ਅਪਲਾਈ ਕੀਤਾ ਸੀ। ਪੁਲਿਸ ਵੈਰੀਫਿਕੇਸ਼ਨ ਵਿੱਚ ਬਹੁਤ ਦੇਰੀ ਹੋ ਰਹੀ ਹੈ ਅਤੇ ਅਧਿਕਾਰੀ ਬਿਨਾਂ ਵਜ੍ਹਾ ਤੰਗ ਕਰ ਰਹੇ ਹਨ। ਕੀ ਕੋਈ ਹੱਲ ਹੈ?',
      postUrl: 'https://instagram.com/p/C67GdhSk',
      likesCount: 340,
      commentsCount: 110,
      sharesCount: 42,
      category: 'Travel Issues',
      sentiment: 'Negative',
      summary: 'User complains of severe police verification delays in Jalandhar for their passport renewal and asks for solutions.',
      language: 'Punjabi',
      region: 'Jalandhar',
      country: 'India'
    },
    // 8. Facebook - Renewal (Spanish)
    {
      sourceId: 'mock_fb_01',
      platform: 'Facebook',
      authorHandle: 'carlos_viajes',
      originalText: 'Hola amigos. ¿Alguien sabe cuánto tiempo tarda la renovación del pasaporte en Madrid actualmente? Tengo un vuelo programado para dentro de 4 semanas y temo que no llegue a tiempo.',
      postUrl: 'https://facebook.com/carlos/posts/1029384',
      likesCount: 42,
      commentsCount: 28,
      sharesCount: 3,
      category: 'Renewal',
      sentiment: 'Neutral',
      summary: 'User asks how long passport renewal takes in Madrid, expressing anxiety about an upcoming flight in 4 weeks.',
      language: 'Spanish',
      region: 'Madrid',
      country: 'Spain'
    },
    // 9. Facebook - Scams/Fraud (English)
    {
      sourceId: 'mock_fb_02',
      platform: 'Facebook',
      authorHandle: 'consumer_watchdog',
      originalText: 'WARNING: Several fake websites claiming to schedule passport appointments in Mumbai are charging Rs. 3000 as "booking fees". Remember, appointments can only be booked on the official passportindia.gov.in portal. Don\'t fall for agents!',
      postUrl: 'https://facebook.com/watchdog/posts/1029385',
      likesCount: 520,
      commentsCount: 84,
      sharesCount: 231,
      category: 'Scams/Fraud',
      sentiment: 'Negative',
      summary: 'Consumer warning about fraudulent passport websites in Mumbai charging fake booking fees, reminding users to use the official website.',
      language: 'English',
      region: 'Mumbai',
      country: 'India'
    },
    // 10. LinkedIn - Government Announcements (English)
    {
      sourceId: 'mock_li_01',
      platform: 'LinkedIn',
      authorHandle: 'sharmila_devi_officer',
      originalText: 'We are pleased to announce the launch of 5 new Post Office Passport Seva Kendras (POPSK) in regional zones to ease the renewal appointment load. This will double our daily processing capacity. Our focus remains on citizen-centric government services.',
      postUrl: 'https://linkedin.com/posts/sharmila_devi_officer-9382',
      likesCount: 1420,
      commentsCount: 110,
      sharesCount: 75,
      category: 'Government Announcements',
      sentiment: 'Positive',
      summary: 'Official announces the launch of 5 new Post Office Passport Seva Kendras (POPSK) to increase daily renewal capacities.',
      language: 'English',
      region: 'Global',
      country: 'India'
    },
    // 11. TikTok - Personal Experiences (French)
    {
      sourceId: 'mock_tk_01',
      platform: 'TikTok',
      authorHandle: 'travel_hacks_fr',
      originalText: 'Rendez-vous pour mon passeport français obtenu en 2 jours seulement grâce à ce site gouvernemental! La procédure en ligne est super rapide maintenant. #passeport #france #traveltips',
      postUrl: 'https://tiktok.com/@travel_hacks_fr/video/839482',
      likesCount: 28400,
      commentsCount: 540,
      sharesCount: 1200,
      category: 'Personal Experiences',
      sentiment: 'Positive',
      summary: 'Creator shares a TikTok video showing how they got a French passport appointment in 2 days using the new fast online process.',
      language: 'French',
      region: 'Global',
      country: 'France'
    },
    // 12. TikTok - Visa / Travel Issues (Japanese)
    {
      sourceId: 'mock_tk_02',
      platform: 'TikTok',
      authorHandle: 'tokyo_nomad',
      originalText: '日本のパスポートの更新、オンライン申請がめっちゃ楽になってる！マイナカードがあれば窓口に行くのが1回だけで済むよ。海外旅行行く人は早めに準備しておこう！🇯🇵✈️ #パスポート #旅行',
      postUrl: 'https://tiktok.com/@tokyo_nomad/video/839483',
      likesCount: 15600,
      commentsCount: 320,
      sharesCount: 780,
      category: 'Personal Experiences',
      sentiment: 'Positive',
      summary: 'Japanese creator highlights the convenience of online passport renewal with the MyNumber card, requiring only one physical visit.',
      language: 'Japanese',
      region: 'Tokyo',
      country: 'Japan'
    },
    // 13. Twitter - Gibberish Keyboard Smash (Blocked Spam 1)
    {
      sourceId: 'mock_tw_gibberish_1',
      platform: 'Twitter',
      authorHandle: 'bot_acc_482',
      originalText: 'asdasdasd asdfghjkl passport qwerty renewal hgfdsa zxcvbnm slot empty slots',
      postUrl: 'https://twitter.com/bot_acc_482/status/1785949',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isGibberish: true,
      category: 'Uncategorized',
      sentiment: 'Neutral',
      summary: 'Nonsensical word list and keyboard smash.',
      language: 'English',
      region: 'Global',
      country: 'Global'
    },
    // 14. Instagram - Agent Spam/Scam (Blocked Spam 2)
    {
      sourceId: 'mock_ig_spam_2',
      platform: 'Instagram',
      authorHandle: 'fast_passports_agents',
      originalText: '🚨🚨🚨 GET PASSPORT IN 24 HOURS! NO APPOINTMENTS REQUIRED! TATKAL OR REGULAR. 100% LEGAL & REAL DOCUMENTS. WHATSAPP US AT +91-9999999999 NOW! CHEAP FEES! 🚨🚨🚨',
      postUrl: 'https://instagram.com/p/C67GdhSaa',
      likesCount: 2,
      commentsCount: 0,
      sharesCount: 0,
      isGibberish: true,
      category: 'Scams/Fraud',
      sentiment: 'Negative',
      summary: 'Spam agent advertisement offering fake passport services within 24 hours on WhatsApp.',
      language: 'English',
      region: 'Global',
      country: 'India'
    },
    // 15. Twitter - Travel Issues (Arabic)
    {
      sourceId: 'mock_tw_06',
      platform: 'Twitter',
      authorHandle: 'arabian_voyager',
      originalText: 'أواجه مشكلة كبيرة في تجديد جواز سفري. المواعيد مغلقة تماماً في القنصلية، ورحلتي بعد أسبوعين. هل من حل استثنائي؟ 😭😭 #جواز_سفر #تجديد',
      postUrl: 'https://twitter.com/arabian_voyager/status/1785943',
      likesCount: 75,
      commentsCount: 42,
      sharesCount: 10,
      category: 'Travel Issues',
      sentiment: 'Negative',
      summary: 'User complains of severe difficulties renewing passport due to fully booked consular appointments, with travel scheduled in two weeks.',
      language: 'Arabic',
      region: 'Global',
      country: 'Global'
    },
    // 16. Facebook - News (Chinese)
    {
      sourceId: 'mock_fb_04',
      platform: 'Facebook',
      authorHandle: 'beijing_news_official',
      originalText: '【国家移民管理局：即日起恢复实行内地居民办理赴港澳旅游签注“全国通办”】根据政策，内地居民可向全国任一公安机关出入境管理窗口申请办理往来港澳通行证及签注。这将极大便利民众出行。',
      postUrl: 'https://facebook.com/beijing_news/posts/203948',
      likesCount: 890,
      commentsCount: 145,
      sharesCount: 320,
      category: 'News',
      sentiment: 'Positive',
      summary: 'National Immigration Administration announces nationwide travel endorsement services for HK/Macau passes, easing travel requirements.',
      language: 'Chinese',
      region: 'Beijing',
      country: 'China'
    },
    // 17. Twitter - Visa (Russian)
    {
      sourceId: 'mock_tw_07',
      platform: 'Twitter',
      authorHandle: 'dmitry_travel',
      originalText: 'Получил загранпаспорт нового образца на 10 лет! Оформлял через Госуслуги, пошлина со скидкой. Всё заняло ровно месяц, очереди в МФЦ не было вообще.',
      postUrl: 'https://twitter.com/dmitry_travel/status/1785944',
      likesCount: 110,
      commentsCount: 12,
      sharesCount: 3,
      category: 'Personal Experiences',
      sentiment: 'Positive',
      summary: 'User is happy to receive their new 10-year biometric passport in Russia via Gosuslugi portal in exactly one month.',
      language: 'Russian',
      region: 'Moscow',
      country: 'Russia'
    },
    // 18. LinkedIn - Visa / Travel Issues (English)
    {
      sourceId: 'mock_li_02',
      platform: 'LinkedIn',
      authorHandle: 'john_doe_consultant',
      originalText: 'Important update for professionals traveling from India to Canada: The Visa Processing time is now reduced to 25 days due to automated document verification processes. Make sure your passport has at least 6 months validity from travel date!',
      postUrl: 'https://linkedin.com/posts/john-doe-92834',
      likesCount: 650,
      commentsCount: 42,
      sharesCount: 112,
      category: 'Visa',
      sentiment: 'Positive',
      summary: 'Consultant shares updates on Canadian visa processing times reducing to 25 days, reminding travelers of the 6-month passport validity rule.',
      language: 'English',
      region: 'Global',
      country: 'India'
    },
    // 19. Twitter - Tatkal (English)
    {
      sourceId: 'mock_tw_08',
      platform: 'Twitter',
      authorHandle: 'pavan_k',
      originalText: 'Shoutout to the Jalandhar Passport Office! Applied under Tatkal yesterday morning, police verification finished in the evening, passport dispatched today. Outstanding speed!',
      postUrl: 'https://twitter.com/pavan_k/status/1785945',
      likesCount: 198,
      commentsCount: 22,
      sharesCount: 15,
      category: 'Tatkal',
      sentiment: 'Positive',
      summary: 'User praises the Jalandhar Passport Office for an extremely fast Tatkal process, getting dispatch within 24 hours of application.',
      language: 'English',
      region: 'Jalandhar',
      country: 'India'
    },
    // 20. Twitter - Travel Issues (English)
    {
      sourceId: 'mock_tw_09',
      platform: 'Twitter',
      authorHandle: 'airline_sufferer',
      originalText: 'Stuck at London Heathrow because my passport got slightly wet and the barcode won\'t scan. Airline won\'t let me board my connection. Devastated. Anyone had this happen?',
      postUrl: 'https://twitter.com/airline_sufferer/status/1785946',
      likesCount: 420,
      commentsCount: 195,
      sharesCount: 48,
      category: 'Travel Issues',
      sentiment: 'Negative',
      summary: 'Traveler is stuck at London Heathrow Airport because a wet passport barcode will not scan, preventing boarding.',
      language: 'English',
      region: 'London',
      country: 'UK'
    }
  ];

  try {
    for (let template of mockTemplates) {
      // Randomize timestamps in the last 24 hours
      const randomTimeOffset = Math.floor(Math.random() * 20 * 60 * 60 * 1000) + 10 * 60 * 1000; // 10 mins to 20 hours ago
      const postedAt = new Date(Date.now() - randomTimeOffset);

      // Determine parent/child clustering dynamically on insertion
      let clusterId = null;
      
      // If it is child 1 or 2, we search for parent in DB or link it
      if (template.sourceId === 'mock_tw_cluster_child1' || template.sourceId === 'mock_tw_cluster_child2') {
        const parentPost = await Post.findOne({ sourceId: 'mock_tw_cluster_parent' });
        if (parentPost) {
          clusterId = parentPost._id;
        }
      }

      const postData = {
        ...template,
        postedAt,
        clusterId: clusterId || null
      };

      await Post.updateOne(
        { sourceId: postData.sourceId },
        { $set: postData }, // Overwrite sets values completely for mocks
        { upsert: true }
      );
      savedCount++;
    }

    console.log(`Mock scraper completed. Seeded/updated ${savedCount} high-fidelity posts.`);
  } catch (error) {
    console.error('Error generating mock posts:', error.message);
  }
};

module.exports = generateMockPosts;
