import Link from 'next/link';
import { Metadata } from 'next';
import './landing.css';

export const metadata: Metadata = {
  title: 'StonkSchool | Learn Trading Without Risk',
  description: 'Practice trading with virtual money, compete in skill-based contests, and master the markets.',
};

export default function Home() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <header className="hero">
        <nav className="nav">
          <div className="logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#00B386"/>
              <path d="M11 18L16 23L25 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="logo-text">StonkSchool</span>
          </div>
          <div className="nav-links">
            <Link href="/cfd" className="nav-link">CFD Trading</Link>
            <a href="#features" className="nav-link">Features</a>
            <a href="#safety" className="nav-link">Safety</a>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">🎓 Learn • 📈 Practice • 🏆 Compete</div>
          <h1 className="hero-title">
            Master Trading
            <span className="gradient-text"> Without Risk</span>
          </h1>
          <p className="hero-subtitle">
            Experience real market dynamics with virtual capital. 
            Learn CFD trading, leverage, and margin management in a safe environment.
          </p>
          <div className="hero-buttons">
            <Link href="/cfd" className="btn-primary">
              Start Trading Now
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="#features" className="btn-secondary">
              Explore Features
            </a>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">$10,000</span>
              <span className="stat-label">Virtual Capital</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">3</span>
              <span className="stat-label">Crypto Assets</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">50x</span>
              <span className="stat-label">Max Leverage</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="trading-preview">
            <div className="preview-header">
              <div className="preview-dot red" />
              <div className="preview-dot yellow" />
              <div className="preview-dot green" />
              <span>CFD Trading Terminal</span>
            </div>
            <div className="preview-content">
              <div className="preview-asset">
                <span className="asset-name">BTC/USD</span>
                <span className="asset-price">$43,250.50</span>
                <span className="asset-change positive">+2.34%</span>
              </div>
              <div className="preview-chart">
                <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                  <path 
                    d="M0,50 L20,45 L40,48 L60,35 L80,38 L100,25 L120,28 L140,15 L160,18 L180,10 L200,5" 
                    fill="none" 
                    stroke="#00B386" 
                    strokeWidth="2"
                  />
                  <path 
                    d="M0,50 L20,45 L40,48 L60,35 L80,38 L100,25 L120,28 L140,15 L160,18 L180,10 L200,5 L200,60 L0,60 Z" 
                    fill="url(#heroGradient)"
                  />
                  <defs>
                    <linearGradient id="heroGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00B386" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#00B386" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="preview-actions">
                <button className="preview-btn long">Long 10x</button>
                <button className="preview-btn short">Short 10x</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Everything You Need to Learn Trading</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-Time Charts</h3>
            <p>Watch price movements with live bid/ask spreads and OHLC data.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Leverage Trading</h3>
            <p>Practice with 2x to 50x leverage and understand margin requirements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Risk Management</h3>
            <p>Set stop-loss and take-profit orders. Learn to protect your capital.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Long & Short</h3>
            <p>Profit from both rising and falling markets with CFD positions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Margin Calculator</h3>
            <p>See required margin and liquidation prices before you trade.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Margin Alerts</h3>
            <p>Get warnings before your positions get liquidated.</p>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="safety-section">
        <div className="safety-content">
          <h2>Learn Without Fear</h2>
          <p>
            Real trading involves real risks. StonkSchool lets you experience 
            the excitement of trading with virtual money, so you can make 
            mistakes and learn from them without losing a single rupee.
          </p>
          <ul className="safety-list">
            <li>✅ No real money required</li>
            <li>✅ Experience real market dynamics</li>
            <li>✅ Understand leverage and margin</li>
            <li>✅ Build confidence before going live</li>
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Start Learning?</h2>
        <p>Jump into the CFD trading simulator with $10,000 virtual capital.</p>
        <Link href="/cfd" className="btn-primary large">
          Open Trading Terminal
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#00B386"/>
              <path d="M11 18L16 23L25 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>StonkSchool</span>
          </div>
          <p className="footer-disclaimer">
            For educational purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
