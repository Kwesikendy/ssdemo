import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="relative login-hero-bg text-white">
      {/* subtle dark overlay for contrast over the image */}
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between py-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="SmartScript Logo" className="h-9 w-9 object-contain drop-shadow-lg" style={{ mixBlendMode: 'multiply' }} />
            <span className="text-lg font-semibold tracking-tight">SmartScript</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" active={isActive('/')}>Home</NavLink>
            <a href="/#features" className="hover:text-white/90 transition hidden sm:inline">Features</a>
            <NavLink to="/pricing" active={isActive('/pricing')}>Pricing</NavLink>
            <Link to="/login" className="hover:text-white/90 transition">Sign in</Link>
            <Link to="/signup" className="inline-flex items-center rounded-md bg-white text-gray-900 px-4 py-2 text-sm font-medium shadow hover:bg-white/90 transition ring-1 ring-white/30">
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <div className="md:hidden pb-4">
            <div className="space-y-1 rounded-lg bg-white/10 backdrop-blur p-3 ring-1 ring-white/20">
              <MobileLink to="/" onClick={() => setOpen(false)} active={isActive('/')}>Home</MobileLink>
              <a href="/#features" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md hover:bg-white/10">Features</a>
              <MobileLink to="/pricing" onClick={() => setOpen(false)} active={isActive('/pricing')}>Pricing</MobileLink>
              <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md hover:bg-white/10">Sign in</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md bg-white text-gray-900 font-medium text-center ring-1 ring-white/30">Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }){
  return (
    <Link
      to={to}
      className={`hover:text-white/90 transition ${active ? 'text-white' : 'text-white/90'}`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, active, children }){
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2 rounded-md hover:bg-white/10 ${active ? 'bg-white/10' : ''}`}
    >
      {children}
    </Link>
  );
}
