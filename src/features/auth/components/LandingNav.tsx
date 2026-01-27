'use client';

import Link from 'next/link';
import { AuthNavbar } from '@/features/auth';

export function LandingNav() {
  return (
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
        <AuthNavbar variant="dark" />
      </div>
    </nav>
  );
}
