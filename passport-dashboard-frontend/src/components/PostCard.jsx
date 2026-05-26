import React, { useState } from 'react';
import { Card, Button, Badge, Collapse, Form, Spinner } from 'react-bootstrap';
import { MessageCircle, Heart, Share2, Globe, ExternalLink, ShieldAlert, Sparkles, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function PostCard({ post }) {
  const [openThread, setOpenThread] = useState(false);
  const [currentText, setCurrentText] = useState(post.originalText);
  const [selectedLang, setSelectedLang] = useState('Original');
  const [translating, setTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  const languages = [
    { code: 'English', label: 'English 🇺🇸' },
    { code: 'Hindi', label: 'Hindi 🇮🇳' },
    { code: 'Punjabi', label: 'Punjabi 🇮🇳' },
    { code: 'Spanish', label: 'Spanish 🇪🇸' },
    { code: 'French', label: 'French 🇫🇷' },
    { code: 'German', label: 'German 🇩🇪' },
    { code: 'Arabic', label: 'Arabic 🇦🇪' },
    { code: 'Chinese', label: 'Chinese 🇨🇳' },
    { code: 'Russian', label: 'Russian 🇷🇺' },
    { code: 'Japanese', label: 'Japanese 🇯🇵' }
  ];

  const handleTranslate = async (langCode) => {
    if (langCode === 'Original') {
      setCurrentText(post.originalText);
      setSelectedLang('Original');
      setIsTranslated(false);
      return;
    }

    setTranslating(true);
    try {
      const response = await axios.post(`${API_BASE}/translate`, {
        postId: post._id,
        targetLanguage: langCode
      });

      if (response.data.success) {
        setCurrentText(response.data.translatedText);
        setSelectedLang(langCode);
        setIsTranslated(true);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      alert('Error translating post. Verify that the backend is running and the Gemini API key is valid.');
    } finally {
      setTranslating(false);
    }
  };

  // Relative Time helper
  const formatRelativeTime = (dateString) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Get user avatar initials
  const getInitials = (handle) => {
    if (!handle) return '?';
    const clean = handle.replace(/[^a-zA-Z0-9]/g, '');
    return clean.substring(0, 2).toUpperCase();
  };

  // Platform specific borders/accents
  const getPlatformClass = (platform) => {
    switch (platform) {
      case 'Twitter': return 'border-start border-4 border-info';
      case 'Reddit': return 'border-start border-4 border-danger';
      case 'YouTube': return 'border-start border-4 border-danger';
      case 'Facebook': return 'border-start border-4 border-primary';
      case 'Instagram': return 'border-start border-4 border-warning';
      case 'LinkedIn': return 'border-start border-4 border-primary';
      case 'TikTok': return 'border-start border-4 border-dark';
      default: return 'border-start border-4 border-secondary';
    }
  };

  return (
    <Card className={`mb-4 glass-card overflow-hidden ${getPlatformClass(post.platform)} animate-fade-in`}>
      <Card.Body className="p-4 card-body-custom">
        {/* Card Top: Author Profile & Badges */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="avatar-circle">
              {getInitials(post.authorHandle)}
            </div>
            <div>
              <div className="fw-semibold card-author-handle">@{post.authorHandle}</div>
              <div className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                <span className={`badge-platform badge-${post.platform}`}>
                  {post.platform}
                </span>
                <span>•</span>
                <span>{formatRelativeTime(post.postedAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Categorisation & Sentiment */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {post.country && post.country !== 'Global' && (
              <Badge bg="transparent" className="badge-location px-2 py-1.5 d-flex align-items-center gap-1">
                <MapPin size={12} className="text-muted" /> {post.region !== 'Global' ? `${post.region}, ` : ''}{post.country}
              </Badge>
            )}
            <Badge bg="transparent" className="badge-category px-2 py-1.5">{post.category}</Badge>
            <span className={`badge-sentiment ${post.sentiment}`}>
              {post.sentiment}
            </span>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="ai-summary-box p-3 mb-3 rounded">
          <div className="d-flex align-items-center gap-1.5 ai-summary-title mb-1">
            <Sparkles size={14} /> <span>AI INSIGHT / SUMMARY</span>
          </div>
          <p className="mb-0 small font-italic ai-summary-text">
            {post.summary}
          </p>
        </div>

        {/* Main Post Text Content */}
        <Card.Text as="div" className="my-3 card-main-text">
          {translating ? (
            <div className="py-2 d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" variant="primary" />
              <span>Translating post into {selectedLang}...</span>
            </div>
          ) : (
            currentText
          )}
        </Card.Text>

        {/* Translation Status Bar */}
        {isTranslated && !translating && (
          <div className="mb-3 px-3 py-2 rounded translation-status-bar d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              Translated from <strong className="text-contrast">{post.language || 'Original Language'}</strong> to <strong className="text-violet">{selectedLang}</strong>
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-decoration-none text-violet fw-semibold small"
              onClick={() => handleTranslate('Original')}
            >
              Show Original
            </Button>
          </div>
        )}

        {/* Card bottom: Actions, engagement & threads */}
        <div className="d-flex justify-content-between align-items-center pt-3 mt-3 border-top card-footer-custom flex-wrap gap-3">
          {/* Left Side: Engagement Statistics */}
          <div className="d-flex align-items-center gap-4 text-muted small">
            <span className="d-flex align-items-center gap-1.5" title={`${post.likesCount} Likes`}>
              <Heart size={16} className="engagement-icon-heart" />
              {post.likesCount}
            </span>
            <span className="d-flex align-items-center gap-1.5" title={`${post.commentsCount} Comments`}>
              <MessageCircle size={16} />
              {post.commentsCount}
            </span>
            <span className="d-flex align-items-center gap-1.5" title={`${post.sharesCount} Shares`}>
              <Share2 size={16} />
              {post.sharesCount}
            </span>
            <Badge bg="transparent" className="badge-score px-2 py-1">
              Score: {post.engagement}
            </Badge>
          </div>

          {/* Right Side: Translation Selection & External Links */}
          <div className="d-flex align-items-center gap-3">
            {/* Translation Dropdown selector */}
            <div className="d-flex align-items-center gap-1 input-group-custom px-2 py-1 rounded">
              <Globe size={14} className="text-muted" />
              <Form.Select 
                size="sm" 
                className="border-0 bg-transparent text-muted fw-semibold p-0 pe-4 m-0 shadow-none select-custom"
                value={selectedLang}
                onChange={(e) => handleTranslate(e.target.value)}
                disabled={translating}
              >
                <option value="Original">Translate</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </Form.Select>
            </div>

            {/* Link to external post source */}
            <a 
              href={post.postUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-sm btn-outline-custom d-flex align-items-center gap-1"
            >
              <ExternalLink size={12} /> Source
            </a>

            {/* Clustered Similar Threads Button */}
            {post.thread && post.thread.length > 0 && (
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="btn-similar-threads d-flex align-items-center gap-1"
                onClick={() => setOpenThread(!openThread)}
              >
                {openThread ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Similar Threads ({post.thread.length})
              </Button>
            )}
          </div>
        </div>

        {/* Similar Posts Cluster Drawer */}
        <Collapse in={openThread}>
          <div className="mt-3 pt-3 border-top cluster-drawer p-3 rounded">
            <h6 className="cluster-drawer-title mb-3 d-flex align-items-center gap-1.5 small fw-bold">
              <ShieldAlert size={14} /> CLUSTERED DUPLICATE / SIMILAR POSTS ({post.thread?.length}):
            </h6>
            <div className="d-flex flex-column gap-3">
              {post.thread?.map((childPost) => (
                <div key={childPost._id} className="pb-3 border-bottom cluster-drawer-item last-border-none">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold text-contrast small">@{childPost.authorHandle}</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatRelativeTime(childPost.postedAt)}
                      </span>
                      <span className="badge badge-score px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                        Score: {childPost.engagement}
                      </span>
                    </div>
                  </div>
                  <p className="mb-0 text-muted small" style={{ whiteSpace: 'pre-line' }}>{childPost.originalText}</p>
                </div>
              ))}
            </div>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
}

export default PostCard;