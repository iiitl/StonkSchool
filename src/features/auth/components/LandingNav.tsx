'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthNavbar } from '@/features/auth';

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="nav">
      <div className="logo">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="10" fill="#00B386" />
          <path d="M11 18L16 23L25 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="logo-text">StonkSchool</span>
      </div>
      <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <Link href="/cfd" className="nav-link">CFD Trading</Link>
        <a href="#features" className="nav-link">Features</a>
        <a href="#safety" className="nav-link">Safety</a>
        <AuthNavbar variant="dark" />
      </div>
    </nav>
  );
}
