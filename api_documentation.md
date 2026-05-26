# Passport Intelligence API Documentation

This document describes the API endpoints provided by the backend service. All endpoints are hosted locally at `http://localhost:5000` by default.

---

## 1. Health Check
Checks if the backend API service is online and running.

* **Endpoint**: `/api/health`
* **Method**: `GET`
* **Headers**: `None`
* **Query Parameters**: `None`
* **Response (200 OK)**:
  ```json
  {
    "message": "Passport Dashboard API is running smooth."
  }
  ```

---

## 2. Get Social Feed (Filtered & Sorted)
Retrieves social media posts from the database based on search terms, platform origin, topic classification, sentiment scores, detected languages, and country targets.

* **Endpoint**: `/api/posts`
* **Method**: `GET`
* **Query Parameters**:
  * `search` (string): Keyword search term. Matches against post content, author handles, and AI summaries.
  * `platform` (string): Options include `Twitter`, `Reddit`, `YouTube`, `Facebook`, `Instagram`, `LinkedIn`, `TikTok`, or `All` (default).
  * `category` (string): Options include `Application`, `Renewal`, `Appointments`, `Tatkal`, `Visa`, `Travel Issues`, `Government Announcements`, `Scams/Fraud`, `News`, `Personal Experiences`, or `All` (default).
  * `sentiment` (string): Filter by `Positive`, `Neutral`, `Negative`, or `All` (default).
  * `language` (string): Filter by detected language (e.g. `English`, `Hindi`, `Spanish`).
  * `country` (string): Filter by country (e.g. `India`, `USA`, `Canada`, `UK`, `Australia`).
  * `isGibberish` (boolean string): If `true`, returns only blocked spam/gibberish posts. If `false` (default), returns active meaningful posts.
  * `sortBy` (string): Sort parameter. Options include `postedAt` (default) or `engagement`.
  * `sortOrder` (string): Order. Options include `desc` (default) or `asc`.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "6a15eb092ecaedcdbaddde74",
        "sourceId": "reddit_1tog64g",
        "platform": "Reddit",
        "authorHandle": "Paul-Van-DeDam",
        "originalText": "2027 Europa Sentinel",
        "postUrl": "https://www.reddit.com/r/AiCarArt/comments/1tog64g/2027_europa_sentinel/",
        "postedAt": "2026-05-26T18:44:41.000Z",
        "likesCount": 12,
        "commentsCount": 3,
        "sharesCount": 1,
        "engagement": 21,
        "isGibberish": false,
        "category": "Appointments",
        "sentiment": "Neutral",
        "summary": "User discusses the upcoming 2027 Europa Sentinel passport details.",
        "language": "English",
        "region": "Global",
        "country": "Global",
        "clusterId": null,
        "translations": {},
        "createdAt": "2026-05-26T18:48:41.025Z",
        "updatedAt": "2026-05-26T18:50:47.166Z"
      }
    ]
  }
  ```

---

## 3. Get Clustered Threads
Retrieves parent/root posts (posts where `clusterId` is null) matching filters, with all child (duplicate/highly-similar) posts nested inside a `thread` array.

* **Endpoint**: `/api/clusters`
* **Method**: `GET`
* **Query Parameters**: Same as `/api/posts` (search, platform, category, sentiment, language, country, sortBy, sortOrder).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "6a15eb382ecaedcdbaddde7b",
        "sourceId": "mock_tw_cluster_parent",
        "platform": "Twitter",
        "authorHandle": "delhidiaries",
        "originalText": "Unbelievable! Just booked my passport appointment slot in Delhi for tomorrow morning...",
        "postUrl": "https://twitter.com/delhidiaries/status/1785940",
        "postedAt": "2026-05-26T17:50:32.133Z",
        "likesCount": 310,
        "commentsCount": 45,
        "sharesCount": 89,
        "engagement": 667,
        "isGibberish": false,
        "category": "Appointments",
        "sentiment": "Positive",
        "summary": "Delhi passport appointment slots open daily around 4 PM; user successfully booked an appointment.",
        "language": "English",
        "region": "Delhi",
        "country": "India",
        "clusterId": null,
        "translations": {},
        "createdAt": "2026-05-26T18:49:28.448Z",
        "updatedAt": "2026-05-26T18:50:46.097Z",
        "thread": [
          {
            "_id": "6a15eb382ecaedcdbaddde7c",
            "sourceId": "mock_tw_cluster_child1",
            "platform": "Twitter",
            "authorHandle": "rohit_kumar",
            "originalText": "Just booked my passport appointment in Delhi for tomorrow! Pro tip: Check the portal at 4 PM...",
            "postUrl": "https://twitter.com/rohit_kumar/status/1785941",
            "postedAt": "2026-05-26T17:50:32.133Z",
            "likesCount": 45,
            "commentsCount": 6,
            "sharesCount": 12,
            "engagement": 93,
            "isGibberish": false,
            "category": "Appointments",
            "sentiment": "Positive",
            "summary": "Delhi passport appointment slots open daily around 4 PM; user successfully booked.",
            "language": "English",
            "region": "Delhi",
            "country": "India",
            "clusterId": "6a15eb382ecaedcdbaddde7b"
          }
        ]
      }
    ]
  }
  ```

---

## 4. Translate Post
Translates the text of a specific post into one of the 10 supported languages (English, Hindi, Punjabi, Spanish, French, German, Arabic, Chinese, Russian, Japanese). If the translation already exists in the database, it is served instantly from the cache.

* **Endpoint**: `/api/translate`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Body**:
  ```json
  {
    "postId": "6a15eb092ecaedcdbaddde74",
    "targetLanguage": "Spanish"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "translatedText": "2027 Europa Centinela",
    "cached": false
  }
  ```

---

## 5. Aggregated Statistics
Retrieves counts of active feeds, blocked spam posts, platform distributions, topical categories, and country metrics for dashboard chart visualizations.

* **Endpoint**: `/api/stats`
* **Method**: `GET`
* **Query Parameters**: `None`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalActive": 52,
      "totalGibberish": 2,
      "platforms": [
        { "_id": "Reddit", "count": 31 },
        { "_id": "Twitter", "count": 9 },
        { "_id": "YouTube", "count": 3 },
        { "_id": "Facebook", "count": 3 },
        { "_id": "Instagram", "count": 2 },
        { "_id": "LinkedIn", "count": 2 },
        { "_id": "TikTok", "count": 2 }
      ],
      "categories": [
        { "_id": "Appointments", "count": 9 },
        { "_id": "Application", "count": 6 },
        { "_id": "Renewal", "count": 3 },
        { "_id": "Travel Issues", "count": 5 },
        { "_id": "Visa", "count": 2 },
        { "_id": "Government Announcements", "count": 2 },
        { "_id": "Personal Experiences", "count": 4 },
        { "_id": "Scams/Fraud", "count": 1 },
        { "_id": "Tatkal", "count": 1 },
        { "_id": "News", "count": 3 },
        { "_id": "Uncategorized", "count": 16 }
      ],
      "sentiments": [
        { "_id": "Neutral", "count": 23 },
        { "_id": "Negative", "count": 12 },
        { "_id": "Positive", "count": 17 }
      ],
      "countries": [
        { "_id": "India", "count": 11 },
        { "_id": "Germany", "count": 1 },
        { "_id": "France", "count": 1 },
        { "_id": "Spain", "count": 1 },
        { "_id": "Russia", "count": 1 }
      ]
    }
  }
  ```

---

## 6. Manual Trigger Scrape
Orchestrates and immediately runs the scraping pipelines (Reddit scraper, YouTube RSS, and Mock platform simulator) to fetch new data from the last 24 hours.

* **Endpoint**: `/api/scrape/trigger`
* **Method**: `POST`
* **Headers**: `None`
* **Query Parameters**: `None`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Scrape completed successfully across all networks."
  }
  ```
