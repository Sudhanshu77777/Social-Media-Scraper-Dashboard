import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, InputGroup, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Search, Filter, Download, RefreshCw, BarChart3, ShieldAlert, CheckCircle2, List, MessageSquare, Globe, AlertTriangle, Activity } from 'lucide-react';
import axios from 'axios';
import PostCard from './PostCard';

const API_BASE = 'http://localhost:5000/api';

function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    totalActive: 0,
    totalGibberish: 0,
    platforms: [],
    categories: [],
    sentiments: [],
    countries: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSentiment, setSelectedSentiment] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [sortBy, setSortBy] = useState('postedAt'); // 'postedAt' or 'engagement'
  
  // Navigation Tabs: 'feed' (Unified), 'clusters' (Clustered), 'spam' (Gibberish Bin)
  const [activeTab, setActiveTab] = useState('feed'); 

  // Language lists for filter dropdown
  const languagesList = ['English', 'Hindi', 'Punjabi', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Russian', 'Japanese'];
  
  // Country lists for filter dropdown
  const countriesList = ['India', 'USA', 'Canada', 'UK', 'Australia'];

  // Categories list
  const categoriesList = ['Application', 'Renewal', 'Appointments', 'Tatkal', 'Visa', 'Travel Issues', 'Government Announcements', 'Scams/Fraud', 'News', 'Personal Experiences'];

  // Fetch posts and stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPlatform !== 'All') params.append('platform', selectedPlatform);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedSentiment !== 'All') params.append('sentiment', selectedSentiment);
      if (selectedLanguage !== 'All') params.append('language', selectedLanguage);
      if (selectedCountry !== 'All') params.append('country', selectedCountry);
      params.append('sortBy', sortBy);

      // Determine gibberish filtering based on tab
      if (activeTab === 'spam') {
        params.append('isGibberish', 'true');
      } else {
        params.append('isGibberish', 'false');
      }

      const endpoint = activeTab === 'clusters' ? `${API_BASE}/clusters` : `${API_BASE}/posts`;
      
      // Perform requests in parallel
      const [postsRes, statsRes] = await Promise.all([
        axios.get(`${endpoint}?${params.toString()}`),
        axios.get(`${API_BASE}/stats`)
      ]);

      if (postsRes.data.success) {
        setPosts(postsRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedPlatform, selectedCategory, selectedSentiment, selectedLanguage, selectedCountry, sortBy, activeTab]);

  // Effect to load data on filter change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  // Handle Manual Refresh / Trigger Scrape
  const handleTriggerScrape = async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(`${API_BASE}/scrape/trigger`);
      if (response.data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error triggering scrape:', error);
      alert('Failed to trigger manual scraping. Ensure backend is running.');
    } finally {
      setRefreshing(false);
    }
  };

  // Client-side CSV generation
  const exportToCSV = () => {
    const headers = ['Platform,Author,Text,Category,Sentiment,Language,Region,Country,Likes,Comments,Shares,EngagementScore,PostedAt\n'];
    const rows = posts.map(p => 
      `"${p.platform}","${p.authorHandle}","${p.originalText.replace(/"/g, '""')}","${p.category}","${p.sentiment}","${p.language || 'English'}","${p.region || 'Global'}","${p.country || 'Global'}",${p.likesCount || 0},${p.commentsCount || 0},${p.sharesCount || 0},${p.engagement || 0},"${p.postedAt}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Passport_Intelligence_Report_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

  // Calculate Sentiment Score
  const getSentimentScore = () => {
    if (!stats.sentiments || stats.sentiments.length === 0) return 0;
    const positiveObj = stats.sentiments.find(s => s._id === 'Positive');
    const positiveCount = positiveObj ? positiveObj.count : 0;
    const totalCount = stats.sentiments.reduce((acc, curr) => acc + curr.count, 0);
    return totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0;
  };

  return (
    <Container fluid className="px-4 py-4 min-vh-100 main-container">
      {/* Hidden print header for PDF formatting */}
      <div className="print-header">
        <h1>Passport Intelligence Dashboard</h1>
        <p>Generated on {new Date().toLocaleString()} • Aggregated Social Media Passport Feeds (Last 24 Hours)</p>
      </div>

      {/* Main Top Header: Title & Actions */}
      <Row className="mb-4 align-items-center no-print">
        <Col md={7}>
          <div className="d-flex align-items-center gap-3">
            <div className="header-icon-wrapper text-violet">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="fw-extrabold m-0 gradient-text" style={{ fontSize: '1.85rem' }}>Passport Intel Monitor</h2>
              <p className="text-muted m-0 small">Aggregating real-time content, translations, and NLP insights across social networks</p>
            </div>
          </div>
        </Col>
        
        {/* Actions panel */}
        <Col md={5} className="text-md-end mt-3 mt-md-0 d-flex justify-content-md-end gap-2 flex-wrap">
          <Button 
            variant="transparent" 
            className="btn-outline-custom d-inline-flex align-items-center gap-2" 
            onClick={() => window.print()}
          >
            <Download size={16} /> Export PDF Report
          </Button>
          
          <Button 
            variant="transparent" 
            className="btn-success-custom d-inline-flex align-items-center gap-2 border-0" 
            onClick={exportToCSV}
          >
            <Download size={16} /> Export Feed (.CSV)
          </Button>
          
          <Button 
            variant="transparent" 
            className="btn-violet-custom pulse-button-glow d-inline-flex align-items-center gap-2 border-0" 
            onClick={handleTriggerScrape}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> 
            {refreshing ? 'Scraping...' : 'Trigger Scrape'}
          </Button>
        </Col>
      </Row>

      {/* Key Analytical Stats Widgets */}
      <Row className="mb-4 no-print">
        {/* Active Feeds Count */}
        <Col lg={3} md={6} className="mb-3 mb-lg-0">
          <Card className="glass-panel border-0 h-100">
            <Card.Body className="d-flex align-items-center gap-3.5 card-body-custom">
              <div className="stat-icon-wrapper text-success">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Active Streams</small>
                <h3 className="fw-bold m-0 stat-count mt-0.5">{stats.totalActive} Posts</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Blocked Spam/Gibberish count */}
        <Col lg={3} md={6} className="mb-3 mb-lg-0">
          <Card className="glass-panel border-0 h-100">
            <Card.Body className="d-flex align-items-center gap-3.5 card-body-custom">
              <div className="stat-icon-wrapper text-danger">
                <ShieldAlert size={24} />
              </div>
              <div>
                <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Spam Filtered</small>
                <h3 className="fw-bold m-0 stat-count mt-0.5">{stats.totalGibberish} Blocked</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Positive Sentiment Indicator */}
        <Col lg={3} md={6} className="mb-3 mb-lg-0">
          <Card className="glass-panel border-0 h-100">
            <Card.Body className="d-flex align-items-center gap-3.5 card-body-custom">
              <div className="stat-icon-wrapper text-warning">
                <Activity size={24} />
              </div>
              <div>
                <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Positive Index</small>
                <h3 className="fw-bold m-0 stat-count mt-0.5">{getSentimentScore()}% Positive</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Platform distribution chart bar */}
        <Col lg={3} md={6} className="mb-3 mb-lg-0">
          <Card className="glass-panel border-0 h-100">
            <Card.Body className="d-flex flex-column justify-content-center card-body-custom">
              <small className="text-muted text-uppercase fw-bold mb-2 d-block" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Platform Origin Distribution</small>
              <div className="custom-progress">
                {stats.platforms.map((p, idx) => {
                  const percent = stats.totalActive > 0 ? (p.count / stats.totalActive) * 100 : 0;
                  const colors = ['#1d9bf0', '#ff4500', '#ff0000', '#1877f2', '#e1306c', '#0a66c2', '#00f2fe', '#8b5cf6'];
                  return (
                    <div 
                      key={p._id} 
                      className="custom-progress-bar" 
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: colors[idx % colors.length] 
                      }}
                      title={`${p._id}: ${p.count} (${Math.round(percent)}%)`}
                    />
                  );
                })}
              </div>
              <div className="d-flex flex-wrap gap-2 mt-2" style={{ fontSize: '0.65rem' }}>
                {stats.platforms.slice(0, 4).map((p, idx) => {
                  const colors = ['#1d9bf0', '#ff4500', '#ff0000', '#1877f2', '#e1306c', '#0a66c2', '#00f2fe', '#8b5cf6'];
                  return (
                    <span key={p._id} className="d-flex align-items-center gap-1 text-muted">
                      <span className="rounded-circle d-inline-block" style={{ width: '6px', height: '6px', backgroundColor: colors[idx % colors.length] }} />
                      {p._id} ({p.count})
                    </span>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Layout */}
      <Row>
        {/* Left Side: Filter Panels */}
        <Col lg={3} className="mb-4 no-print">
          <Card className="glass-panel border-0 sticky-top" style={{ top: '24px', zIndex: 10 }}>
            <Card.Body className="p-4 card-body-custom">
              <h5 className="mb-3 fw-bold d-flex align-items-center gap-2 filter-sidebar-title">
                <Filter size={18} className="text-violet" /> 
                <span>Feed Filters</span>
              </h5>
              
              {/* Keyword Search */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Keyword Search</Form.Label>
                <InputGroup size="sm" className="input-group-custom rounded">
                  <InputGroup.Text className="bg-transparent border-0 text-muted"><Search size={14} /></InputGroup.Text>
                  <Form.Control 
                    className="bg-transparent border-0 shadow-none control-custom"
                    placeholder="Search text, handle..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>

              {/* Sorting */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Sort By</Form.Label>
                <Form.Select 
                  size="sm" 
                  className="select-custom shadow-none"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="postedAt">Newest First</option>
                  <option value="engagement">Highest Engagement</option>
                </Form.Select>
              </Form.Group>

              {/* Platform Filter */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Platform Origin</Form.Label>
                <Form.Select 
                  size="sm" 
                  className="select-custom shadow-none"
                  value={selectedPlatform} 
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                >
                  <option value="All">All Social Networks</option>
                  <option value="Twitter">Twitter/X</option>
                  <option value="Reddit">Reddit</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="TikTok">TikTok</option>
                </Form.Select>
              </Form.Group>

              {/* Category Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Category Type</Form.Label>
                <Form.Select 
                  size="sm" 
                  className="select-custom shadow-none"
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Uncategorized">Uncategorized</option>
                </Form.Select>
              </Form.Group>

              {/* Sentiment Selector */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Sentiment Tag</Form.Label>
                <Form.Select 
                  size="sm" 
                  className="select-custom shadow-none"
                  value={selectedSentiment} 
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                >
                  <option value="All">All Sentiments</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </Form.Select>
              </Form.Group>

              {/* Language Filter */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Detected Language</Form.Label>
                <Form.Select 
                  size="sm" 
                  className="select-custom shadow-none"
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="All">All Languages</option>
                  {languagesList.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Country Selector */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Region/Country</Form.Label>
                <Form.Select 
                  size="sm" 
                  className="select-custom shadow-none"
                  value={selectedCountry} 
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="All">All Locations</option>
                  {countriesList.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Reset Filters */}
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="w-100 btn-reset-custom"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPlatform('All');
                  setSelectedCategory('All');
                  setSelectedSentiment('All');
                  setSelectedLanguage('All');
                  setSelectedCountry('All');
                  setSortBy('postedAt');
                }}
              >
                Reset Filters
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side: Feed & Threads */}
        <Col lg={9}>
          {/* Custom Tabs Navigation */}
          <div className="nav-tabs-custom no-print">
            <button 
              className={`tab-btn d-flex align-items-center gap-2 ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <List size={16} /> Unified Feed
            </button>
            <button 
              className={`tab-btn d-flex align-items-center gap-2 ${activeTab === 'clusters' ? 'active' : ''}`}
              onClick={() => setActiveTab('clusters')}
            >
              <MessageSquare size={16} /> Clustered View
            </button>
            <button 
              className={`tab-btn d-flex align-items-center gap-2 ${activeTab === 'spam' ? 'active' : ''}`}
              onClick={() => setActiveTab('spam')}
            >
              <ShieldAlert size={16} /> Spam Bin
            </button>
          </div>

          {/* Active Tab Notice (e.g. for Spam Bin) */}
          {activeTab === 'spam' && (
            <Alert className="alert-custom p-3 mb-4 d-flex gap-3 no-print">
              <AlertTriangle className="flex-shrink-0" size={20} />
              <div>
                <strong className="d-block mb-0.5">Spam & Gibberish Quarantine Bin</strong>
                <span className="small text-muted">These posts were flagged by the NLP classifier as spam advertisements, bot accounts, or keyboard-smashed text. They are excluded from the main feeds automatically.</span>
              </div>
            </Alert>
          )}

          {/* Feed List Render */}
          {loading ? (
            <div className="text-center py-5 text-muted glass-panel border-0 p-5 d-flex flex-column align-items-center justify-content-center gap-3">
              <Spinner animation="border" variant="primary" style={{ color: 'var(--color-violet)' }} />
              <span>Analyzing and categorizing passport intelligence streams...</span>
            </div>
          ) : posts.length === 0 ? (
            <Card className="text-center p-5 border-0 glass-panel text-muted d-flex flex-column align-items-center justify-content-center">
              <ShieldAlert size={48} className="text-muted mb-3" />
              <h5 className="fw-bold mb-1 card-author-handle">No Posts Found</h5>
              <p className="mb-0 small">No social streams correspond to your selected filters or search terms.</p>
            </Card>
          ) : (
            <div>
              {posts.map(post => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;